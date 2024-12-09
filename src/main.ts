import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as passport from 'passport';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.use(cookieParser(configService.get('COOKIE_SECRET')));

  app.use(
    session({
      secret: configService.get('COOKIE_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: configService.get('NODE_ENV') === 'production',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        sameSite: 'lax',
        domain: configService.get('COOKIE_DOMAIN'),
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`sunrinPASS 서버가 시작됨`);
}
bootstrap();
