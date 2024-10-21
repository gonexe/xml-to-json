import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { Response } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('VehicleController', () => {
  let controller: VehicleController;
  let service: VehicleService;
  let response: Response;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [
        {
          provide: VehicleService,
          useValue: {
            enqueueFetchAndTransform: jest.fn(),
            getJobStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VehicleController>(VehicleController);
    service = module.get<VehicleService>(VehicleService);
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('fetchAndTransformData', () => {
    it('should return conflict if a job is already running', async () => {
      const result = { statusCode: HttpStatus.CONFLICT, message: 'A fetch and transform process is already running' };
      jest.spyOn(service, 'enqueueFetchAndTransform').mockResolvedValue(result);

      await controller.fetchAndTransformData(response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(response.json).toHaveBeenCalledWith({ message: result.message });
    });

    it('should enqueue a new job if no job is running', async () => {
      const result = { jobId: '12345' };
      jest.spyOn(service, 'enqueueFetchAndTransform').mockResolvedValue(result);

      await controller.fetchAndTransformData(response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(response.json).toHaveBeenCalledWith({ jobId: result.jobId });
    });

    it('should return internal server error on failure', async () => {
      jest.spyOn(service, 'enqueueFetchAndTransform').mockRejectedValue(new Error('Failed to enqueue'));

      await controller.fetchAndTransformData(response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.json).toHaveBeenCalledWith({ message: 'Failed to enqueue fetch and transform data process' });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status if the job exists', async () => {
      const jobId = '12345';
      const status = 'completed';
      jest.spyOn(service, 'getJobStatus').mockResolvedValue(status);

      await controller.getJobStatus(jobId, response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({ jobId, status });
    });

    it('should return internal server error on failure', async () => {
      const jobId = '12345';
      jest.spyOn(service, 'getJobStatus').mockRejectedValue(new Error('Failed to get job status'));

      await expect(controller.getJobStatus(jobId, response)).rejects.toThrow(HttpException);
    });
  });
});