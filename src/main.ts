import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Handler } from 'aws-lambda';
import { EventService } from './event';

let cachedAppContext;

const createAppContext = async () => {
  if (!cachedAppContext) {
    cachedAppContext = await NestFactory.createApplicationContext(AppModule);
  }
  return cachedAppContext;
};

export const handler: Handler = async (event: any) => {
  cachedAppContext = await createAppContext();

  const eventService = cachedAppContext.get(EventService);

  return eventService.process(event);
};
