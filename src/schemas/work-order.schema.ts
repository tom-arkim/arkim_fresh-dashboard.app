import i18n from '@/i18n/i18n';
import dayjs from 'dayjs';
import z from 'zod';

const t = i18n.t;

export const workOrderSchema = z
  .object({
    title: z.string().min(1, t('workOrders.validation.titleRequired')),
    description: z.string().min(1, t('workOrders.validation.descriptionRequired')),
    assetId: z.string().min(1, t('workOrders.validation.assetRequired')),
    dueDate: z.string().min(1, t('workOrders.validation.dueDateRequired')),
    assignedUserEmails: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Due date should be >= today
      if (dayjs(data.dueDate).isBefore(dayjs(), 'day')) {
        return false;
      }
      return true;
    },
    {
      message: t('workOrders.validation.dueDateInPast'),
      path: ['dueDate'],
    }
  );

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
