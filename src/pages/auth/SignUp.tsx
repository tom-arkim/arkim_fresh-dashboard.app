import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import companyService from '../../services/api/companyService';
import CompanySignupDto from '../../types/company/CompanySignupDto';
import { useForm } from 'react-hook-form';
import { ICompanySignup, signupSchema } from '@/schemas/auth.schema';
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
import { Input } from '@/components/ui/shadcn/input';
import {
  Building,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const form = useForm<ICompanySignup>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: '',
      companyPin: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    control,
  } = form;

  const onSubmit = async (data: ICompanySignup) => {
    try {
      setSubmitError('');
      const payload: CompanySignupDto = {
        companyPin: data.companyPin,
        companyName: data.companyName,
        email: data.email,
        firstName: data.firstName!,
        lastName: data.lastName!,
        password: data.password,
      };
      await companyService.signup(payload);
      setSuccessMessage(t('auth.signup.successMessage'));
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      if (isApiError(error)) {
        setSubmitError(
          error.message ??
          t('auth.signup.error')
        );
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="firstName">
                      {t('auth.form.firstName')}
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
                    <Label htmlFor="lastName">{t('auth.form.lastName')}</Label>
                    <FormControl>
                      <Input
                        id="lastName"
                        placeholder={t('auth.form.lastName')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="confirm-password">
                    {t('auth.form.confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('auth.form.confirmPassword')}
                        className="pl-10 pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
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

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert variant={'success'}>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-primary hover:underline">
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SignUp;
