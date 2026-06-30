import i18n from '@/i18n/i18n';
import z from 'zod';

const t = i18n.t;
export const companySettingsSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, t('validation.companyNameRequired'))
    .max(100, t('validation.companyNameTooLong')),
  address: z.string().max(500, t('validation.addressTooLong')).optional(),
  email: z
    .email(t('validation.emailInvalid'))
    .min(1, t('validation.emailRequired')),
  useMetricSystem: z.boolean(),
  defaultTheme: z.string().min(1, t('validation.themeRequired')),
  defaultLanguage: z.string().min(1, t('validation.languageRequired')),
});

export type CompanyFormData = z.infer<typeof companySettingsSchema>;

// Zod schema for form validation
export const apiKeyFormSchema = z.object({
  description: z.string().min(1, t('validation.descriptionRequired')),
});

export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const siteFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, t('validation.siteNameRequired')),
  // @ts-ignore
  description: z.string().optional().or(z.literal('')),
  // @ts-ignore
  email: z.email(t('validation.emailInvalid')).optional().or(z.literal('')),
  useMetricSystem: z.boolean(),
  configuration: z.object({
    timezone: z.string().min(1, t('validation.timeZoneRequired')),
    language: z.string().min(1, t('validation.languageRequired')),
    dateFormat: z.string().min(1, t('validation.dateFormatRequired')),
    timeFormat: z.string().min(1, t('validation.timeFormatRequired')),
  }),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;

export const systemConfigSchema = z.object({
  timezone: z.string().min(1, t('validation.timeZoneRequired')),
  language: z.string().min(1, t('validation.languageRequired')),
  dateFormat: z.string().min(1, t('validation.dateFormatRequired')),
  timeFormat: z.string().min(1, t('validation.timeFormatRequired')),
  temperatureUnit: z.string().min(1, t('validation.temperatureUnitRequired')),
});

export type SystemConfigFormData = z.infer<typeof systemConfigSchema>;
