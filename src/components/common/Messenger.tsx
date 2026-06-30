import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'default' | 'destructive' | 'secondary';
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

export const Messenger: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  confirmButtonText,
  cancelButtonText = 'Cancel',
  confirmButtonColor = 'default',
  onConfirm,
  onCancel,
  icon,
}) => {
  return (
    <Dialog open={open} onOpenChange={(val: boolean) => !val && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelButtonText}
          </Button>
          <Button
            variant={
              confirmButtonColor === 'destructive' ? 'destructive' : 'default'
            }
            onClick={onConfirm}
          >
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
