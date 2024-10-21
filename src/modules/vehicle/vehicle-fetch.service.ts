import { Injectable, Logger } from '@nestjs/common';
import { FetchData } from '../../utils/fetch-data';
import { TransformData } from '../../utils/transform-data';
import { VehicleService } from './vehicle.service';
import { Vehicle } from './vehicle.schema';

@Injectable()
export class VehicleFetchService {
  private readonly logger: Logger;

  constructor(
      private readonly fetchData: FetchData,
      private readonly transformData: TransformData,
      private readonly vehicleService: VehicleService,
      logger?: Logger,
  ) {
    this.logger = logger || new Logger(VehicleFetchService.name);
  }

  async fetchAndTransformData(): Promise<'success' | 'partialSuccess'> {
    try {
      this.logger.log('Executing fetch data process');
      const makesData = await this.fetchData.fetchMakesData();

      const count = parseInt(makesData.Response.Count[0], 10);
      const chunkSize = Math.ceil(count * 0.0009);
      const allVehicleMakes = makesData.Response.Results[0].AllVehicleMakes;

      for (let i = 0; i < allVehicleMakes.length; i += chunkSize) {
        const chunk = allVehicleMakes.slice(i, i + chunkSize);
        const makesDataChunk = {
          Response: {
            Results: [
              {
                AllVehicleMakes: chunk,
              },
            ],
          },
        };

        this.logger.log('Executing transform data process for chunk');
        const transformedData: Vehicle[] = await this.transformData.transformData(makesDataChunk);

        this.logger.log('Inserting transformed data into the database for chunk');
        await this.vehicleService.insertMany(transformedData);
      }

      return 'success';
    } catch (error: any) {
      this.logger.error('Error during fetch and transform data process', error.message);
      return 'partialSuccess';
    }
  }
}