import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import companyService from '@/services/api/companyService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isApiError } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import { Building, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import oidcAuthService from '@/services/auth/oidcAuthService';
import { CompanySetupForm, companySetupSchema } from '@/schemas/company-setup.schema';

const CompanySetup: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<CompanySetupForm>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: {
      companyPin: '',
      companyName: '',
      firstName: '',
      lastName: '',
    },
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    control,
  } = form;

  const onSubmit = async (data: CompanySetupForm) => {
    try {
      setSubmitError('');
      await companyService.setup(data);

      setIsRedirecting(true);
      await oidcAuthService.signOut();
    } catch (error: any) {
      if (isApiError(error)) {
        setSubmitError(
          error.message || t('auth.companySetup.error')
        );
      } else {
        setSubmitError(t('auth.companySetup.error'));
      }
    }
  };

  if (isRedirecting) {
    return (
      <main
        className="flex items-center justify-center min-h-screen"
        style={{
          backgroundImage: 'url("/bg-centre-gradient.png")',
        }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h3 className="text-lg font-semibold">{t('auth.companySetup.successTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('auth.companySetup.successMessage')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url("/bg-centre-gradient.png")',
      }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="w-full flex items-center justify-center">
            <img
              src="/arkim_logo_horizontal.png"
              alt={t('layout.title')}
              className="h-14 w-auto dark:invert-100"
            />
          </CardTitle>
          <h2 className="text-xl font-semibold text-center mt-4">
            {t('auth.companySetup.title')}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.companySetup.subTitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={control}
                name="companyPin"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="companyPin">
                      {t('auth.form.companyPin')} *
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="companyPin"
                          placeholder={t('auth.form.companyPin')}
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage>
                      <span className="text-xs text-muted-foreground">
                        {t('auth.form.companyPinHelp')}
                      </span>
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="companyName">
                      {t('auth.form.companyName')} *
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="companyName"
                          placeholder={t('auth.form.companyName')}
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="firstName">
                      {t('auth.form.firstName')} *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="firstName"
                          placeholder={t('auth.form.firstName')}
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="lastName">
                      {t('auth.form.lastName')} *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="lastName"
                          placeholder={t('auth.form.lastName')}
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('common.creating') : t('auth.companySetup.submit')}
              </Button>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/company-select')}
                >
                  {t('auth.companySetup.back')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
};

export default CompanySetup;

