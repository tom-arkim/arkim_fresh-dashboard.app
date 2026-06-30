import i18n from '@/i18n/i18n';
import z from 'zod';

const t = i18n.t;
export const labelSchema = z.object({
  name: z.string().min(1, t('validation.labelNameRequired')),
});

export type LabelFormValues = z.infer<typeof labelSchema>;
