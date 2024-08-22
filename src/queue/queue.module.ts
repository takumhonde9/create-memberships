import { Module } from '@nestjs/common';
import { SQSService } from './service';
import { ConfigModule } from '@nestjs/config';
import { QueueConfig } from './config';

@Module({
  imports: [ConfigModule.forRoot({ load: [QueueConfig] })],
  providers: [SQSService],
  exports: [SQSService],
})
export class QueueModule {}
