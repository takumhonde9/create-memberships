import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueConfig } from '../queue/config';
import { EventService } from './event.service';
import { QueueService, SQSService } from '../queue';
import { AuctionsService } from '../auctions';

describe('EventModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test', '.env'],
          load: [QueueConfig],
        }),
      ],
      providers: [EventService, AuctionsService, QueueService, SQSService],
    }).compile();

    expect(module).toBeDefined();

    expect(module.get(ConfigService)).toBeInstanceOf(ConfigService);
    expect(module.get(EventService)).toBeInstanceOf(EventService);
    expect(module.get(QueueService)).toBeInstanceOf(QueueService);
  });
});
