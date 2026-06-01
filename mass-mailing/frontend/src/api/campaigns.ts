import axios from 'axios';
import type { ApiResponse, Campaign, EmailLog, SendCampaignPayload } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Lance l'envoi d'une campagne e-mail.
 */
export const sendCampaign = async (
  payload: SendCampaignPayload
): Promise<ApiResponse<never>> => {
  const { data } = await api.post<ApiResponse<never>>('/campaigns/send', payload);
  return data;
};

/**
 * Récupère la liste de toutes les campagnes.
 */
export const fetchCampaigns = async (): Promise<Campaign[]> => {
  const { data } = await api.get<ApiResponse<Campaign[]>>('/campaigns');
  return data.data ?? [];
};

/**
 * Récupère les logs détaillés d'une campagne.
 */
export const fetchCampaignLogs = async (campaignId: string): Promise<EmailLog[]> => {
  const { data } = await api.get<ApiResponse<EmailLog[]>>(`/campaigns/${campaignId}/logs`);
  return data.data ?? [];
};
