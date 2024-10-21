import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bull';
import { VehicleService } from './vehicle.service';
import { Vehicle } from './vehicle.schema';
import { Queue } from 'bull';
import { HttpStatus } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

describe('VehicleService', () => {
  let service: VehicleService;
  let vehicleModel: any;
  let vehicleQueue: Queue;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        {
          provide: getModelToken(Vehicle.name),
          useValue: {
            insertMany: jest.fn(),
            find: jest.fn().mockReturnValue({ exec: jest.fn() }),
          },
        },
        {
          provide: getQueueToken('vehicle'),
          useValue: {
            add: jest.fn(),
            getActive: jest.fn(),
            getJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
    vehicleModel = module.get(getModelToken(Vehicle.name));
    vehicleQueue = module.get(getQueueToken('vehicle'));
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueFetchAndTransform', () => {
    it('should return conflict if a job is already running', async () => {
      vehicleQueue.getActive = jest.fn().mockResolvedValue([{ id: '123' }]);
      const result = await service.enqueueFetchAndTransform();
      expect(result).toEqual({
        statusCode: HttpStatus.CONFLICT,
        message: 'A fetch and transform process is already running with job ID: 123',
      });
    });

    it('should enqueue a new job if no job is running', async () => {
      vehicleQueue.getActive = jest.fn().mockResolvedValue([]);
      vehicleQueue.add = jest.fn().mockResolvedValue({ id: '123' });
      const result = await service.enqueueFetchAndTransform();
      expect(result).toEqual({ jobId: '123' });
    });

    it('should return internal server error on failure', async () => {
      vehicleQueue.getActive = jest.fn().mockRejectedValue(new Error('Queue error'));
      const result = await service.enqueueFetchAndTransform();
      expect(result).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to enqueue fetch and transform data process',
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job state if job exists', async () => {
      const job = { getState: jest.fn().mockResolvedValue('completed') };
      vehicleQueue.getJob = jest.fn().mockResolvedValue(job);
      const result = await service.getJobStatus('123');
      expect(result).toBe('completed');
    });

    it('should return not found if job does not exist', async () => {
      vehicleQueue.getJob = jest.fn().mockResolvedValue(null);
      const result = await service.getJobStatus('123');
      expect(result).toBe('not found');
    });

    it('should throw an internal server error on failure', async () => {
      vehicleQueue.getJob = jest.fn().mockRejectedValue(new Error('Queue error'));
      await expect(service.getJobStatus('123')).rejects.toThrow('Failed to get job status');
    });
  });

  describe('insertMany', () => {
    it('should insert multiple vehicles', async () => {
      const vehicles: CreateVehicleDto[] = [
        { makeId: '1', makeName: 'Toyota', vehicleTypes: [{ typeId: '1', typeName: 'SUV' }] },
        { makeId: '2', makeName: 'Honda', vehicleTypes: [{ typeId: '2', typeName: 'Sedan' }] },
      ];
      await service.insertMany(vehicles);
      expect(vehicleModel.insertMany).toHaveBeenCalledWith(vehicles);
    });
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      const vehicles: Vehicle[] = [
        { makeId: '1', makeName: 'Toyota', vehicleTypes: [{ typeId: '1', typeName: 'SUV' }] },
        { makeId: '2', makeName: 'Honda', vehicleTypes: [{ typeId: '2', typeName: 'Sedan' }] },
      ];
      vehicleModel.find().exec = jest.fn().mockResolvedValue(vehicles);
      const result: Vehicle[] = await service.findAll();
      expect(result).toEqual([
        { makeId: '1', makeName: 'Toyota', vehicleTypes: [{ typeId: '1', typeName: 'SUV' }] },
        { makeId: '2', makeName: 'Honda', vehicleTypes: [{ typeId: '2', typeName: 'Sedan' }] },
      ]);
    });
  });
});