export interface EventData {
  payload: any;
}

export interface SQSRecord {
  body: string;
  messageId: string;
  receiptHandle: string;
  eventSourceARN: string;
  attributes: {
    ApproximateReceiveCount: number;
    ApproximateFirstReceiveTimestamp: string;
    SentTimestamp: string;
  };
}

export interface SQSEvent {
  Records: SQSRecord[];
}
