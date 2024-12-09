import { IsEmail, IsString, IsBoolean } from 'class-validator';

export class GoogleAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsBoolean()
  isTeacher: boolean;
}
