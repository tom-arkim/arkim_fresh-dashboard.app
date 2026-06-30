import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/shadcn/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { IPasswordReset, passwordResetschema } from '@/schemas/auth.schema';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/shadcn/collapsible';
import { Link } from 'react-router-dom';
import MessengerService from '@/services/ui/messengerService';
import userService from '@/services/api/userService';

interface PasswordResetFormProps {
  onSuccess?: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = React.useState(false);

  const form = useForm<IPasswordReset>({
    resolver: zodResolver(passwordResetschema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: IPasswordReset) => {
    MessengerService.confirm(
      t('layout.preferences.passwordResetConfirmation'),
      t('common.confirmationTitle'),
      async () => {
        setLoading(true);
        try {
          await userService.changePassword(
            data.oldPassword,
            data.newPassword
          );

          MessengerService.success(t('layout.preferences.passwordResetSuccess'));
          form.reset();
          if (onSuccess) onSuccess();
          setOpen(false);
        } catch (error: any) {
          if (error.status === 400) {
            form.setError('oldPassword', {
              type: 'manual',
              message: error.message || t('layout.preferences.passwordResetError'),
            });
          } else {
            MessengerService.error(t('layout.preferences.passwordResetError'));
          }
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <div>
      {!open && (
        <div className="mt-2 mb-2">
          <Link
            to="#"
            onClick={handleToggle}
            className="text-sm text-blue-600 hover:underline"
          >
            {t('layout.preferences.changePassword')}
          </Link>
        </div>
      )}

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 w-full"
            >
              {/* Old Password */}
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('layout.preferences.currentPassword')}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('layout.preferences.newPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('layout.preferences.confirmNewPassword')}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setOpen(false);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? t('common.processing')
                    : t('layout.preferences.updatePassword')}
                </Button>
              </div>
            </form>
          </Form>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PasswordResetForm;
