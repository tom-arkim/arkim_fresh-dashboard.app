import i18n from '@/i18n/i18n';
import z from 'zod';

export const loginSchema = z.object({
  companyId: z.string().min(1, i18n.t('validation.companyPinRequired')),
  email: z
    .email(i18n.t('validation.emailInvalid'))
    .min(1, i18n.t('validation.emailRequired')),
  password: z.string().min(1, i18n.t('validation.passwordRequired')),
  longLasting: z.boolean(),
});

export const signupSchema = z
  .object({
    companyPin: z
      .string()
      .min(1, i18n.t('validation.companyPinRequired'))
      .max(15, i18n.t('validation.companyPinFormat'))
      .regex(/^[a-z-]+$/, i18n.t('validation.companyPinFormat')),

    companyName: z.string().min(1, i18n.t('validation.companyNameRequired')),

    firstName: z.string().min(1, i18n.t('validation.firstNameRequired')),

    lastName: z.string().min(1, i18n.t('validation.lastNameRequired')),

    email: z
      .email(i18n.t('validation.emailInvalid'))
      .min(1, i18n.t('validation.emailRequired')),

    password: z
      .string()
      .min(8, i18n.t('validation.passwordMinLength'))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        i18n.t('validation.passwordInvalid')
      ),

    confirmPassword: z
      .string()
      .min(1, i18n.t('validation.confirmPasswordRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t('validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

export const passwordResetschema = z
  .object({
    oldPassword: z.string().min(1, i18n.t('validation.oldPasswordRequired')),

    newPassword: z
      .string()
      .min(8, i18n.t('validation.passwordMinLength'))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        i18n.t('validation.passwordInvalid')
      ),

    confirmPassword: z
      .string()
      .min(1, i18n.t('validation.confirmPasswordRequired')),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: i18n.t('validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

export type ICompanyLogin = z.infer<typeof loginSchema>;
export type ICompanySignup = z.infer<typeof signupSchema>;
export type IPasswordReset = z.infer<typeof passwordResetschema>;
