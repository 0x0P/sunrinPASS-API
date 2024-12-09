import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions() {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      domain: this.configService.get('COOKIE_DOMAIN'),
      path: '/',
    };
  }

  private getAccessTokenCookieOptions() {
    return {
      ...this.getCookieOptions(),
      maxAge: 60 * 60 * 1000, // 고민고민하다가결정한 1시간
    };
  }

  private getRefreshTokenCookieOptions() {
    return {
      ...this.getCookieOptions(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    };
  }

  async validateUser(userInfo: {
    email: string;
    firstName: string;
    lastName: string;
    isTeacher: boolean;
  }): Promise<User> {
    let user = await this.usersService.findByEmail(userInfo.email);

    if (user) {
      user = await this.usersService.update(user.id, {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        isTeacher: userInfo.isTeacher,
      });
    } else {
      user = await this.usersService.create(userInfo);
    }

    return user;
  }

  async login(user: User, res: Response) {
    const payload = {
      sub: user.id,
      email: user.email,
      isTeacher: user.isTeacher,
    };

    const accessToken = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    res.cookie('accessToken', accessToken, this.getAccessTokenCookieOptions());
    res.cookie(
      'refreshToken',
      refreshToken,
      this.getRefreshTokenCookieOptions(),
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isTeacher: user.isTeacher,
      },
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto, res: Response) {
    return this.refreshTokensWithCookie(refreshTokenDto.refreshToken, res);
  }

  async refreshTokensWithCookie(refreshToken: string, res: Response) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(decoded.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('유효하지 않은 Refresh token');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('유효하지 않은 Refresh token');
      }

      return this.login(user, res);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token 만료');
      }
      throw new UnauthorizedException('유효하지 않은 Refresh token');
    }
  }

  async logout(res: Response) {
    res.clearCookie('accessToken', this.getAccessTokenCookieOptions());
    res.clearCookie('refreshToken', this.getRefreshTokenCookieOptions());
    return { message: '로그아웃되었습니다.' };
  }
}
