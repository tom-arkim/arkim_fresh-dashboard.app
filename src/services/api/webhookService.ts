import { Webhook, WebhookFormValues } from '@/types/maintenance/Webhook';
import { apiClientCore as apiClient } from './apiClient';

const webhookService = {
    list: async (): Promise<Webhook[]> => {
        const response = await apiClient.get<Webhook[]>('/company/webhooks');
        return response.data;
    },

    create: async (data: WebhookFormValues): Promise<Webhook> => {
        const response = await apiClient.post<Webhook>('/company/webhooks', data);
        return response.data;
    },

    update: async (id: string, data: WebhookFormValues): Promise<Webhook> => {
        const response = await apiClient.put<Webhook>(`/company/webhooks/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/company/webhooks/${id}`);
    },
};

export default webhookService;