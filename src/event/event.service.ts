import { HttpStatus, Injectable } from '@nestjs/common';
import { EventData, SQSEvent, SQSRecord } from './interface';
import { createResponseMessage, defined, Messages, toObject } from '../common';
import { AuctionsService } from '../auctions';
import { SQSService } from '../queue';

export interface BatchItemRecord {
  itemIdentifier: string;
}

export interface FailureResponse {
  batchItemFailures: BatchItemRecord[];
}

export interface StatusResponse {
  statusCode: HttpStatus;
  body: any;
}

@Injectable()
export class EventService {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly sqsService: SQSService,
  ) {}

  /**
   * Process events from AWS SQS queue.
   *
   * @param event the event provided by AWS SQS.
   */
  async process(event: any): Promise<FailureResponse | StatusResponse> {
    const errorsMessageIds: string[] = [];
    const _event = event as SQSEvent;

    const records = _event['Records'];

    if (!records) {
      return {
        body: createResponseMessage('Failure', Messages.Empty.Record),
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    for (const record of records) {
      try {
        const data = this.parse(record);

        if (!this.verify(data)) {
          errorsMessageIds.push(record.messageId);
          continue;
        }

        await this.act(data);

        await this.sqsService.deleteMessage(record.receiptHandle);
      } catch (error) {
        console.error('[EventService > Process]: ', error);

        errorsMessageIds.push(record.messageId);
      }
    }

    if (errorsMessageIds.length > 0) {
      return {
        batchItemFailures: errorsMessageIds.map((id) => ({
          itemIdentifier: id,
        })),
      };
    } else {
      return {
        body: createResponseMessage('Success', Messages.Process.Finished),
        statusCode: HttpStatus.OK,
      };
    }
  }

  /**
   * Parse the data into an EventData object.
   *
   * @param record the record to parse, as provided by AWS SQS.
   */
  parse(record: SQSRecord): EventData | null {
    const body = record['body'];

    if (!body) return null; // failing silently :- need to record event ID

    const data = toObject<EventData | null>(body); // NOTE: wishful typing B.S.

    if (!data) return null; // failing silently :- need to record event ID

    return data;
  }

  /**
   * Check whether the data passed matches the expected format.
   *
   * @param data the data object to check against.
   */
  verify(data: any): boolean {
    if (!data) {
      return false;
    }

    // check if data has the correct keys and data.
    const payload = data['payload'];
    const auctionIds = payload ? payload['auctionIds'] : undefined;

    return defined(payload) && defined(auctionIds);
  }

  /**
   * Call the service method to perform action on the event's payload.
   *
   * @param data an object containing a payload.
   */
  async act(data: EventData): Promise<void> {
    await this.auctionsService.process(data.payload);
  }
}
