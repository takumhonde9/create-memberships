import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserEventsService {
  constructor(private prismaService: PrismaService) {}

  async create(args: Prisma.UserEventCreateArgs) {
    return this.prismaService.userEvent.create(args);
  }

  async findOne(args: Prisma.UserEventFindFirstArgs) {
    return this.prismaService.userEvent.findFirst(args);
  }

  async deleteOne(args: Prisma.UserEventDeleteArgs) {
    return this.prismaService.userEvent.delete(args);
  }

  async deleteAll(args: Prisma.UserEventDeleteManyArgs) {
    return this.prismaService.userEvent.deleteMany(args);
  }
}
