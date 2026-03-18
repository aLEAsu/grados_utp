import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuditEvent {
  userId?: string;
  role?: string;
  action: string; // HTTP method + route
  entity?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  statusCode: number;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private logger = new Logger('AuditInterceptor');

  intercept(context: ExecutionContext, next): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();
    const user = request.user;
    const ipAddress =
      request.ip ||
      request.connection?.remoteAddress ||
      request.headers['x-forwarded-for']?.toString() ||
      'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const method = request.method;
    const path = request.url;
    const action = `${method} ${path}`;

    const auditEvent: AuditEvent = {
      userId: user?.sub,
      role: user?.role,
      action,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      statusCode: 0, // Will be updated after response
    };

    return next.handle().pipe(
      tap({
        next: (data) => {
          auditEvent.statusCode = response.statusCode || 200;
          const duration = Date.now() - startTime;
          this.logAuditEvent(auditEvent, duration);
        },
        error: (error) => {
          auditEvent.statusCode = error.status || 500;
          const duration = Date.now() - startTime;
          this.logAuditEvent(auditEvent, duration, error);
        },
      }),
    );
  }

  private logAuditEvent(
    event: AuditEvent,
    duration: number,
    error?: Error,
  ): void {
    const logMessage = `[${event.timestamp.toISOString()}] ${event.action} - User: ${event.userId || 'ANONYMOUS'} (${event.role || 'N/A'}) - IP: ${event.ipAddress} - Status: ${event.statusCode} - Duration: ${duration}ms`;

    if (error) {
      this.logger.warn(`${logMessage} - Error: ${error.message}`);
    } else {
      this.logger.debug(logMessage);
    }
  }
}
