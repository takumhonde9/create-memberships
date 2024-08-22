import * as joi from 'joi';

export const QueueConfigSchema = joi.object({
  AWS_ACCESS_KEY_ID: joi.string().required(),
  AWS_SECRET_ACCESS_KEY: joi.string().required(),
  AWS_REGION: joi.string().required(),
  AWS_SQS_QUEUE_URL: joi.string().required(),
});
