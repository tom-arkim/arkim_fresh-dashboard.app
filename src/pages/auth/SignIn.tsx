import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { ICompanyLogin, loginSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const auth = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const form = useForm<ICompanyLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyId: '',
      email: '',
      password: '',
      longLasting: false,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: ICompanyLogin) => {
    try {
      setSubmitError('');
      await auth.signIn();
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      if (isApiError(error)) {
        setSubmitError(error.message ?? t('error.authenticationError'));
      } else {
        setSubmitError(t('error.authenticationError'));
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="w-full flex items-center justify-center">
          <img
            src="/arkim_logo_horizontal.png"
            alt={t('layout.title')}
            className="h-14 w-auto dark:invert-100"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="companyId">
                    {t('auth.form.companyPin')} *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="companyId"
                        placeholder={t('auth.form.companyPin')}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">{t('auth.form.email')} *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('auth.form.email')}
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="password">{t('auth.form.password')} *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.form.password')}
                        className="pl-10 pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="longLasting"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="longLasting"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label htmlFor="longLasting" className="text-sm font-normal">
                    {t('auth.form.rememberMe')}
                  </Label>
                </FormItem>
              )}
            />

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.dontHaveAccount')}
                <Link
                  to="/signup"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t('auth.signUp')}
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Login;
