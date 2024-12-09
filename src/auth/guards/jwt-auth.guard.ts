import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const refreshToken = request.cookies['refreshToken'];

        if (!refreshToken) {
          throw new UnauthorizedException('로그인 필요');
        }

        try {
          const tokens = await this.authService.refreshTokensWithCookie(
            refreshToken,
            response,
          );

          request.user = tokens.user;
          return true;
        } catch {
          await this.authService.logout(response);
          throw new UnauthorizedException('로그인 필요');
        }
      }
      throw error;
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('로그인 필요');
    }
    return user;
  }
}
