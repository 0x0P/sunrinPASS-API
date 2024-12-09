import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly adminSDK: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });

    const auth = new google.auth.JWT({
      email: this.configService.get('GOOGLE_ADMIN_CLIENT_EMAIL'),
      key: this.configService
        .get('GOOGLE_ADMIN_PRIVATE_KEY')
        .replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
      subject: this.configService.get('GOOGLE_ADMIN_SUBJECT'),
    });

    this.adminSDK = google.admin({ version: 'directory_v1', auth });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { data: userInfo } = await this.adminSDK.users.get({
        userKey: profile.emails[0].value,
        projection: 'full',
        fields: 'organizations(title,department),orgUnitPath',
      });

      const isTeacher =
        userInfo.orgUnitPath?.includes('Teacher') ||
        userInfo.organizations?.some(
          (org) => org.title === 'Teacher' || org.department === 'Teachers',
        ) ||
        false;

      const user = await this.authService.validateUser({
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        isTeacher,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
