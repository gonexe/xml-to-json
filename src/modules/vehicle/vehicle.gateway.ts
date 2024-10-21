import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class VehicleGateway {
  @WebSocketServer()
  server: Server;

  emitSuccess(jobId: string) {
    this.server.emit('fetch-and-transform-success', { jobId, message: 'Data fetched and transformed successfully' });
  }

  emitError(jobId: string) {
    this.server.emit('fetch-and-transform-error', { jobId, message: 'Failed to fetch and transform data' });
  }

    emitPartialSuccess(jobId: string) {
        this.server.emit('fetch-and-transform-partial-success', { jobId, message: 'Failed to fetch and transform data' });
    }
}