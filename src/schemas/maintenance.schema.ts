import i18n from '@/i18n/i18n';
import dayjs from 'dayjs';
import { z } from 'zod';

const t = i18n.t;

export const taskSchema = z
  .object({
    title: z.string().min(1, t('maintenanceTasks.validation.titleRequired')),
    description: z.string().min(1, t('maintenanceTasks.validation.descriptionRequired')),
    assetId: z.string().min(1, t('maintenanceTasks.validation.assetRequired')),
    assignedUserEmails: z.array(z.string()).optional(),
    startDate: z.string().min(1, t('maintenanceTasks.validation.startDateRequired')),
    endDate: z.string().optional().nullable(),
    rRule: z.string().min(1, t('maintenanceTasks.validation.recurrencePatternRequired')),
  })
  .refine(
    (data) => {
      // // Start date validation
      // if (dayjs(data.startDate).isBefore(dayjs().startOf('day'))) {
      //   return false;
      // }
      // End date validation if provided
      if (data.endDate && data.endDate.length > 0) {
        if (dayjs(data.endDate).isBefore(dayjs(data.startDate))) {
          return false;
        }
      }
      return true;
    },
    {
      message: t('maintenanceTasks.validation.endDateBeforeStartDate'),
      path: ['endDate'],
    }
  );

export type TaskFormData = z.infer<typeof taskSchema>;