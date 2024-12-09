import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const accessToken = request?.cookies?.accessToken;

          if (!accessToken || this.isTokenExpired(accessToken)) {
            const refreshToken = request?.cookies?.refreshToken;

            if (refreshToken) {
              try {
                const decoded = this.jwtService.verify(refreshToken, {
                  secret: this.configService.get('JWT_REFRESH_SECRET'),
                });

                const newAccessToken = this.jwtService.sign(
                  {
                    sub: decoded.sub,
                    email: decoded.email,
                    isTeacher: decoded.isTeacher,
                  },
                  {
                    secret: this.configService.get('JWT_SECRET'),
                    expiresIn: '1h',
                  },
                );

                request.res.cookie('accessToken', newAccessToken, {
                  httpOnly: true,
                  secure: this.configService.get('NODE_ENV') === 'production',
                  sameSite: 'lax',
                  domain: this.configService.get('COOKIE_DOMAIN'),
                  path: '/',
                  maxAge: 60 * 60 * 1000,
                });

                return newAccessToken;
              } catch {
                return null;
              }
            }
          }

          return accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = this.jwtService.decode(token) as { exp: number };
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  async validate(req: Request, payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
