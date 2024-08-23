export enum AuctionStatusEnum {
  Started = 'S',
  Aborted = 'A',
  Processing = 'P',
  Ended = 'E',
}

export enum PaymentStatusEnum {
  Succeeded = 'withdrawn',
  Failed = 'failed',
  CancellationFailure = 'cancellation_failure',
  Cancelled = 'cancelled',
}
