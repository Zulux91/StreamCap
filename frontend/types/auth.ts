export interface User {
  username: string;
  is_admin: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  is_admin: boolean;
}

export interface SessionResponse {
  valid: boolean;
  username: string;
  is_admin: boolean;
}
