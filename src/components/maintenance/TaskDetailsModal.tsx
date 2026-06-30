import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, User, Calendar, Repeat, MapPin, Settings, Edit } from 'lucide-react';
import { TaskDetailsModalProps } from '@/types/maintenance/MaintenanceTask';
import {
  MaintenanceTask,
  MaintenanceTaskNew,
} from '@/types/maintenance/MaintenanceTask';
import CustomRecurrenceBuilder from '@/components/maintenance/CustomRecurrenceBuilder';
import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Separator } from '@/components/ui/shadcn/separator';
import { Switch } from '@/components/ui/shadcn/switch';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { TaskFormData, taskSchema } from '@/schemas/maintenance.schema';
import { DatePicker } from '@/components/ui/shadcn/datepicker';
import { MultiSelect } from '@/components/ui/MultiSelect';
import MessengerService from '@/services/ui/messengerService';

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  availableUsers,
  availableAssets,
  dataLoading,
  editMode = 'create',
  editTask,
  editDate,
  selectedAsset,
}) => {
  const { t } = useTranslation();

  const userOptions = useMemo(
    () =>
      availableUsers.map((user) => ({
        label: (
          <div className="flex flex-col items-start">
            <span>
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        ),
        value: user.email,
        badgeLabel: `${user.firstName} ${user.lastName}`,
        badgeTooltip: user.email,
      })),
    [availableUsers]
  );

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      assetId: '',
      assignedUserEmails: [],
      startDate: dayjs().format('YYYY-MM-DD'),
      rRule: '',
      endDate: undefined,
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = form;

  // Watch form values for dependent logic
  const watchEndDate = watch('endDate');
  const watchAssignedUserEmails = watch('assignedUserEmails');
  const watchStartDate = watch('startDate');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editMode !== 'create' && editTask) {
        const initialData: Partial<TaskFormData> = {
          title: editTask.title,
          description: editTask.description || '',
          assetId: editTask.assetId,
          assignedUserEmails: editTask.assignedUserEmails || [],
          startDate: editTask.startDate || dayjs().format('YYYY-MM-DD'),
          rRule: editTask.rRule || '',
          endDate: editTask.endDate || undefined,
        };
        reset(initialData);
      } else {
        reset({
          title: '',
          description: '',
          assetId: selectedAsset?.id || '',
          assignedUserEmails: [],
          startDate: dayjs().format('YYYY-MM-DD'),
          rRule: 'FREQ=WEEKLY;INTERVAL=1',
          endDate: undefined,
        });
      }
    }
  }, [isOpen, editMode, editTask, reset, selectedAsset]);

  // Handle form submission
  const onSubmit = async (data: TaskFormData) => {
    try {
      if (editMode === 'create') {
        // Create new task
        const taskData: MaintenanceTaskNew = {
          assetId: data.assetId,
          title: data.title,
          description: data.description,
          assignedUserEmails: data.assignedUserEmails || [],
          startDate: data.startDate,
          endDate: data.endDate || null,
          rRule: data.rRule,
        };
        await maintenanceTaskService.create(taskData);
      } else if (editTask?.id) {
        // Update existing task
        const updateData: MaintenanceTaskNew = {
          assetId: data.assetId,
          title: data.title,
          description: data.description,
          assignedUserEmails: data.assignedUserEmails || [],
          startDate: data.startDate,
          endDate: data.endDate || null,
          rRule: data.rRule,
        };
        await maintenanceTaskService.update(editTask.id, updateData);
      }

      onTaskCreated?.();
      onClose();
    } catch (error) {
      const msg = (error as any)?.message || String(error);
      MessengerService.error(msg);
    }
  };

  // Get modal title based on edit mode
  const getModalTitle = () => {
    return editMode === 'create'
      ? t('maintenance.createTask')
      : t('maintenance.editTask');
  };

  useEffect(() => {
    if (selectedAsset) {
      setValue('assetId', selectedAsset.id!, { shouldValidate: true });
    }
  }, [selectedAsset, setValue]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      // onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold">
            {
              editMode === 'create'
                ?
                <Plus className="h-5 w-5" />
                :
                <Edit className="h-5 w-5" />
            }
            <span>{getModalTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        {dataLoading ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {t('common.loadingData')}
              </p>
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col h-full overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="space-y-4">
                  <div className="flex items-center space-x-1 my-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-base font-medium ">
                      {t('maintenance.basicInformation')}
                    </span>
                  </div>

                  {/* Title */}
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenance.taskTitle')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('maintenance.taskTitlePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('maintenance.taskDescription')} *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              'maintenance.taskDescriptionPlaceholder'
                            )}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Asset Selection */}
                  <FormField
                    control={control}
                    name="assetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenance.selectAsset')} *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t(
                                  'maintenance.selectAssetPlaceholder'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableAssets.map((asset) => (
                              <SelectItem
                                key={asset.id || asset.name}
                                value={asset.id || asset.name}
                              >
                                <div className="flex items-center space-x-2">
                                  {/* <MapPin className="h-4 w-4 text-muted-foreground" /> */}
                                  <span>{asset.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Schedule */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{t('maintenance.schedule')}</span>
                  </h3>

                  {/* Start Date (Required) */}
                  {
                    editMode !== 'create'
                      ?
                      <div className='bg-accent py-2 px-4 rounded-md border text-sm'>{dayjs(form.getValues('startDate')).format('MMM DD, YYYY')}</div>
                      :
                      <FormField
                        control={control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('maintenance.startDate')} *</FormLabel>
                            <FormControl>
                              <DatePicker
                                selected={field.value && field.value.length > 0 ? dayjs(field.value).toDate() : undefined}
                                onSelect={(date) => {
                                  field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '');
                                }}
                                fromDate={dayjs().startOf('day').toDate()}
                                placeholder={t('maintenance.selectStartDate')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  }

                  {/* End Date (Optional) */}
                  <FormField
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenance.endDate')}</FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={
                              form.getValues('endDate')
                                ? dayjs(field.value).toDate()
                                : undefined
                            }
                            onSelect={(date) =>
                              form.setValue('endDate', date
                                ? dayjs(date).format('YYYY-MM-DD')
                                : undefined)
                            }
                            fromDate={dayjs().startOf('day').toDate()}
                            placeholder={t('maintenance.selectEndDate')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recurrence Pattern */}
                  <FormField
                    control={control}
                    name="rRule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>{t('maintenance.recurrencePattern')} *</span>
                        </FormLabel>
                        <FormControl>
                          <CustomRecurrenceBuilder
                            value={field.value}
                            onChange={(rrule) =>
                              setValue('rRule', rrule, { shouldValidate: true })
                            }
                            startDate={watchStartDate || undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* User Assignment */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{t('maintenance.assignUsers')}</span>
                    {(() => {
                      const selectedCount = (watchAssignedUserEmails || [])
                        .length;
                      return selectedCount > 0 ? (
                        <Badge variant="secondary">
                          {selectedCount} {t('maintenance.selected')}
                        </Badge>
                      ) : null;
                    })()}
                  </h3>

                  <div className="pb-4">
                    <FormField
                      control={control}
                      name="assignedUserEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <MultiSelect
                              options={userOptions}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder={t('maintenance.selectUsers')}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting || dataLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting || dataLoading}>
                  {isSubmitting
                    ? t('common.saving')
                    : editMode === 'create'
                      ? t('maintenance.createTask')
                      : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
