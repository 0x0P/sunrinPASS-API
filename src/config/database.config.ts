import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') === 'development',
  // logging: configService.get('NODE_ENV') === 'development',
  logging: ['query', 'error', 'schema', 'warn', 'info', 'log'],
  logger: 'advanced-console',
  cache: false,
  ssl:
    configService.get('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  retryAttempts: 5,
  retryDelay: 3000,
  autoLoadEntities: true,
  keepConnectionAlive: true,
});
