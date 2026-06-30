import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash, Wrench } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { WorkLogBase } from '@/types/maintenance/WorkOrder';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Separator } from '@/components/ui/shadcn/separator';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { WorkLogOutcome } from '@/config/enum';
import { WorkLogFormData, workLogSchema } from '@/schemas/work-log.schema';

interface WorkLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workLog: WorkLogBase) => Promise<void>;
}

const WorkLogDialog: React.FC<WorkLogDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<WorkLogFormData>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      outcome: WorkLogOutcome.Fixed,
      troubleshootingSteps: '',
      parts: [],
      comments: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parts',
  });

  const { formState: { isSubmitting } } = form;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        outcome: WorkLogOutcome.Fixed,
        troubleshootingSteps: '',
        parts: [],
        comments: '',
      });
      setError(null);
    }
  }, [isOpen, form]);

  const handleSubmit = async (data: WorkLogFormData) => {
    try {
      setError(null);

      const workLog: WorkLogBase = {
        outcome: data.outcome,
        troubleshootingSteps: data.troubleshootingSteps?.trim() || undefined,
        comments: data.comments?.trim() || undefined,
        parts: data.parts && data.parts.length > 0 ? data.parts : undefined,
      };

      await onSubmit(workLog);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('workOrders.messages.workLogAddError');
      setError(errorMessage);
    } finally {
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span>{t('workOrders.workLog.addWorkLog')}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Outcome Selection */}
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('workOrders.workLog.outcome')} *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row space-x-4 flex-wrap"
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={WorkLogOutcome.Fixed}
                            id="outcome-fixed"
                            className='cursor-pointer'
                          />
                          <label
                            htmlFor="outcome-fixed"
                            className="cursor-pointer"
                          >
                            {t('workOrders.workLog.outcomes.fixed')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={WorkLogOutcome.PartiallyFixed}
                            id="outcome-partially"
                            className='cursor-pointer'
                          />
                          <label
                            htmlFor="outcome-partially"
                            className="cursor-pointer"
                          >
                            {t('workOrders.workLog.outcomes.partiallyFixed')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={WorkLogOutcome.NotFixed}
                            id="outcome-not-fixed"
                            className='cursor-pointer'
                          />
                          <label
                            htmlFor="outcome-not-fixed"
                            className="cursor-pointer"
                          >
                            {t('workOrders.workLog.outcomes.notFixed')}
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Troubleshooting Steps */}
              <FormField
                control={form.control}
                name="troubleshootingSteps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('workOrders.workLog.troubleshootingSteps')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          'workOrders.workLog.troubleshootingPlaceholder'
                        )}
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comments */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('common.comments')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          'workOrders.workLog.commentsPlaceholder'
                        )}
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Parts Used Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">
                    {t('workOrders.workLog.partsUsed')}
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        manufacturer: '',
                        model: '',
                        partNumber: '',
                        quantity: 1,
                        comments: '',
                      })
                    }
                    disabled={isSubmitting}
                    className="flex items-center gap-1 h-8"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{t('workOrders.workLog.addPart')}</span>
                  </Button>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3 p-3 py-4 bg-muted/50 rounded-lg border">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="relative grid grid-cols-12 gap-3 pb-3 border-b last:border-0 last:pb-0"
                      >
                        <div className="col-span-12 md:col-span-6">
                          <FormField
                            control={form.control}
                            name={`parts.${index}.manufacturer`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">
                                  {t('workOrders.workLog.manufacturer')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={t(
                                      'workOrders.workLog.manufacturer'
                                    )}
                                    className="h-8 text-xs"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <FormField
                            control={form.control}
                            name={`parts.${index}.model`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">
                                  {t('workOrders.workLog.model')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={t('workOrders.workLog.model')}
                                    className="h-8 text-xs"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <FormField
                            control={form.control}
                            name={`parts.${index}.partNumber`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">
                                  {t('workOrders.workLog.partNumber')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={t(
                                      'workOrders.workLog.partNumber'
                                    )}
                                    className="h-8 text-xs"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <FormField
                            control={form.control}
                            name={`parts.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">
                                  {t('workOrders.workLog.quantity')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min={1}
                                    placeholder="1"
                                    className="h-8 text-xs"
                                    disabled={isSubmitting}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-12">
                          <FormField
                            control={form.control}
                            name={`parts.${index}.comments`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">
                                  {t('common.comments')}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder={t(
                                      'workOrders.workLog.partCommentsPlaceholder'
                                    )}
                                    rows={2}
                                    className="text-xs"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-12 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => remove(index)}
                            disabled={isSubmitting}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="">
                              {t('common.remove')}
                            </span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common.saving')
                  : t('workOrders.workLog.addWorkLog')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkLogDialog;
