import { HttpStatus } from '@nestjs/common';

export interface ICommonResponse<T = any> {
  body: T;
  statusCode: HttpStatus;
}
