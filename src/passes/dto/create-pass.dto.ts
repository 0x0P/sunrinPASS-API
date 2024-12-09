import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsDate,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { PassType } from '../entities/pass.entity';
import { Type } from 'class-transformer';

export class CreatePassDto {
  @IsEnum(PassType)
  type: PassType;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  returnTime?: Date;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  teacherId: string;
}
