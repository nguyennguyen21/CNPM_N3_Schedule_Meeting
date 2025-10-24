// services/authService.ts

import Client from '../../../Configs/CNAPI/CNAPI';// Đường dẫn tới file Client của bạn
import type { CreateUserRequest,UserResponse,LoginRequest } from '../Types/Auth';


export const registerUser = async (data: CreateUserRequest): Promise<UserResponse> => {
  const response = await Client.post<UserResponse>('/api/users/', data);
  return response.data;
};

export const loginUser = async (credentials: LoginRequest): Promise<UserResponse> => {
  const response = await Client.post<UserResponse>('/api/auth/login', credentials);
  return response.data;
};