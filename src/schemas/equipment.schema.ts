import z from 'zod';
import i18n from '@/i18n/i18n';

const t = i18n.t;

export const createEquipmentSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, t('validation.equipmentNameRequired')),
    description: z.string().optional(),
    type: z.string().min(1, t('validation.equipmentTypeRequired')),
    siteId: z.string().min(1, t('validation.siteRequired')),
    manufacturer: z.string().min(1, t('validation.manufacturerRequired')),
    model: z.string().min(1, t('validation.modelRequired')),
    serialNumber: z.string().optional(),
    location: z.string().min(1, t('validation.siteAreaRequired')),
    isVdfAvailable: z.boolean(),
    vdfMacId: z.string().optional(),
    // Replace single monitoring parameters with an array
    monitors: z
      .array(
        z.object({
          id: z.string().optional(),
          parameter: z
            .string()
            .min(1, t('validation.monitoringParameterRequired')),
          alarmType: z.string().min(1, t('validation.alarmTypeRequired')),
          condition: z.string().min(1, 'Condition is required'), // 'above', 'below', 'increase', 'decrease'
          value: z.number().min(0, 'Value must be positive'),
          priority: z.string().min(1, 'Priority is required'), // 'low', 'medium', 'high'
        })
      )
      // .min(1, t('validation.atLeastOneMonitoringParameterRequired'))
      .superRefine((monitors, ctx) => {
        monitors.forEach((monitor, index) => {
          // Validate value based on parameter type
          if (monitor.parameter === 'current' && monitor.value > 100) {
            ctx.addIssue({
              code: 'custom',
              message: 'Current value cannot exceed 100%',
              path: [index, 'value'],
            });
          }

          if (monitor.parameter === 'vibration' && monitor.value > 1.1) {
            ctx.addIssue({
              code: 'custom',
              message: 'Vibration value cannot exceed 1.1g',
              path: [index, 'value'],
            });
          }

          if (
            (monitor.parameter === 'temperature' ||
              monitor.parameter === 'surface_temperature') &&
            monitor.value > 100
          ) {
            ctx.addIssue({
              code: 'custom',
              message: 'Temperature value cannot exceed 100',
              path: [index, 'value'],
            });
          }
        });
      }),
    sensors: z
      .array(
        z.object({
          id: z.string().min(1, t('validation.sensorIdRequired')),
          description: z.string().optional(),
          type: z.string().min(1, t('validation.sensorTypeRequired')),
          parameter: z.string().min(1, t('validation.monitoringParameterRequired')),
        })
      )
      // .min(1, t('validation.atLeastOneSensorRequired'))
      .refine(
        (sensors) => {
          const sensorIds = sensors.map((sensor) => sensor.id);
          return sensorIds.length === new Set(sensorIds).size;
        },
        {
          message: t('validation.sensorIdMustBeUnique'),
        }
      ),
  })
  .refine(
    (data) => {
      // If vfdAvailable is true, macId must be present
      if (data.isVdfAvailable && !data.vdfMacId) {
        return false;
      }
      return true;
    },
    {
      message: t('validation.macIdRequired'),
      path: ['vdfMacId'],
    }
  );

export type EquipmentFormData = z.infer<typeof createEquipmentSchema>;