import { registerAs } from '@nestjs/config';
import * as process from 'process';

export const StripeConfig = registerAs('StripeConfig', () => ({
  Secret: process.env.STRIPE_SECRET,
  WebAppBaseUrl: process.env.STRIPE_WEB_APP_BASE_URL,
  NestEnvironment: process.env.NEST_ENVIRONMENT,
  MaximumNumberSeats: +process.env.MAXIMUM_NUM_SEATS,
}));
