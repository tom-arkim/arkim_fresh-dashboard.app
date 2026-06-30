import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { useTranslation } from 'react-i18next';
import { siteFormSchema, SiteFormValues } from '@/schemas/settings.schema';
import MessengerService from '@/services/ui/messengerService';
import SiteDetails from '@/types/sites/SiteDetails';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import { Ruler, Save, Scale, Trash2 } from 'lucide-react';
import TimeFormatSwitcher from '@/components/ui/TimeFormatSwitcher';
import DateFormatSwitcher from '@/components/ui/DateFormatSwitcher';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import TimezoneSwitcher from '@/components/ui/TimezoneSwitcher';
import { DateFormat, TimeFormat, TimeZones } from '@/config/enum';
import { logger } from '@/lib/logger';
import siteService from '@/services/api/siteService';

interface SiteFormDialogProps {
  open: boolean;
  onOpenChange: () => void;
  initialData?: Partial<SiteFormValues> | null; // for edit mode
  onFormSubmit: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function SiteFormDialog({
  open,
  onOpenChange,
  initialData,
  onFormSubmit,
  onDelete,
}: SiteFormDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || '',
      description: initialData?.description || '',
      email: initialData?.email || '',
      useMetricSystem: initialData?.useMetricSystem ?? false,
      configuration: {
        timezone: initialData?.configuration?.timezone || TimeZones.UTC,
        language: initialData?.configuration?.language || 'en',
        dateFormat: initialData?.configuration?.dateFormat || DateFormat.MDY,
        timeFormat: initialData?.configuration?.timeFormat || TimeFormat.TWELVE_HOURS,
      },
    },
  });
  const [loading, setLoading] = useState(false);

  const isNew = !initialData?.id;

  const handleSubmit = async (values: SiteFormValues) => {
    MessengerService.confirm(
      isNew ? t('sites.confirmations.create') : t('sites.confirmations.update'),
      t('common.confirmationTitle'),
      async () => {
        try {
          setLoading(true);

          if (isNew) {
            await siteService.create(values as SiteDetails);
          } else {
            await siteService.update(values as SiteDetails);
          }

          MessengerService.success(
            isNew
              ? t('sites.messages.siteCreated') || 'Site created successfully'
              : t('sites.messages.siteUpdated') || 'Site updated successfully'
          );
          form.reset();
          onFormSubmit();
        } catch (err: any) {
          logger.error('Error saving site:', err);
          MessengerService.error(err.message || 'Failed to save site');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleClose = () => {
    form.reset();
    onOpenChange();
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(initialData?.id || '');
    handleClose();
    setLoading(false);
  };

  useEffect(() => {
    const fetchSite = async () => {
      if (initialData?.id) {
        setIsLoading(true);
        const site = await siteService.getById(initialData.id);
        if (site) {
          form.reset({
            id: site.id || undefined,
            name: site.name || '',
            description: site.description || '',
            email: site.email || '',
            useMetricSystem: site.useMetricSystem || false,
            configuration: {
              timezone: site?.configuration?.timezone || TimeZones.UTC,
              language: site?.configuration?.language || 'en',
              dateFormat: site?.configuration?.dateFormat || DateFormat.MDY,
              timeFormat: site?.configuration?.timeFormat || TimeFormat.TWELVE_HOURS,
            },
          });
        }
        setIsLoading(false);
      }
    };

    if (initialData?.id) {
      fetchSite();
    } else {
      form.reset({
        name: '',
        description: '',
        email: '',
        useMetricSystem: false,
        configuration: {
          timezone: TimeZones.UTC,
          language: 'en',
          dateFormat: DateFormat.MDY,
          timeFormat: TimeFormat.TWELVE_HOURS,
        },
      });
    }
  }, [form, initialData]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>Loading...</DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {isNew ? t('sites.form.createNewSite') : t('sites.form.editSite')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sites.form.siteName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('sites.form.siteName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sites.form.description')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('sites.form.description')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sites.form.email')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('sites.form.email')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Use Metric System */}
              <FormField
                control={form.control}
                name="useMetricSystem"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-base font-medium">
                      {t('company.unitSystem')}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? 'metric' : 'imperial'}
                        onValueChange={(val) => field.onChange(val === 'metric')}
                        className="flex flex-row space-x-6 flex-wrap space-y-2"
                      >
                        {/* Imperial */}
                        <FormItem className="flex items-center space-x-2 cursor-pointer">
                          <FormControl className='cursor-pointer'>
                            <RadioGroupItem value="imperial" disabled={loading} />
                          </FormControl>
                          <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                            <Ruler className="h-4 w-4" />
                            {t('company.imperial')}
                          </FormLabel>
                        </FormItem>
                        {/* Metric */}
                        <FormItem className="flex items-center space-x-2 cursor-pointer">
                          <FormControl className='cursor-pointer'>
                            <RadioGroupItem value="metric" disabled={loading} />
                          </FormControl>
                          <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                            <Scale className="h-4 w-4" />
                            {t('company.metric')}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="configuration.timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('settings.general.systemConfig.form.timezone.label')} *
                      </FormLabel>
                      <FormControl>
                        <TimezoneSwitcher
                          onChange={field.onChange}
                          timezone={field.value}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="configuration.language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('settings.general.systemConfig.form.language.label')}
                      </FormLabel>
                      <FormControl>
                        <LanguageSwitcher
                          language={field.value}
                          onLanguageChange={field.onChange}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="configuration.dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('settings.general.systemConfig.form.dateFormat.label')}
                        *
                      </FormLabel>
                      <FormControl>
                        <DateFormatSwitcher
                          onChange={field.onChange}
                          dateFormat={field.value}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="configuration.timeFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('settings.general.systemConfig.form.timeFormat.label')}{' '}
                        *
                      </FormLabel>
                      <FormControl>
                        <TimeFormatSwitcher
                          onChange={field.onChange}
                          timeFormat={field.value}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-2 gap-2 sm:gap-2 flex-col-reverse sm:flex-row bg-background sticky bottom-0 z-10 border-t mt-auto sm:justify-between">
              {!isNew && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loading}
                  onClick={handleDelete}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {loading ? t('common.loading') : t('common.delete')}
                </Button>
              )}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose()}
                  className="w-full sm:w-auto"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
