import api from './client';
import type { ApiResponse, Campaign, EmailLog, SendCampaignPayload } from '../types';

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
 * Récupère une campagne spécifique.
 */
export const fetchCampaignById = async (campaignId: string): Promise<Campaign> => {
  const { data } = await api.get<ApiResponse<Campaign>>(`/campaigns/${campaignId}`);
  return data.data!;
};

/**
 * Récupère les logs détaillés d'une campagne.
 */
export const fetchCampaignLogs = async (campaignId: string): Promise<EmailLog[]> => {
  const { data } = await api.get<ApiResponse<EmailLog[]>>(`/campaigns/${campaignId}/logs`);
  return data.data ?? [];
};

/**
 * Duplique une campagne existante.
 */
export const duplicateCampaign = async (campaignId: string): Promise<Campaign> => {
  const { data } = await api.post<ApiResponse<Campaign>>(`/campaigns/${campaignId}/duplicate`, {});
  return data.data!;
};

/**
 * Supprime une campagne et tous ses logs.
 */
export const deleteCampaign = async (campaignId: string): Promise<void> => {
  await api.delete(`/campaigns/${campaignId}`);
};
