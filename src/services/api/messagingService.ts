import { apiClientMessaging as apiClient } from './apiClient';

const messagingService = {
    getDeepgramToken: async (): Promise<string> => {
        const response = await apiClient.get<{ access_token: string, expires_in: number }>(
            `/external/deepgram/token?ttl_seconds=3600`,
        );
        return response.data.access_token;
    }
};

export default messagingService;
