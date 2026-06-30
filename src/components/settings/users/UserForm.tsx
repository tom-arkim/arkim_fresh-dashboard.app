import React, { useEffect, useState, useCallback } from 'react';
import { useForm, FieldErrors, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Switch } from '@/components/ui/shadcn/switch';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Badge } from '@/components/ui/shadcn/badge';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import {
  Settings,
  MapPin,
  Info,
  Loader2,
  AlertCircle,
  Key,
} from 'lucide-react';
import SiteBase from '@/types/sites/SiteBase';
import UserBase from '@/types/user/UserBase';
import { useTranslation } from 'react-i18next';
import { getAvailableLanguages } from '@/i18n/i18nUtils';
import { getAvailableThemeOptions, isApiError } from '@/lib/utils';
import userService from '@/services/api/userService';
import siteService from '@/services/api/siteService';
import UserDetails from '@/types/user/UserDetails';
import MessengerService from '@/services/ui/messengerService';
import { logger } from '@/lib/logger';
import { createUserSchema, UserFormValues } from '@/schemas/user.schema';
import { useUserContext } from '@/components/contexts/AuthContext';

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: UserBase | null;
  onSuccess: () => void;
};

// Site Allocations Component
const SiteAllocations: React.FC<{
  sites: SiteBase[];
  isLoading: boolean;
}> = ({
  sites,
  isLoading,
}) => {
    const { t } = useTranslation();
    const { watch, setValue, getValues, formState: { errors } } = useFormContext<UserFormValues>();
    const assignedSites = watch('assignedSites') || [];
    const defaultSite = watch('defaultSite');

    const handleSiteAssignmentChanged = (
      siteId: string,
      isAssigned: boolean
    ) => {
      const currentAssigned = getValues('assignedSites') || [];
      const currentDefault = getValues('defaultSite');

      let newAssigned = [...currentAssigned];

      if (isAssigned && !newAssigned.includes(siteId)) {
        newAssigned.push(siteId);
      } else if (!isAssigned) {
        newAssigned = newAssigned.filter((id) => id !== siteId);

        // If removing the default site, pick a new default
        if (siteId === currentDefault) {
          setValue(
            'defaultSite',
            newAssigned.length > 0 ? newAssigned[0] : ''
          );
        }
      }
      setValue('assignedSites', newAssigned);
    };

    const handleDefaultSiteChanged = (siteId: string) => {
      const currentAssigned = getValues('assignedSites') || [];
      if (!currentAssigned.includes(siteId)) {
        setValue('assignedSites', [...currentAssigned, siteId]);
      }
      setValue('defaultSite', siteId);
    };

    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (sites.length === 0) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          {t('sites.noSitesAvailable')}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {t('users.messages.selectSites')}
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-3 gap-4 p-4 font-medium border-b bg-muted/50">
            <div>{t('users.form.site')}</div>
            <div className="text-center">{t('users.form.access')}</div>
            <div className="text-center">{t('users.form.default')}</div>
          </div>

          <div className="divide-y">
            {sites?.map((site) => (
              <div
                key={site.id}
                className="grid grid-cols-3 gap-4 p-4 items-center"
              >
                <div>
                  <div className="font-medium">{site.name}</div>
                  {site.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {site.description}
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    className='cursor-pointer'
                    checked={assignedSites.includes(site.id!)}
                    onCheckedChange={(checked) =>
                      handleSiteAssignmentChanged(site.id!, checked === true)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`default-${site.id}`}
                      name="defaultSite"
                      value={site.id}
                      checked={defaultSite === site.id}
                      onChange={() => handleDefaultSiteChanged(site.id!)}
                      disabled={!assignedSites.includes(site.id!)}
                      className="cursor-pointer h-5 w-5 text-primary border-transparent rounded-full transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(errors as any).assignedSites && (
          <Alert variant="destructive" className="mt-4" id="sites-error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {(errors as any).assignedSites.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

// Main User Form Dialog Component
const UserForm: React.FC<UserFormDialogProps> = ({
  open,
  onOpenChange,
  selectedUser,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sites, setSites] = useState<SiteBase[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { t } = useTranslation();

  const languages = getAvailableLanguages();
  const themeOptions = getAvailableThemeOptions();

  const context = useUserContext();

  const isNew = !selectedUser;
  const isCurrentUser = selectedUser?.email === context?.user?.email;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      isAdmin: false,
      isMonitoring: false,
      isTechnician: false,
      isActive: true,
      theme: 'light',
      language: 'en',
      assignedSites: [],
      defaultSite: '',
    },
  });

  // Watch form values
  const watchedValues = form.watch();

  // Load user data
  const loadUserData = useCallback(
    async (userName: string) => {
      setIsLoading(true);
      try {
        const userData = await userService.getByName(userName);
        form.reset({
          email: userData.email,
          firstName: userData.firstName ?? '',
          lastName: userData.lastName ?? '',
          isAdmin: userData.isAdmin ?? false,
          isMonitoring: userData.isMonitoring ?? false,
          isTechnician: userData.isTechnician ?? false,
          isActive: userData.isActive ?? true,
          theme: userData.theme || 'light',
          language: userData.language || 'en',
          assignedSites: userData.assignedSites || [],
          defaultSite: userData.defaultSite || '',
        });
        setError(null);
      } catch (err: any) {
        setError(`Failed to load user details: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  );

  useEffect(() => {
    if (!open) return;

    setActiveTab('basic');
    setError(null);

    if (selectedUser?.email) {
      // Existing user — loadUserData calls form.reset() with their real sites
      loadUserData(selectedUser.email);
    } else {
      // New user — always start with NO sites selected
      form.reset({
        email: '',
        firstName: '',
        lastName: '',
        isAdmin: false,
        isMonitoring: false,
        isTechnician: false,
        isActive: true,
        theme: 'light',
        language: 'en',
        assignedSites: [],
        defaultSite: '',
      });
    }
  }, [open, selectedUser?.email]);

  // Load sites once when component mounts
  useEffect(() => {
    if (!open) return;

    const fetchSites = async () => {
      if (sites.length > 0 || loadingSites) return; // already cached
      setLoadingSites(true);
      try {
        const data = await siteService.list('');
        setSites(data);
        // ✖ no form.setValue here — form state is owned by Effect 1 above
      } catch (error) {
        logger.error('Failed to load sites:', error);
        setError(t('sites.messages.failedToLoad'));
      } finally {
        setLoadingSites(false);
      }
    };

    fetchSites();
  }, [open]);

  const onSubmit = async (data: UserFormValues) => {
    MessengerService.confirm(
      isNew
        ? t('users.confirmations.createUser')
        : t('users.confirmations.updateUser'),
      isNew
        ? t('users.confirmations.createUserTitle')
        : t('users.confirmations.updateUserTitle'),
      async () => {
        try {
          setIsSubmitting(true);
          setError(null);
          const payload: UserDetails = {
            userName: '',
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            isAdmin: data.isAdmin || false,
            isMonitoring: data.isMonitoring || false,
            isTechnician: data.isTechnician || false,
            isActive: data.isActive || true,
            theme: data.theme,
            language: data.language,
            assignedSites: data.assignedSites,
            defaultSite: data.defaultSite,
          };

          if (isNew) {
            await userService.create(payload);
          } else {
            await userService.update(payload);
          }

          onSuccess();
          onOpenChange(false);
        } catch (err: any) {
          if (isApiError(err)) {
            setError(err.message ?? "Failed to update user");
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const onInvalid = (errors: FieldErrors<UserFormValues>) => {
    const basicFields = [
      'email',
      'firstName',
      'lastName',
      'isAdmin',
      'isMonitoring',
      'isTechnician',
      'roles', // key for generic role error
      'isActive',
    ];
    const preferencesFields = ['theme', 'language'];
    const sitesFields = ['assignedSites', 'defaultSite'];

    const findFirstError = (fields: string[]) => fields.find((f) => errors[f as keyof UserFormValues]);

    const firstBasicError = findFirstError(basicFields);
    const firstPreferenceError = findFirstError(preferencesFields);
    const firstSiteError = findFirstError(sitesFields);

    let newTab = activeTab;

    if (firstBasicError) {
      newTab = 'basic';
    } else if (firstPreferenceError) {
      newTab = 'preferences';
    } else if (firstSiteError) {
      newTab = 'sites';
    }

    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }

    // Scroll to error after tab switch render
    setTimeout(() => {
      const firstErrorField = firstBasicError || firstPreferenceError || firstSiteError;
      if (firstErrorField) {
        if (firstErrorField === 'roles') {
          const element = document.getElementById('roles-error-alert');
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (firstErrorField === 'assignedSites') {
          const element = document.getElementById('sites-error-alert');
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          form.setFocus(firstErrorField as any);
        }
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // onInteractOutside={(e) => {
        //   e.preventDefault();
        // }}
        className="w-full sm:max-w-2xl h-[90vh] flex flex-col overflow-hidden p-0 gap-0"
      >
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl">
                {isNew
                  ? t('users.form.createNewUser')
                  : `Edit User: ${watchedValues.email}`}
              </DialogTitle>
              {!isNew && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={watchedValues.isActive ? 'default' : 'destructive'}
                  >
                    {watchedValues.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <DialogDescription>
            {isNew
              ? t('users.messages.createNewUserDescription')
              : t('users.messages.editUserDescription')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="px-6 py-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="w-full h-full flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <div className="flex flex-col flex-1 overflow-y-auto">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col h-full"
              >
                <div className="px-6">
                  <TabsList className="inline-flex w-full h-auto p-1 bg-muted/50 overflow-x-auto overflow-y-hidden justify-start sm:justify-stretch shadow-md no-scrollbar">
                    <TabsTrigger
                      value="basic"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 shrink-0"
                    >
                      <Info className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t('users.tabs.basicInfo')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 shrink-0"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t('users.tabs.preferences')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="sites"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 shrink-0"
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t('users.tabs.sites')}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                  <TabsContent value="basic" className="space-y-4 mt-0">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.form.email')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder={t('auth.form.email')}
                              disabled={isCurrentUser}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col h-full">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem className="flex flex-col flex-1">
                              <FormLabel>{t('auth.form.firstName')}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t('auth.form.firstName')}
                                />
                              </FormControl>
                              <FormMessage className="mt-auto" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex flex-col h-full">
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem className="flex flex-col flex-1">
                              <FormLabel>{t('auth.form.lastName')}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t('auth.form.lastName')}
                                />
                              </FormControl>
                              <FormMessage className="mt-auto" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="isAdmin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('users.form.administrator')}
                            </FormLabel>
                            <FormDescription>
                              {t('users.messages.administratorDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue('isMonitoring', false);
                                  form.setValue('isTechnician', false);
                                }
                              }}
                              disabled={isCurrentUser}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isMonitoring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('users.form.monitoring')}
                            </FormLabel>
                            <FormDescription>
                              {t('users.messages.monitoringDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isCurrentUser || watchedValues.isAdmin}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isTechnician"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('users.form.technician')}
                            </FormLabel>
                            <FormDescription>
                              {t('users.messages.technicianDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isCurrentUser || watchedValues.isAdmin}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {(form.formState.errors as any).roles && (
                      <Alert variant="destructive" className="mt-4" id="roles-error-alert">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {(form.formState.errors as any).roles.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-4 mt-0">
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-base font-medium">
                            {t('company.defaultTheme')}
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoading}
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
                      name="language"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-base font-medium">
                            {t('company.defaultLanguage')}
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoading}
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
                  </TabsContent>

                  <TabsContent value="sites" className="mt-0 space-y-4">
                    <SiteAllocations
                      sites={sites}
                      isLoading={loadingSites}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </Form>
        )}

        <DialogFooter className="p-6 pt-2 gap-2 sm:gap-2 flex-col-reverse sm:flex-row bg-background sticky bottom-0 z-10 border-t mt-auto sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={form.handleSubmit(onSubmit, onInvalid)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
