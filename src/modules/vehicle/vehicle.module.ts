import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { Vehicle, VehicleSchema } from './vehicle.schema';
import { FetchData } from '../../utils/fetch-data';
import { TransformData } from '../../utils/transform-data';
import { HttpServiceModule } from '../../utils/http-service.module';
import {VehicleFetchService} from "./vehicle-fetch.service";
import {BullModule} from "@nestjs/bull";
import {VehicleProcessor} from "./vehicle.processor";
import {VehicleGateway} from "./vehicle.gateway";
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
    HttpServiceModule,
    BullModule.registerQueue({
      name: 'vehicle',
    }),
  ],
  controllers: [VehicleController],
  providers: [VehicleService, VehicleProcessor, VehicleGateway, VehicleFetchService, FetchData, TransformData, Logger],
  exports: [VehicleService, VehicleFetchService],
})
export class VehicleModule {}