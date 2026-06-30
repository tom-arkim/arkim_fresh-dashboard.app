import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import { logger } from '@/lib/logger';
import UserBase from '@/types/user/UserBase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { getWorkOrderCardBorderColor, getWorkOrderStatusLabel, getWorkOrderStatusVariant } from '@/lib/colors';
import { WorkOrderStatus } from '@/config/enum';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/shadcn/tooltip';
import { Skeleton } from '@/components/ui/shadcn/skeleton';

interface EventDetailsCardProps {
  title: string;
  description?: string;
  date: string;
  assetName?: string;
  isWorkOrder: boolean;
  workOrderId?: string;
  taskId?: string;
  occurrenceDate?: string;
  status?: WorkOrderStatus;
  assignedUsers?: UserBase[];
  showDate?: boolean;
  compact?: boolean;
  className?: string;
  onConvertToWorkOrder?: () => void | Promise<void>;
}

export const EventDetailsCard: React.FC<EventDetailsCardProps> = ({
  title,
  description,
  date,
  assetName,
  isWorkOrder,
  workOrderId,
  taskId,
  occurrenceDate,
  status,
  assignedUsers,
  showDate = true,
  compact = false,
  className,
  onConvertToWorkOrder,
}) => {
  const { t } = useTranslation();
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  const titleSize = compact ? 'text-base' : 'text-lg';
  const textSize = compact ? 'text-sm' : 'text-sm';

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md py-0 gap-0',
          getWorkOrderCardBorderColor(status, isWorkOrder),
          className
        )}
      >
        <CardHeader
          className={cn(
            'flex flex-col sm:flex-row sm:items-start justify-between gap-3 flex-none',
            compact ? 'p-4 pb-0' : 'p-6 pb-0'
          )}
        >
          <div className="min-w-0 flex-1">
            <CardTitle className={cn('font-semibold tracking-tight', titleSize)}>
              {title}
            </CardTitle>
          </div>
          <CardAction className="flex items-center gap-2 flex-wrap shrink-0 sm:justify-end">
            {isWorkOrder && status && (
              <Badge
                variant={getWorkOrderStatusVariant(status)}
                className="font-medium text-xs tracking-wider"
              >
                {getWorkOrderStatusLabel(status)}
              </Badge>
            )}
            {isWorkOrder ? (
              <Link
                to={`/work-orders/${workOrderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {t('maintenance.planning.workOrder')}
              </Link>
            ) : (
              <Button
                onClick={() => setShowConvertDialog(true)}
                size={'sm'}
                variant={'link'}
                className="text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 hover:underline h-auto py-0 px-0"
              >
                <FileText className="h-3 w-3" />
                {t('maintenance.planning.createWorkOrder')}
              </Button>
            )}
          </CardAction>
        </CardHeader>

        <CardContent
          className={cn('space-y-3 mt-0', compact ? 'p-4 pt-3' : 'p-6 pt-4')}
        >
          {/* Description */}
          {description && (
            <p
              className={cn(
                'text-muted-foreground wrap-break-word leading-relaxed',
                textSize
              )}
            >
              {description}
            </p>
          )}

          {/* Details grid */}
          <div className="grid gap-2">
            {showDate && (
              <div className={cn(textSize, 'flex items-center gap-2')}>
                <span className="font-semibold text-foreground/80">
                  {t('workOrders.form.dueDate')}:
                </span>
                <span className="text-muted-foreground">
                  {dayjs(date).format('DD MMM YYYY')}
                </span>
              </div>
            )}

            {assetName && (
              <div className={cn(textSize, 'flex items-center gap-2')}>
                <span className="font-semibold text-foreground/80">
                  {t('maintenance.asset')}:
                </span>
                <span className="text-muted-foreground">{assetName}</span>
              </div>
            )}
          </div>

          {/* Assigned Users */}
          {assignedUsers && assignedUsers.length > 0 && (
            <div className={textSize}>
              <span className="font-semibold text-foreground/80 mb-2 block">
                {t('workOrders.table.assignedTo')}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {assignedUsers.map((user) => (
                  <Tooltip key={user.email}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium px-2 py-0 cursor-help"
                      >
                        {user.firstName} {user.lastName}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.email}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        {/* Convert to Work Order Confirmation Dialog */}
        <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('maintenance.planning.confirmConvertTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('maintenance.planning.confirmConvertDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setShowConvertDialog(false);
                  if (taskId && occurrenceDate) {
                    try {
                      await maintenanceTaskService.convertToWorkOrder(
                        taskId,
                        occurrenceDate
                      );
                      toast.success(t('maintenance.planning.workOrderCreated'));
                      await onConvertToWorkOrder?.();
                    } catch (error) {
                      logger.error('Error converting to work order:', error);
                      toast.error(
                        t('maintenance.planning.workOrderCreationFailed')
                      );
                    }
                  }
                }}
              >
                {t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </TooltipProvider>
  );
};

// Skeleton component for EventDetailsCard
export const EventDetailsCardSkeleton: React.FC<{
  compact?: boolean;
  className?: string;
}> = ({ compact = false, className }) => {
  return (
    <Card
      className={cn(
        'bg-muted/50 transition-all duration-200 py-0 gap-0',
        className
      )}
    >
      <CardHeader
        className={cn('flex-none', compact ? 'p-4 pb-0' : 'p-6 pb-0')}
      >
        <Skeleton
          className={cn('h-6 mb-2', compact ? 'w-3/4' : 'w-2/3')}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>

      <CardContent
        className={cn('space-y-3 mt-0', compact ? 'p-4 pt-3' : 'p-6 pt-4')}
      >
        {/* Description skeleton */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* Details grid skeleton */}
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Assigned Users skeleton */}
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
