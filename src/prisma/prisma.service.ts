import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { prismaConfig } from './config/prisma.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(prismaConfig.KEY)
    private database: ConfigType<typeof prismaConfig>,
  ) {
    super({
      datasources: {
        db: {
          url: database.url,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
