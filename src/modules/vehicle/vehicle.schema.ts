import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

@Schema()
export class Vehicle {

  @Prop({ required: true })
  makeId: string = '';

  @Prop({ required: true })
  makeName: string = '';

  @Prop({ required: true, type: [{ type: Object }] })
  vehicleTypes: VehicleType[] = [];
}

@Schema()
export class VehicleType {
  @Prop({ required: true })
  typeId: string = '';

  @Prop({ required: true })
  typeName: string = '';
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
export const VehicleTypeSchema = SchemaFactory.createForClass(VehicleType);