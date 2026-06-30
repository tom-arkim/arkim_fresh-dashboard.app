import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Loader2, Plus, X } from 'lucide-react';
import workOrderService from '@/services/api/workOrderService';
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
import { Button } from '@/components/ui/shadcn/button';
import { WorkOrderFormData, workOrderSchema } from '@/schemas/work-order.schema';
import { DatePicker } from '@/components/ui/shadcn/datepicker';
import { MultiSelect } from '@/components/ui/MultiSelect';
import MessengerService from '@/services/ui/messengerService';
import AssetBase from '@/types/equipment/AssetBase';
import UserBase from '@/types/user/UserBase';
import { WorkOrderNew } from '@/types/maintenance/WorkOrder';
import ImageViewer, { ImageViewerProvider } from '../ui/ImageViewer';
import useImageError from '@/hooks/use-image-error';

export interface WorkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkOrderCreated?: () => void;
  availableUsers: UserBase[];
  availableAssets: AssetBase[];
  loading: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const WorkOrderFormModal: React.FC<WorkOrderFormModalProps> = ({
  isOpen,
  onClose,
  onWorkOrderCreated,
  availableUsers,
  availableAssets,
  loading,
}) => {
  const { t } = useTranslation();
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const isPhotoViewerOpen = useRef(false);
  const { handleImageError } = useImageError();

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

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: '',
      description: '',
      assetId: '',
      dueDate: dayjs().format('YYYY-MM-DD'),
      assignedUserEmails: [],
    },
  });

  const { control, handleSubmit, reset, formState: { isSubmitting } } = form;

  // Escape key handler — skipped when the photo viewer is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPhotoViewerOpen.current) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        assetId: '',
        dueDate: dayjs().format('YYYY-MM-DD'),
        assignedUserEmails: [],
      });
      setPendingPhotos([]);
      setPhotoPreviews([]);
    }
  }, [isOpen, reset]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photoInputRef.current) photoInputRef.current.value = '';

    const valid = files.filter(
      (f) => ACCEPTED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    if (valid.length < files.length) {
      MessengerService.error(t('workOrders.attachments.someFilesSkipped'));
    }

    setPendingPhotos((prev) => [...prev, ...valid]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...valid.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      const workOrderData: WorkOrderNew = {
        title: data.title,
        description: data.description,
        assetId: data.assetId,
        dueDate: data.dueDate,
        assignedUserEmails: data.assignedUserEmails || [],
      };

      const created = await workOrderService.create(workOrderData);

      if (pendingPhotos.length > 0) {
        await Promise.allSettled(
          pendingPhotos.map((file) => workOrderService.uploadAttachment(created.id, file))
        );
      }

      MessengerService.success(t('workOrders.messages.workOrderCreated'));
      onWorkOrderCreated?.();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('workOrders.messages.workOrderCreatedError');
      MessengerService.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop — react-photo-view renders its overlay in a portal, so its
    // clicks never bubble here and can never trigger onClose.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onMouseDown={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold leading-none tracking-tight">
              {t('workOrders.form.createNewWorkOrder')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-6 px-6 pb-6">
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
              className="flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-6 pb-2">
                <div className="space-y-4">
                  {/* Title */}
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workOrders.table.title')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('workOrders.form.titlePlaceholder')}
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
                        <FormLabel>{t('common.description')} *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('workOrders.form.descriptionPlaceholder')}
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
                        <FormLabel>{t('workOrders.table.asset')} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t('workOrders.form.selectAssetPlaceholder')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableAssets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id!}>
                                <div className="flex items-center space-x-2">
                                  <span>{asset.name}</span>
                                  {asset.type && (
                                    <span className="text-xs text-muted-foreground">
                                      ({asset.type})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Due Date */}
                  <FormField
                    control={control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workOrders.table.dueDate')} *</FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={field.value ? dayjs(field.value).toDate() : undefined}
                            onSelect={(date) =>
                              field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')
                            }
                            fromDate={dayjs().startOf('day').toDate()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Assign Users */}
                  <FormField
                    control={control}
                    name="assignedUserEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workOrders.table.assignedTo')}</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={userOptions}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder={t('workOrders.form.selectUsers')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Photos */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      {t('workOrders.attachments.title')}
                    </p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    {photoPreviews.length > 0 && (
                      <ImageViewerProvider
                        onVisibleChange={(visible) => {
                          isPhotoViewerOpen.current = visible;
                        }}
                      >
                        <div className="flex flex-wrap gap-2 pb-2">
                          {photoPreviews.map((src, i) => (
                            <div
                              key={i}
                              className="relative aspect-square rounded-md overflow-hidden border bg-muted cursor-pointer"
                            >
                              <ImageViewer url={src}>
                                <img
                                  src={src}
                                  alt=""
                                  className="size-20 rounded object-cover border border-muted"
                                  onError={() => handleImageError(src)}
                                />
                              </ImageViewer>
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="absolute top-0 right-0 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100 disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </ImageViewerProvider>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {t('workOrders.attachments.addPhotos')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 border-t mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="mr-2"
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    t('common.create')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default WorkOrderFormModal;