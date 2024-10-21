import { Test, TestingModule } from '@nestjs/testing';
import { VehicleFetchService } from './vehicle-fetch.service';
import { FetchData } from '../../utils/fetch-data';
import { TransformData } from '../../utils/transform-data';
import { VehicleService } from './vehicle.service';
import { Logger } from '@nestjs/common';
import { Vehicle } from './vehicle.schema';

describe('VehicleFetchService', () => {
  let service: VehicleFetchService;
  let fetchData: FetchData;
  let transformData: TransformData;
  let vehicleService: VehicleService;
  let logger: Logger;

  beforeEach(async () => {
    logger = { log: jest.fn(), error: jest.fn() } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleFetchService,
        {
          provide: FetchData,
          useValue: {
            fetchMakesData: jest.fn(),
          },
        },
        {
          provide: TransformData,
          useValue: {
            transformData: jest.fn(),
          },
        },
        {
          provide: VehicleService,
          useValue: {
            insertMany: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<VehicleFetchService>(VehicleFetchService);
    fetchData = module.get<FetchData>(FetchData);
    transformData = module.get<TransformData>(TransformData);
    vehicleService = module.get<VehicleService>(VehicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchAndTransformData', () => {
    it('should return success when data is fetched and transformed successfully', async () => {
      const makesData = {
        Response: {
          Count: ['1000'],
          Results: [
            {
              AllVehicleMakes: new Array(1000).fill({}),
            },
          ],
        },
      };
      const transformedData: Vehicle[] = [{} as Vehicle];

      jest.spyOn(fetchData, 'fetchMakesData').mockResolvedValue(makesData);
      jest.spyOn(transformData, 'transformData').mockResolvedValue(transformedData);
      jest.spyOn(vehicleService, 'insertMany').mockResolvedValue(undefined);

      const result = await service.fetchAndTransformData();

      expect(result).toBe('success');
      expect(fetchData.fetchMakesData).toHaveBeenCalled();
      expect(transformData.transformData).toHaveBeenCalled();
      expect(vehicleService.insertMany).toHaveBeenCalled();
    });

    it('should return partialSuccess when an error occurs during the process', async () => {
      const errorMessage = 'Failed to fetch data';
      jest.spyOn(fetchData, 'fetchMakesData').mockRejectedValue(new Error(errorMessage));

      const result = await service.fetchAndTransformData();

      expect(result).toBe('partialSuccess');

      expect(logger.error).toHaveBeenCalledWith(
          'Error during fetch and transform data process',
          errorMessage,
      );
    });
  });
});