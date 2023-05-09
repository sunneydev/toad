export interface RequestLoginResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export type AuthorizationCheck =
  | AuthorizationCheckSuccess
  | AuthorizationCheckFailure;

export interface AuthorizationCheckSuccess {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface AuthorizationCheckFailure {
  error: string;
  error_description: string;
  error_uri: string;
  interval?: number;
}
