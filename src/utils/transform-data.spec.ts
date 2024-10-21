import { Test, TestingModule } from '@nestjs/testing';
import { TransformData } from './transform-data';
import { FetchData } from './fetch-data';
import { Logger } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

jest.mock('xml2js', () => ({
  parseStringPromise: jest.fn(),
}));

describe('TransformData', () => {
  let service: TransformData;
  let fetchDataService: FetchData;
  let logger: Logger;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransformData,
        {
          provide: FetchData,
          useValue: {
            fetchAllVehicleTypesData: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<TransformData>(TransformData);
    fetchDataService = module.get<FetchData>(FetchData);
    logger = module.get<Logger>(Logger);
  });

  it('should log an error and throw if makesData structure is invalid', async () => {
    const invalidData = {};  // Simulating an invalid data structure

    await expect(service.transformData(invalidData)).rejects.toThrow('Invalid makes data structure');

    // This part should be checked
    expect(logger.error).toHaveBeenCalledWith('Invalid makes data structure');
    expect(logger.error).toHaveBeenCalledTimes(1); // Ensure it's called once
  });

  it('should transform data correctly', async () => {
    const makesData = {
      Response: {
        Results: [
          {
            AllVehicleMakes: [
              { Make_ID: ['1'], Make_Name: ['Make1'] },
              { Make_ID: ['2'], Make_Name: ['Make2'] },
            ],
          },
        ],
      },
    };

    const vehicleTypesDataXml = ['<xml>data1</xml>', '<xml>data2</xml>'];
    const vehicleTypesData = [
      {
        Response: {
          Results: [
            {
              VehicleTypesForMakeIds: [
                { VehicleTypeId: ['1'], VehicleTypeName: ['Type1'] },
              ],
            },
          ],
        },
      },
      {
        Response: {
          Results: [
            {
              VehicleTypesForMakeIds: [
                { VehicleTypeId: ['2'], VehicleTypeName: ['Type2'] },
              ],
            },
          ],
        },
      },
    ];

    jest.spyOn(fetchDataService, 'fetchAllVehicleTypesData').mockResolvedValue(vehicleTypesDataXml);
    (parseStringPromise as jest.Mock).mockImplementation((xml: string) => {
      if (xml === '<xml>data1</xml>') return vehicleTypesData[0];
      if (xml === '<xml>data2</xml>') return vehicleTypesData[1];
    });

    const result = await service.transformData(makesData);

    expect(result).toEqual([
      {
        makeId: '1',
        makeName: 'Make1',
        vehicleTypes: [
          { typeId: '1', typeName: 'Type1' },
        ],
      },
      {
        makeId: '2',
        makeName: 'Make2',
        vehicleTypes: [
          { typeId: '2', typeName: 'Type2' },
        ],
      },
    ]);

    expect(logger.log).toHaveBeenCalledWith('Starting data transformation process');
    expect(fetchDataService.fetchAllVehicleTypesData).toHaveBeenCalledWith(['1', '2']);
    expect(parseStringPromise).toHaveBeenCalledTimes(2);
  });
});