import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { AuctionsModule } from '../auctions';
import { QueueModule } from '../queue';
import { ConfigModule } from '@nestjs/config';
import { QueueConfig } from '../queue/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [QueueConfig],
    }),
    AuctionsModule,
    QueueModule,
  ],
  providers: [EventService],
})
export class EventModule {}
