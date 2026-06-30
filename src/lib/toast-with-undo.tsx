import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CircleCheckBig, Trash2, X } from 'lucide-react';
import { Progress } from '@/components/ui/shadcn/progress';

/**
 * Configuration for delete action with confirmation and undo functionality
 */
export interface DeleteWithConfirmConfig {
    /** The item name being deleted (e.g., "HWP1", "Equipment Type: Motor") */
    itemName: string;
    /** The type of item being deleted (e.g., "equipment", "location", "label") */
    itemType: string;
    /** Confirmation message (optional, will use default if not provided) */
    confirmMessage?: string;
    /** Function to execute the actual delete API call */
    onDelete: () => Promise<void>;
    /** Function to call after successful delete (e.g., refresh list) */
    onSuccess?: () => void;
    /** Function to call if delete fails */
    onError?: (error: Error) => void;
    /** Undo timeout in milliseconds (default: 5000ms) */
    undoTimeout?: number;
}

/**
 * Custom toast component with improved UI/UX
 */
const DeleteToastContent = ({
    itemName,
    itemType,
    undoTimeout,
    onUndo,
    onImmediateDelete,
    onDismiss,
}: {
    itemName: string;
    itemType: string;
    undoTimeout: number;
    onUndo: () => void;
    onImmediateDelete: () => void;
    onDismiss: () => void;
}) => {
    const [timeLeft, setTimeLeft] = useState(undoTimeout / 1000);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 0.1));
        }, 100);
        return () => clearInterval(interval);
    }, [timeLeft]);

    const progressValue = (timeLeft / (undoTimeout / 1000)) * 100;

    return (
        <div className="relative w-full min-w-95 max-w-md bg-background border border-border rounded-lg shadow-lg p-4">
            {/* Close button */}
            <button
                onClick={onDismiss}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
            >
                <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="flex gap-3">
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                    <Trash2 className="h-5 w-5 text-destructive" />
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-3">
                    {/* Text content */}
                    <div className="pr-6">
                        <p className="font-medium text-sm text-foreground">
                            Deleting {itemName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {itemType} will be deleted in {Math.ceil(timeLeft)}s
                        </p>
                    </div>

                    {/* Progress bar */}
                    <Progress
                        value={progressValue}
                        className="h-1.5 w-full bg-muted"
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onUndo}
                            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Undo
                        </button>
                        <button
                            onClick={onImmediateDelete}
                            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                            Delete now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Shows a toast notification for delete action with undo functionality
 * Use this AFTER user confirms deletion in AlertDialog
 */
export const showDeleteToastWithUndo = (config: DeleteWithConfirmConfig) => {
    const {
        itemName,
        itemType,
        onDelete,
        onSuccess,
        onError,
        undoTimeout = 5000,
    } = config;

    let isUndone = false;
    let deleteTimeoutId: number | undefined;
    let deleteStarted = false;

    // Execute the actual delete
    const executeDelete = async () => {
        if (isUndone || deleteStarted) return;
        deleteStarted = true;

        try {
            await onDelete();
            toast.success(`${itemName} deleted`, {
                description: `${itemType} has been permanently removed`,
                duration: 3000,
                icon: <CircleCheckBig className="h-5 w-5" />,
            });
            onSuccess?.();
        } catch (error) {
            const err = error as Error;
            toast.error(`Failed to delete ${itemName}`, {
                description: err.message || 'An unexpected error occurred',
                duration: 5000,
            });
            onError?.(err);
        }
    };

    // Handle undo action
    const handleUndo = () => {
        isUndone = true;
        if (deleteTimeoutId) {
            clearTimeout(deleteTimeoutId);
            deleteTimeoutId = undefined;
        }
        toast.dismiss(toastId as any);
        toast.info(`Delete cancelled`, {
            description: `${itemName} was not deleted`,
            duration: 3000,
        });
    };

    // Handle immediate delete
    const handleImmediateDelete = () => {
        isUndone = false;
        if (deleteTimeoutId) {
            clearTimeout(deleteTimeoutId);
            deleteTimeoutId = undefined;
        }
        toast.dismiss(toastId as any);
        executeDelete();
    };

    // Handle dismiss
    const handleDismiss = () => {
        toast.dismiss(toastId as any);
    };

    // Show custom toast
    const toastId = toast.custom(
        (t) => (
            <DeleteToastContent
                itemName={itemName}
                itemType={itemType}
                undoTimeout={undoTimeout}
                onUndo={handleUndo}
                onImmediateDelete={handleImmediateDelete}
                onDismiss={handleDismiss}
            />
        ),
        {
            duration: undoTimeout,
            onAutoClose: () => {
                if (!isUndone && !deleteStarted) {
                    executeDelete();
                }
            },
        }
    );

    return toastId;
};

/**
 * Shows a simple success toast notification
 */
export const showSuccessToast = (message: string, description?: string) => {
    toast.success(message, {
        description,
        duration: 3000,
        icon: <CircleCheckBig className="h-5 w-5" />,
    });
};

/**
 * Shows a simple error toast notification
 */
export const showErrorToast = (message: string, description?: string) => {
    toast.error(message, {
        description,
        duration: 5000,
    });
};

/**
 * Shows a simple info toast notification
 */
export const showInfoToast = (message: string, description?: string) => {
    toast.info(message, {
        description,
        duration: 3000,
    });
};

/**
 * Shows a simple warning toast notification
 */
export const showWarningToast = (message: string, description?: string) => {
    toast.warning(message, {
        description,
        duration: 4000,
    });
};
