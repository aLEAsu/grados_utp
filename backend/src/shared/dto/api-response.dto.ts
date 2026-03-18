/**
 * Standard successful API response wrapper
 */
export class ApiSuccessResponse<T> {
  success: true = true;
  data: T;
  message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}

/**
 * Standard error API response wrapper
 */
export class ApiErrorResponse {
  success: false = false;
  error: string;
  details?: Record<string, any>;

  constructor(error: string, details?: Record<string, any>) {
    this.error = error;
    this.details = details;
  }
}
