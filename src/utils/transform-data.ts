import { Injectable, Logger } from '@nestjs/common';
import { FetchData } from './fetch-data';
import { parseStringPromise } from 'xml2js';
import { Vehicle } from "../modules/vehicle/vehicle.schema";

@Injectable()
export class TransformData {
    private readonly logger: Logger;

    constructor(
        private readonly fetchDataService: FetchData,
        logger: Logger,
    ) {
        this.logger = logger;
    }

    async transformData(makesData: any): Promise<Vehicle[]> {
        this.logger.log('Starting data transformation process');

        if (
            !makesData ||
            !makesData.Response ||
            !Array.isArray(makesData.Response.Results)
        ) {
            this.logger.error('Invalid makes data structure');
            throw new Error('Invalid makes data structure');
        }

        const makeIds = makesData.Response.Results[0].AllVehicleMakes.map(
            (make: { Make_ID: string[] }) => make.Make_ID[0],
        );

        // Fetch all vehicle types data
        const vehicleTypesDataXml =
            await this.fetchDataService.fetchAllVehicleTypesData(makeIds);

        // Parse the XML data
        const vehicleTypesData = await Promise.all(
            vehicleTypesDataXml.map(async (xml: string) => {
                const result = await parseStringPromise(xml);
                return result;
            }),
        );

        return makesData.Response.Results[0].AllVehicleMakes.map(
            (
                make: {
                    Make_ID: string[];
                    Make_Name: string[];
                },
                index: number,
            ) => {
                const vehicleTypes = vehicleTypesData[index]?.Response?.Results[0]?.VehicleTypesForMakeIds?.map(
                    (type: { VehicleTypeId: string[]; VehicleTypeName: string[] }) => ({
                        typeId: type.VehicleTypeId[0],
                        typeName: type.VehicleTypeName[0],
                    }),
                ) || [];

                return {
                    makeId: make.Make_ID[0],
                    makeName: make.Make_Name[0],
                    vehicleTypes,
                };
            },
        );
    }
}