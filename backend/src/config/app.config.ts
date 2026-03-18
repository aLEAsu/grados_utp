import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  environment: string;
  jwtSecret: string;
  jwtExpiration: string;
  corsOrigin: string;
  uploadDir: string;
  maxFileSize: number;
  logLevel: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  frontendCallbackUrl: string;
}

export default registerAs('app', (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
  logLevel: process.env.LOG_LEVEL || 'debug',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  frontendCallbackUrl: process.env.FRONTEND_CALLBACK_URL || 'http://localhost:3001/auth/callback',
}));
