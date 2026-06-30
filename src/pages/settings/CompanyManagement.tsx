import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  Save,
  Info,
  Settings,
  Loader2,
  AlertCircle,
  Ruler,
  Scale,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Tabs,
  TabsContent,
  TabsList,
} from '@/components/ui/shadcn/tabs';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Separator } from '@/components/ui/shadcn/separator';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/components/contexts/AuthContext';
import CompanySettings from '@/types/company/CompanySettings';
import {
  CompanyFormData,
  companySettingsSchema,
} from '@/schemas/settings.schema';
import companyService from '@/services/api/companyService';
import { getAvailableLanguages } from '@/i18n/i18nUtils';
import { getAvailableThemeOptions } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import MessengerService from '@/services/ui/messengerService';
import { logger } from '@/lib/logger';
import CompactLoader from '@/components/ui/CompactLoader';
import { useCompanyDetailBroadcast } from '@/hooks/broadcasts/use-company-detail-broadcast';

const CompanyManagement: React.FC = () => {
  const { t } = useTranslation();
  const auth = useAuth();

  const languages = getAvailableLanguages();
  const themeOptions = getAvailableThemeOptions();

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const { requestCompanyDetailRefresh } = useCompanyDetailBroadcast((event) => {
    if (event.type === 'COMPANY_DETAIL_REFRESHED') {
      fetchCompanySettings();
    }
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      id: '',
      name: '',
      address: '',
      email: '',
      useMetricSystem: true,
      defaultTheme: 'system',
      defaultLanguage: 'en',
    },
  });

  // Fetch company settings when component mounts
  useEffect(() => {
    fetchCompanySettings();
  }, []);

  // Update form when settings are fetched
  useEffect(() => {
    if (settings) {
      form.reset({
        id: settings.id,
        name: settings.name,
        address: settings.address ?? '',
        email: settings.email,
        useMetricSystem: settings.useMetricSystem,
        defaultTheme: settings.defaultTheme,
        defaultLanguage: settings.defaultLanguage,
      });
    }
  }, [settings, form]);

  const fetchCompanySettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await companyService.getSettings();
      setSettings(data);
    } catch (err: any) {
      logger.error('Failed to fetch company settings:', err);
      const errorMessage = err.message || 'Failed to fetch company settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSaving(true);

    MessengerService.confirm(
      t('company.saveConfirmation'),
      t('common.confirmationTitle'),
      async () => {
        try {
          const result = await companyService.updateSettings(
            data as CompanySettings
          );

          toast.success('Company settings saved successfully');
          requestCompanyDetailRefresh();
          auth.refreshContext();
          setSettings(data as CompanySettings);
        } catch (err: any) {
          logger.error('Failed to save company settings:', err);
          toast.error(`Failed to save settings: ${err.message}`);
        } finally {
          setIsSaving(false);
        }
      },
      undefined,
      t('common.save'),
      t('common.cancel')
    );
  };

  const handleRefresh = () => {
    requestCompanyDetailRefresh();
    fetchCompanySettings();
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <CompactLoader loadingMessage={t('company.loadingCompanySettings')} />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error ?? t('company.noSettingsFound')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">{t('company.companySettings')}</h1>
          <p className="page-subTitle">{t('company.companySubTitle')}</p>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isSaving}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Form {...form}>
        <div className="">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="inline-flex sm:grid w-full sm:grid-cols-2 h-auto sm:h-10 p-1 bg-transparent overflow-x-auto overflow-y-hidden justify-start sm:justify-center no-scrollbar">
              {/* <TabsTrigger
                value="basic"
                className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2 rounded-md"
              >
                <Info className="h-4 w-4" />
                <span className="whitespace-nowrap font-medium text-sm">
                  {t('company.basicInformation')}
                </span>
              </TabsTrigger> */}
              {/* <TabsTrigger
                value="preferences"
                className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2 rounded-md"
              >
                <Settings className="h-4 w-4" />
                <span className="whitespace-nowrap font-medium text-sm">
                  {t('company.preferences')}
                </span>
              </TabsTrigger> */}
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>{t('company.basicInformation')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.basicInfoSubTitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('company.companyId')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input {...field} disabled className="bg-muted" />
                              <Badge
                                variant="secondary"
                                className="absolute right-2 top-2 text-xs"
                              >
                                {t('company.readOnly')}
                              </Badge>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {t('company.uniqueCompanyIdInfo')}
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('company.companyName')} *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSaving}
                              placeholder="Enter company name"
                            />
                          </FormControl>
                          <div className="md:min-h-5">
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.email')} *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            disabled={isSaving}
                            placeholder="contact@company.com"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('company.contactEmailInfo')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.address')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={isSaving}
                            placeholder="Enter company address"
                            rows={3}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('company.companyAddressInfo')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>{t('company.systemPreferences')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('company.systemPreferencesDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
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
                              onValueChange={(val) =>
                                field.onChange(val === 'metric')
                              }
                              className="flex flex-row space-x-6 flex-wrap space-y-2"
                            >
                              {/* Metric */}
                              <FormItem className="flex items-center space-x-2 cursor-pointer">
                                <FormControl className='cursor-pointer'>
                                  <RadioGroupItem
                                    value="metric"
                                    disabled={isSaving}
                                  />
                                </FormControl>
                                <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                                  <Scale className="h-4 w-4" />
                                  {t('company.metric')}
                                </FormLabel>
                              </FormItem>

                              {/* Imperial */}
                              <FormItem className="flex items-center space-x-2 cursor-pointer">
                                <FormControl className='cursor-pointer'>
                                  <RadioGroupItem
                                    value="imperial"
                                    disabled={isSaving}
                                  />
                                </FormControl>
                                <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                                  <Ruler className="h-4 w-4" />
                                  {t('company.imperial')}
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            {t('company.unitSystemDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="defaultTheme"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-medium">
                            {t('company.defaultTheme')}
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isSaving}
                            >
                              <SelectTrigger className="w-full md:w-64">
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                              <SelectContent>
                                {themeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            {t('company.defaultThemeDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultLanguage"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-medium">
                            {t('company.defaultLanguage')}
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isSaving}
                            >
                              <SelectTrigger className="w-full md:w-64">
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                {languages.map((option) => (
                                  <SelectItem
                                    key={option.code}
                                    value={option.code}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span>{option.flag}</span>
                                      <span>{option.name}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            {t('company.defaultLanguageDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end mt-5">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSaving || !form.formState.isDirty}
              className="min-w-32"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CompanyManagement;
