import { Module } from '@nestjs/common';
import { NotificationsService, UserEventsService } from './services';
import { UserEventsUtility } from './user-events.utility';

@Module({
  providers: [NotificationsService, UserEventsService, UserEventsUtility],
  exports: [UserEventsUtility, NotificationsService],
})
export class NotificationsModule {}
