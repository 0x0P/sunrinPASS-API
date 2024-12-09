import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
}

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
