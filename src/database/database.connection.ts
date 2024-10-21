import { Injectable } from '@nestjs/common';
import { connect, Connection, Mongoose } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseConnection {
  private connection: Connection;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    const mongoose: Mongoose = await connect(process.env.MONGODB_URI as string);
    this.connection = mongoose.connection;
  }

  getConnection(): Connection {
    return this.connection;
  }
}