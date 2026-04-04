import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {

    /* Verificar que las variables si llegan */
    const clientId = configService.get('app.googleClientId');
    const clientSecret = configService.get('app.googleClientSecret');
    const callbackUrl = configService.get('app.googleCallbackUrl');

    console.log('Google OAuth Config:',{
      clientId,
      clientSecret,
      callbackUrl,
    }
    );

    super({
      clientID: configService.get('app.googleClientId'),
      clientSecret: configService.get('app.googleClientSecret'),
      callbackURL: configService.get('app.googleCallbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const user = await this.authService.validateGoogleUser(profile);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
