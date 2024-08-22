import { Module } from '@nestjs/common';
import { AuctionsModule } from './auctions';
import { EventModule } from './event';
import { QueueModule } from './queue';
import { NotificationsModule } from './notifications';

@Module({
  imports: [AuctionsModule, EventModule, QueueModule, NotificationsModule],
})
export class AppModule {}
