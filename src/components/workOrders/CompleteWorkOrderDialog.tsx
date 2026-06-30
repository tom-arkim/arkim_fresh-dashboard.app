import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash, Wrench } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';
import { WorkLogOutcome } from '@/config/enum';
import { CompleteWorkLogFormData, completeWorkLogSchema } from '@/schemas/work-log.schema';

interface CompleteWorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workLog?: WorkLogBase) => Promise<void>;
  hasWorkLogs?: boolean;
}

const CompleteWorkOrderDialog: React.FC<CompleteWorkOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  hasWorkLogs = false,
}) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CompleteWorkLogFormData>({
    resolver: zodResolver(completeWorkLogSchema),
    defaultValues: {
      resolutionAlreadyLogged: false,
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

  const resolutionAlreadyLogged = form.watch('resolutionAlreadyLogged');

  const { formState: { isSubmitting } } = form;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        resolutionAlreadyLogged: false,
        outcome: WorkLogOutcome.Fixed,
        troubleshootingSteps: '',
        parts: [],
        comments: '',
      });
      setError(null);
    }
  }, [isOpen, form]);

  const handleSubmit = async (data: CompleteWorkLogFormData) => {
    try {
      setError(null);

      // If resolution already logged, call without work log data
      if (data.resolutionAlreadyLogged) {
        await onSubmit(undefined);
      } else {
        // Otherwise, include the work log
        const workLog: WorkLogBase = {
          outcome: data.outcome!,
          troubleshootingSteps: data.troubleshootingSteps,
          parts:
            data.parts && data.parts.length > 0
              ? data.parts.map((part) => ({
                manufacturer: part.manufacturer,
                model: part.model,
                partNumber: part.partNumber,
                quantity: part.quantity,
                comments: part.comments,
              }))
              : undefined,
          comments: data.comments,
        };
        await onSubmit(workLog);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleAddPart = () => {
    append({
      manufacturer: '',
      model: '',
      partNumber: '',
      quantity: undefined,
      comments: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('workOrders.complete.title')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Resolution Already Logged Checkbox - only show if work logs exist */}
            {hasWorkLogs && (
              <FormField
                control={form.control}
                name="resolutionAlreadyLogged"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="resolutionAlreadyLogged"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label className="font-medium" htmlFor="resolutionAlreadyLogged">
                        {t('workOrders.complete.resolutionAlreadyLogged')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          'workOrders.complete.resolutionAlreadyLoggedDescription'
                        )}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Show work log form only if resolution not already logged */}
            {!resolutionAlreadyLogged && (
              <>
                {/* Outcome */}
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
                          className="flex gap-4 flex-wrap"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={WorkLogOutcome.Fixed}
                              id="outcome-fixed"
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
                              id="outcome-partial"
                            />
                            <label
                              htmlFor="outcome-partial"
                              className="cursor-pointer"
                            >
                              {t('workOrders.workLog.outcomes.partiallyFixed')}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={WorkLogOutcome.NotFixed}
                              id="outcome-not-fixed"
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

                {/* Parts Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
                      {t('workOrders.workLog.partsUsed')}
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPart}
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
                                      placeholder={t(
                                        'workOrders.workLog.model'
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
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : undefined
                                        )
                                      }
                                      placeholder={t(
                                        'workOrders.workLog.quantity'
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
                                      className="text-xs resize-none"
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="col-span-12 flex items-center justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => remove(index)}
                              disabled={isSubmitting}
                            >
                              <Trash className="h-4 w-4" />
                              <span>
                                {t('common.remove')}
                              </span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common.completing')
                  : t('workOrders.complete.complete')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteWorkOrderDialog;
