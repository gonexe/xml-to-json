import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import CircuitBreaker = require('opossum');
import { from, lastValueFrom } from 'rxjs';
import { parseStringPromise } from 'xml2js';
import { HttpService } from './http-service';

@Injectable()
export class FetchData {
  private readonly logger = new Logger(FetchData.name);
  private limit: any;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly makesUri: string;
  private readonly vehicleTypesUri: string;

  constructor(private readonly httpService: HttpService) {
    this.makesUri = process.env.MAKES_URI || '';
    this.vehicleTypesUri = process.env.VEHICLE_TYPES_URI || '';

    this.circuitBreaker = new CircuitBreaker(
      this.fetchVehicleTypesData.bind(this),
      {
        timeout: 3000, // 3 seconds
        errorThresholdPercentage: 50,
        resetTimeout: 30000, // 30 seconds
      },
    );

    this.circuitBreaker.fallback((error) => {
      this.logger.error('Circuit breaker fallback triggered', error);
      throw new InternalServerErrorException(
        'Service is currently unavailable',
      );
    });

    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker opened');
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.warn('Circuit breaker half-open');
    });

    this.circuitBreaker.on('close', () => {
      this.logger.log('Circuit breaker closed');
    });
  }

  private async initializePLimit(): Promise<void> {
    const { default: pLimit } = await import('p-limit');
    this.limit = pLimit(5);
  }

  async fetchMakesData(): Promise<any> {
    try {
      const makesUriComplete = `${this.makesUri}?format=XML`;

      this.logger.log(`Fetching makes data from ${makesUriComplete}`);
      const makesResponse = await lastValueFrom(
        from(this.httpService.get(makesUriComplete)),
      );

      return parseStringPromise(makesResponse.data);
    } catch (error: any) {
      this.logger.error('Failed to fetch makes data', error.stack);
      throw new InternalServerErrorException('Failed to fetch makes data');
    }
  }

  async fetchVehicleTypesData(makeId: string): Promise<any> {
    try {
      const vehicleTypesUriComplete = `${this.vehicleTypesUri}/${makeId}?format=xml`;

      this.logger.log(
        `Fetching vehicle types data for make ID: ${makeId} from ${vehicleTypesUriComplete}`,
      );
      const vehicleTypesResponse = await lastValueFrom(
        from(this.httpService.get(vehicleTypesUriComplete)),
      );
      this.logger.log(
        `Fetched vehicle types data for make ID: ${makeId} successfully`,
      );

      return vehicleTypesResponse.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch vehicle types data for make ID: ${makeId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to fetch vehicle types data for make ID: ${makeId}`,
      );
    }
  }

  async fetchAllVehicleTypesData(makeIds: string[], retries = 3, delay = 5000): Promise<any[]> {

    await this.initializePLimit();

    const results = [];

    for (const makeId of makeIds) {
      results.push(this.retryFetch(makeId, retries, delay));
    }
    return Promise.all(results);
  }

  private async retryFetch(makeId: string, retries: number, delay: number): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.limit(() => this.circuitBreaker.fire(makeId));
      } catch (error) {
        if (attempt < retries) {
          this.logger.warn(`Retrying fetch for make ID: ${makeId} (attempt ${attempt} of ${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error(`Failed to fetch data for make ID: ${makeId} after ${retries} attempts`);
          throw error;
        }
      }
    }
  }
}