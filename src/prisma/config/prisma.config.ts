import { registerAs } from '@nestjs/config';

export const prismaConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
