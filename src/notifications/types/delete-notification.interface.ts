import { EntityNameEnum } from '../../common';

export interface INotificationDeleteOne {
  event: {
    name: string;
    actor: string;
  };
  entity: {
    name: EntityNameEnum;
    id: string;
  };
}
