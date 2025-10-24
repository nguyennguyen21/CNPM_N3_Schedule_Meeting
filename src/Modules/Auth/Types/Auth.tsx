// types/auth.ts

export interface CreateUserRequest {
  username: string;
  fullname: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  fullname: string;
  role: string;
  token?: string;
}

export interface ApiError {
  message: string;
}