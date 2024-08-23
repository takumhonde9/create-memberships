import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prismaService: PrismaService) {}

  async create(args: Prisma.NotificationCreateArgs) {
    return this.prismaService.notification.create(args);
  }

  async createMany(args: Prisma.NotificationCreateManyArgs) {
    return this.prismaService.notification.createMany(args);
  }
}
