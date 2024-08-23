import { EntityNameEnum } from '../../common';

export interface IUserEventCreateOne {
  event: {
    name: string;
    actor: string;
  };
  entity: {
    name: EntityNameEnum;
    id: string;
  };
}
