import { IsEnum, IsString, IsOptional } from 'class-validator';
import { PassStatus } from '../entities/pass.entity';

export class ApprovePassDto {
  @IsEnum(PassStatus)
  status: PassStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}
