export type EntityType = 'asset' | 'work_order';

export interface Webhook {
    id: string;
    title: string;
    url: string;
    isActive: boolean;
    entityTypes: EntityType[];
}

export interface WebhookFormValues {
    title: string;
    url: string;
    isActive: boolean;
    entityTypes: EntityType[];
}