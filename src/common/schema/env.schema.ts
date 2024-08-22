import * as joi from 'joi';
import { Environment } from '../constants';

export const EnvSchema = joi.object({
  NEST_ENVIRONMENT: joi
    .string()
    .valid(...Object.values(Environment))
    .required(),
});
