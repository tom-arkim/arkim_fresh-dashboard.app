import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Button } from '@/components/ui/shadcn/button';
import {
  SystemConfigFormData,
  systemConfigSchema,
} from '@/schemas/settings.schema';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import UnitSystemSwitcher from '@/components/ui/UnitSystemSwitcher';
import TimezoneSwitcher from '@/components/ui/TimezoneSwitcher';
import DateFormatSwitcher from '@/components/ui/DateFormatSwitcher';
import TimeFormatSwitcher from '@/components/ui/TimeFormatSwitcher';
import { logger } from '@/lib/logger';

export default function SystemConfigForm() {
  const { t } = useTranslation();

  const form = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      timezone: 'utc',
      language: 'en',
      dateFormat: 'mdy',
      timeFormat: '12h',
      temperatureUnit: 'metric',
    },
  });

  const onSubmit = (data: SystemConfigFormData) => {
    logger.info('Form submitted:', data);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.systemConfig.title')}</CardTitle>
          <CardDescription>
            {t('settings.general.systemConfig.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
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
                  name="language"
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
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'settings.general.systemConfig.form.dateFormat.label'
                        )} *
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
                  name="timeFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'settings.general.systemConfig.form.timeFormat.label'
                        )} *
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

              <FormField
                control={form.control}
                name="temperatureUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'settings.general.systemConfig.form.temperatureUnit.label'
                      )} *
                    </FormLabel>
                    <FormControl>
                      <UnitSystemSwitcher
                        onChange={field.onChange}
                        useMetricSystem={field.value}
                        showHelperText={false}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={form.formState.isSubmitting}
                >
                  {t('common.reset')}
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
