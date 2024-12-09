export interface JwtPayload {
  sub: string;
  email: string;
  isTeacher: boolean;
  iat?: number;
  exp?: number;
}
