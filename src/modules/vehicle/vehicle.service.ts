import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from './vehicle.schema';
import { InjectModel } from '@nestjs/mongoose';
import {CreateVehicleDto} from "./dto/create-vehicle.dto";
import {InjectQueue} from "@nestjs/bull";
import {Queue} from "bull";

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
      @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
      @InjectQueue('vehicle') private readonly vehicleQueue: Queue,
  ) {}

  async enqueueFetchAndTransform() {
    try {
      const activeJobs = await this.vehicleQueue.getActive();
      if (activeJobs.length > 0) {

        this.logger.error(`A fetch and transform process is already running with job ID: ${activeJobs[0].id}`);
        const activeJobId = activeJobs[0].id;
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A fetch and transform process is already running with job ID: ${activeJobId}`,
        };
      }
      this.logger.log('Enqueuing fetch and transform data process');
      const job = await this.vehicleQueue.add('fetch-and-transform');
      return { jobId: job.id };
    } catch (error) {
      console.error(error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to enqueue fetch and transform data process',
      };
    }
  }

  async getJobStatus(jobId: string) {
    try {
      const job = await this.vehicleQueue.getJob(jobId);
      if (!job) {
        this.logger.error(`Job with ID ${jobId} not found`);
        return 'not found';
      }
      return await job.getState();
    } catch (error) {
      console.error(error);
      throw new HttpException(
          'Failed to get job status',
          HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async insertMany(vehicles: CreateVehicleDto[]): Promise<void> {
    await this.vehicleModel.insertMany(vehicles);
  }

  async findAll(): Promise<Vehicle[]> {
    this.logger.log('Fetching all vehicles');
    const vehicles = await this.vehicleModel.find().exec();
    return vehicles.map((vehicle) => ({
      makeId: vehicle.makeId,
      makeName: vehicle.makeName,
      vehicleTypes: vehicle.vehicleTypes,
    }));
  }
}