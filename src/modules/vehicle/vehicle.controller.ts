import { Controller, Get, HttpException, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { VehicleService } from './vehicle.service';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post('fetch-and-transform')
  async fetchAndTransformData(@Res() res: Response): Promise<void> {
    try {
      const result = await this.vehicleService.enqueueFetchAndTransform();
      if ('statusCode' in result) {
        res.status(result.statusCode).json({ message: result.message });
      } else {
        res.status(201).json({ jobId: result.jobId });
      }
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to enqueue fetch and transform data process' });
    }
  }

  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string, @Res() res: Response): Promise<void> {
    try {
      const status = await this.vehicleService.getJobStatus(jobId);
      res.status(200).json({ jobId, status });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to get job status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}