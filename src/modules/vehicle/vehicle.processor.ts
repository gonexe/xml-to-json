import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { VehicleFetchService } from './vehicle-fetch.service';
import { Logger } from '@nestjs/common';
import { VehicleGateway } from './vehicle.gateway';

@Processor('vehicle')
export class VehicleProcessor {
  private readonly logger = new Logger(VehicleFetchService.name);

  constructor(
    private readonly vehicleFetchService: VehicleFetchService,
    private readonly vehicleGateway: VehicleGateway,
  ) {}

  @Process('fetch-and-transform')
  async handleFetchAndTransform(job: Job): Promise<void> {
    this.logger.log('Queue job started');
    try {
      const status = await this.vehicleFetchService.fetchAndTransformData();
      if (status === 'success') {
        this.vehicleGateway.emitSuccess(job.id.toString());
      } else {
        this.vehicleGateway.emitPartialSuccess(job.id.toString());
      }
    } catch (error) {
      this.vehicleGateway.emitError(job.id.toString());
    }
  }
}