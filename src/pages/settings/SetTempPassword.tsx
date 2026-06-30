'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import UserBase from '@/types/user/UserBase';
import userService from '@/services/api/userService';
import MessengerService from '@/services/ui/messengerService';

interface SetTemporaryPasswordDialogProps {
    open: boolean;
    user: UserBase | null;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const SetTemporaryPasswordDialog: React.FC<SetTemporaryPasswordDialogProps> = ({
    open,
    user,
    onOpenChange,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

    const validate = () => {
        const next: typeof errors = {};
        if (!password) {
            next.password = t('users.tempPassword.errors.required');
        } else if (password.length < 8) {
            next.password = t('users.tempPassword.errors.minLength');
        }
        if (!confirmPassword) {
            next.confirm = t('users.tempPassword.errors.confirmRequired');
        } else if (password !== confirmPassword) {
            next.confirm = t('users.tempPassword.errors.mismatch');
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleClose = () => {
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setShowPassword(false);
        setShowConfirm(false);
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!validate() || !user) return;
        setLoading(true);
        try {
            await userService.setPassword({ email: user.email, password });
            MessengerService.success(
                t('users.tempPassword.success')
            );
            onSuccess?.();
            handleClose();
        } catch {
            MessengerService.error(
                t('users.tempPassword.error')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {t('users.tempPassword.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {user && (
                            <>
                                {t('users.tempPassword.subtitle')}{' '}
                                <span className="font-medium text-foreground">
                                    {user.firstName} {user.lastName}
                                </span>{' '}
                                ({user.email})
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Warning banner */}
                <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        {t(
                            'users.tempPassword.warning'
                        )}
                    </span>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                    <Label htmlFor="tmp-password">
                        {t('users.tempPassword.passwordLabel')}
                    </Label>
                    <div className="relative">
                        <Input
                            id="tmp-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('users.tempPassword.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                            }}
                            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                </div>

                {/* Confirm password field */}
                <div className="space-y-1.5">
                    <Label htmlFor="tmp-confirm">
                        {t('users.tempPassword.confirmLabel')}
                    </Label>
                    <div className="relative">
                        <Input
                            id="tmp-confirm"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder={t('users.tempPassword.confirmPlaceholder')}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
                            }}
                            className={errors.confirm ? 'border-destructive pr-10' : 'pr-10'}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.confirm && (
                        <p className="text-xs text-destructive">{errors.confirm}</p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading
                            ? t('common.saving')
                            : t('users.tempPassword.title')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SetTemporaryPasswordDialog;