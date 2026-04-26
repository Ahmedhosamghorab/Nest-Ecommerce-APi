import { UserType } from './enums';

export type JWTPayload = {
  id: number;
  userType: UserType;
};
export type AccessToken = {
  accessToken: string;
};
