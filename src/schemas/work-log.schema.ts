import { WorkLogOutcome } from '@/config/enum';
import i18n from '@/i18n/i18n';
import dayjs from 'dayjs';
import z from 'zod';

const t = i18n.t;

// Work Log Form Schema - all fields optional when resolution already logged
const partSchema = z.object({
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    partNumber: z.string().optional(),
    quantity: z.number().optional(),
    comments: z.string().optional(),
});

export const completeWorkLogSchema = z
    .object({
        resolutionAlreadyLogged: z.boolean(),
        outcome: z.nativeEnum(WorkLogOutcome).optional(),
        troubleshootingSteps: z.string().optional(),
        parts: z.array(partSchema).optional(),
        comments: z.string().optional(),
    })
    .refine(
        (data) => {
            // If resolution not already logged, outcome is required
            if (!data.resolutionAlreadyLogged && !data.outcome) {
                return false;
            }
            return true;
        },
        {
            message: t('workOrders.complete.outcomeRequired'),
            path: ['outcome'],
        }
    );

export type CompleteWorkLogFormData = z.infer<typeof completeWorkLogSchema>;

export const workLogSchema = z.object({
    outcome: z.nativeEnum(WorkLogOutcome).refine((val) => val !== undefined, {
        message: t('workOrders.workLog.outcomeRequired'),
    }),
    troubleshootingSteps: z.string().optional(),
    parts: z.array(partSchema).optional(),
    comments: z.string().optional(),
});

export type WorkLogFormData = z.infer<typeof workLogSchema>;
