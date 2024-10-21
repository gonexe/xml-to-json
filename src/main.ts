import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import {Queue} from "bull";
import {getQueueToken} from "@nestjs/bull";
import {setupBullBoard} from "./bull-board";

dotenv.config();

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const vehicleQueue = app.get<Queue>(getQueueToken('vehicle'));
  setupBullBoard(app, vehicleQueue);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();