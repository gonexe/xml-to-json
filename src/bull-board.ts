import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { createBullBoard } from '@bull-board/api';
import { Queue } from 'bull';
import { INestApplication } from '@nestjs/common';

export function setupBullBoard(app: INestApplication, vehicleQueue: Queue) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
        queues: [new BullAdapter(vehicleQueue)],
        serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());
}