import { Injectable } from '@nestjs/common';
import { UserEventsService } from './services';
import { IUserEventCreateOne } from './types';
import { INotificationDeleteOne } from './types/delete-notification.interface';

@Injectable()
export class UserEventsUtility {
  constructor(private readonly userEventsService: UserEventsService) {}

  async deleteOne(data: INotificationDeleteOne) {
    const event = await this.userEventsService.findOne({
      where: {
        actorId: data.event?.actor,
        name: data.event?.name,
        entityId: data.entity?.id,
        entityName: data.entity?.name,
      },
      include: {
        notification: true,
      },
    });

    if (!event) {
      return;
    }

    await this.userEventsService.deleteOne({
      where: {
        id: event.id,
      },
    });
  }

  async deleteAll(data: Partial<INotificationDeleteOne>) {
    await this.userEventsService.deleteAll({
      where: {
        actorId: data.event?.actor,
        name: data.event?.name,
        entityId: data.entity?.id,
        entityName: data.entity?.name,
      },
    });
  }

  async createOne(data: IUserEventCreateOne) {
    return await this.userEventsService.create({
      data: {
        name: data.event.name,
        entityId: data.entity.id,
        entityName: data.entity.name,
        actor: {
          connect: {
            id: data.event.actor,
          },
        },
      },
    });
  }
}
