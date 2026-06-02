import api from './client';
import type {
  ApiResponse,
  Contact,
  ContactsResponse,
  CreateContactPayload,
  ImportContactsResult,
} from '../types';

export interface GetContactsParams {
  search?: string;
  tag?: string;
  unsubscribed?: boolean;
  page?: number;
  limit?: number;
}

export const fetchContacts = async (params: GetContactsParams = {}): Promise<ContactsResponse> => {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.tag) query.tag = params.tag;
  if (params.unsubscribed !== undefined) query.unsubscribed = String(params.unsubscribed);
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);

  const { data } = await api.get<ContactsResponse>('/contacts', { params: query });
  return data;
};

export const fetchTags = async (): Promise<string[]> => {
  const { data } = await api.get<ApiResponse<string[]>>('/contacts/tags');
  return data.data ?? [];
};

export const createContact = async (payload: CreateContactPayload): Promise<Contact> => {
  const { data } = await api.post<ApiResponse<Contact>>('/contacts', payload);
  return data.data!;
};

export const updateContact = async (id: string, payload: Partial<CreateContactPayload & { isUnsubscribed: boolean }>): Promise<Contact> => {
  const { data } = await api.put<ApiResponse<Contact>>(`/contacts/${id}`, payload);
  return data.data!;
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/contacts/${id}`);
};

export const deleteContacts = async (ids: string[]): Promise<void> => {
  await api.delete('/contacts/bulk', { data: { ids } });
};

export const importContacts = async (file: File): Promise<ImportContactsResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ApiResponse<ImportContactsResult>>('/contacts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data!;
};
