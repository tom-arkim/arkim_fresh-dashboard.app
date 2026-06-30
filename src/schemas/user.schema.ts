import i18n from '@/i18n/i18n';
import z from 'zod';

export const createUserSchema = z.object({
  email: z.email(i18n.t('validation.emailInvalid')),
  firstName: z.string().min(1, i18n.t('validation.firstNameRequired')),
  lastName: z.string().min(1, i18n.t('validation.lastNameRequired')),
  isAdmin: z.boolean().default(false),
  isMonitoring: z.boolean().default(false),
  isTechnician: z.boolean().default(false),
  isActive: z.boolean().default(true),
  theme: z.string().default('light'),
  language: z.string().default('en'),
  assignedSites: z.array(z.string()).min(1, i18n.t('users.messages.atleastOneSite')),
  defaultSite: z.string().optional(),
}).refine((data) => data.isAdmin || data.isMonitoring || data.isTechnician, {
  message: i18n.t('validation.atLeastOneRoleRequired'),
  path: ['roles'],
});

export type UserFormValues = z.input<typeof createUserSchema>;