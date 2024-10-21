export class CreateVehicleDto {
  makeId: string;
  makeName: string;
  vehicleTypes: {
    typeId: string;
    typeName: string;
  }[];
}