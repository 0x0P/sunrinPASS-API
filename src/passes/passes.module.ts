import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassesService } from './passes.service';
import { PassesController } from './passes.controller';
import { Pass } from './entities/pass.entity';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pass]),
    CommonModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PassesController],
  providers: [PassesService],
})
export class PassesModule {}
