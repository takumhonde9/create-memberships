import { Test, TestingModule } from '@nestjs/testing';
import { EventService, FailureResponse, StatusResponse } from './event.service';
import { EventData, SQSEvent, SQSRecord } from './interface';
import { createResponseMessage, Messages } from '../common';
import { HttpStatus } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuctionsService } from '../auctions';
import { QueueService } from '../queue';
import { ConfigModule } from '@nestjs/config';
import { QueueConfig } from '../queue/config';

describe('EventService', () => {
  let eventService: EventService;
  let dummyService: DeepMocked<AuctionsService>;
  let queueService: DeepMocked<QueueService>;

  const GoodData: EventData = {
    payload: {
      name: 'data',
    },
  };

  const BadData = { data: { text: 'something is not right' } };

  const GoodRecord: SQSRecord = {
    body: JSON.stringify(GoodData),
    receiptHandle: 'receipt-handle-1',
    messageId: 'message-1',
    eventSourceARN: 'arn:aws:sqs:local:1:SQSQueue',
    attributes: {
      ApproximateReceiveCount: 1,
      SentTimestamp: '1520621625029',
      ApproximateFirstReceiveTimestamp: '1520621634884',
    },
  };

  const BadRecord: SQSRecord = {
    body: JSON.stringify(BadData),
    receiptHandle: 'receipt-handle-2',
    messageId: 'message-2',
    eventSourceARN: 'arn:aws:sqs:local:1:SQSQueue',
    attributes: {
      ApproximateReceiveCount: 1,
      SentTimestamp: '1520621644029',
      ApproximateFirstReceiveTimestamp: '1520621334884',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test', '.env'],
          load: [QueueConfig],
        }),
      ],
      providers: [
        EventService,
        AuctionsService,
        { provide: QueueService, useValue: createMock<QueueService>() },
      ],
    }).compile();

    eventService = module.get<EventService>(EventService);
    dummyService = module.get(AuctionsService);
    queueService = module.get(QueueService);
  });

  it('should be defined', () => {
    expect(eventService).toBeDefined();
  });

  describe('process', () => {
    it('should respond with success if there are records.', async () => {
      // Arrange
      const spy = jest.spyOn(queueService, 'deleteMessage');
      const message = createResponseMessage(
        'Success',
        Messages.Process.Finished,
      );

      const event: SQSEvent = {
        Records: [GoodRecord],
      };

      const expected: StatusResponse = {
        statusCode: HttpStatus.OK,
        body: message,
      };

      // Act
      const result = await eventService.process(event);

      // Assert
      expect(result).toStrictEqual(expected);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should respond with failure if there are no records.', async () => {
      // Arrange
      const message = createResponseMessage('Failure', Messages.Empty.Record);
      const expected: StatusResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        body: message,
      };

      // Act
      const result = await eventService.process({});

      // Assert
      expect(result).toStrictEqual(expected);
    });
    it('should respond with message ids if it fails to process some messages.', async () => {
      // Arrange
      const spy = jest.spyOn(queueService, 'deleteMessage');
      const event: SQSEvent = {
        Records: [GoodRecord, BadRecord],
      };
      const expected: FailureResponse = {
        batchItemFailures: [{ itemIdentifier: 'message-2' }],
      };
      // Act
      const result = await eventService.process(event);
      // Assert
      expect(result).toStrictEqual(expected);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('parse', () => {
    it('should return null if there is no body.', () => {
      // Arrange
      const record: SQSRecord = {
        body: null,
        messageId: 'messageId',
        receiptHandle: 'receipt-handle-1',
        eventSourceARN: 'arn',
        attributes: {
          ApproximateReceiveCount: 0,
          ApproximateFirstReceiveTimestamp: '',
          SentTimestamp: '',
        },
      };
      // Act
      const result = eventService.parse(record);
      // Assert
      expect(result).toBe(null);
    });
    it('should return null if fails to parse the body into an event data object.', () => {
      // Arrange
      const record: SQSRecord = {
        body: 'this is not an object.',
        receiptHandle: 'receipt-handle-1',
        messageId: 'messageId',
        eventSourceARN: 'arn',
        attributes: {
          ApproximateReceiveCount: 0,
          ApproximateFirstReceiveTimestamp: '',
          SentTimestamp: '',
        },
      };
      // Act
      const result = eventService.parse(record);
      // Assert
      expect(result).toBe(null);
    });
    it('should return data if it finds a body object that is parsable.', () => {
      // Arrange
      const record: SQSRecord = {
        body: JSON.stringify(GoodData),
        receiptHandle: 'receipt-handle-1',
        messageId: 'id',
        eventSourceARN: 'arn',
        attributes: {
          ApproximateReceiveCount: 0,
          ApproximateFirstReceiveTimestamp: '',
          SentTimestamp: '',
        },
      };
      // Act
      const result = eventService.parse(record);

      // Assert
      expect(result).toStrictEqual(GoodData);
    });
  });

  describe('verify', () => {
    it('should return false if the data does not match the expected data shape.', () => {
      // Act
      const result = eventService.verify(null);
      // Assert
      expect(result).toBe(false);
    });
    it('should return true if the data does match the expected data shape.', () => {
      // Act
      const result = eventService.verify(GoodData);
      // Assert
      expect(result).toBe(true);
    });
  });

  describe('act', () => {
    it('should call fn (dummy service).', async () => {
      // Arrange
      const spy = jest.spyOn(dummyService, 'fn');
      // Act
      await eventService.act(GoodData);
      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(GoodData.payload);
    });
  });
});
