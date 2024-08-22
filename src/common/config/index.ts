import { registerAs } from '@nestjs/config';

export const CommonConfig = registerAs('commonConfig', () => ({
  NEST_ENVIRONMENT: process.env.NEST_ENVIRONMENT,
}));
