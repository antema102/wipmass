import api from './client';
import type { ApiResponse, AuthPayload, AuthUser } from '../types';

interface LoginBody {
  email: string;
  password: string;
}

export const loginAdmin = async (payload: LoginBody): Promise<AuthPayload> => {
  const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/login', payload);
  return data.data!;
};

export const fetchMe = async (): Promise<AuthUser> => {
  const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data!;
};
