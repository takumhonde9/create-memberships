import { Test, TestingModule } from '@nestjs/testing';
import { SQSService } from './sqs.service';
import { ConfigModule } from '@nestjs/config';
import { mockClient } from 'aws-sdk-client-mock';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { QueueConfigSchema } from '../../schema';
import { QueueConfig } from '../../config';

import 'aws-sdk-client-mock-jest';

// mock the SQS service.
const mockSQS = mockClient(SQSClient);
describe('QueueService', () => {
  let service: SQSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test', '.env'],
          validationSchema: QueueConfigSchema,
          load: [QueueConfig],
        }),
      ],
      providers: [SQSService],
    }).compile();

    service = module.get<SQSService>(SQSService);

    // reset sqs
    mockSQS.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteMessage', () => {
    it('should delete message from queue', async () => {
      mockSQS.on(DeleteMessageCommand).resolves({});

      await service.deleteMessage('message-handle');

      expect(mockSQS).toHaveReceivedCommandTimes(DeleteMessageCommand, 1);
      expect(mockSQS).toHaveReceivedCommandWith(DeleteMessageCommand, {
        QueueUrl: process.env.AWS_SQS_QUEUE_URL,
        ReceiptHandle: 'message-handle',
      });
    });
  });
});
