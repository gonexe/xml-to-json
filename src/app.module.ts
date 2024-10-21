import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { DatabaseModule } from './database/database.module';
import {GraphqlModule} from "./modules/graphql/graphql.module";
import {BullModule} from "@nestjs/bull";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    VehicleModule,
    DatabaseModule,
    GraphqlModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}