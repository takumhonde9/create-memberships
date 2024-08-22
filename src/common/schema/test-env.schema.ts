import * as joi from 'joi';

export const TestEnvSchema = joi.object({
  NEST_ENVIRONMENT: joi.string().valid('test').required(),
});
