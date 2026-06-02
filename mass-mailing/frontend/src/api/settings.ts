import api from './client';
import type { ApiResponse, MailSettings } from '../types';

export const fetchMailSettings = async (): Promise<MailSettings> => {
  const { data } = await api.get<ApiResponse<MailSettings>>('/settings/mail');
  return data.data!;
};

export const updateMailSettings = async (payload: MailSettings): Promise<MailSettings> => {
  const { data } = await api.put<ApiResponse<MailSettings>>('/settings/mail', payload);
  return data.data!;
};
