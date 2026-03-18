import { BadRequestException } from '@nestjs/common';

export class IntegrationException extends BadRequestException {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'IntegrationException';
    if (cause) {
      console.error('Integration Error:', cause);
    }
  }
}
