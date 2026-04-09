import { Controller, Get } from '@nestjs/common';

@Controller('health') //ruta completa: localhost:4000/api/v1/health
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
