import { registerAs } from '@nestjs/config';

export const QueueConfig = registerAs('QueueConfig', () => ({
  AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  Region: process.env.AWS_REGION,
  QueueUrl: process.env.AWS_SQS_QUEUE_URL,
}));
