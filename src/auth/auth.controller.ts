import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('Google 로그인 실패');
      }

      const result = await this.authService.login(req.user, res);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}?login=success`);
      return result.user;
    } catch {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req) {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      isTeacher: req.user.isTeacher,
    };
  }

  @Post('refresh')
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(refreshTokenDto, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}
