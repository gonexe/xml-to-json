import { Resolver, Query } from '@nestjs/graphql';
import { VehicleService } from './vehicle.service';
import { Vehicle } from '../graphql/graphql.schema';

@Resolver(() => Vehicle)
export class VehicleResolver {
    constructor(private readonly vehicleService: VehicleService) {}

    @Query(() => [Vehicle])
    async vehicles(): Promise<Vehicle[]> {
        return this.vehicleService.findAll();
    }
}