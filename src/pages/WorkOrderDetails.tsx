import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Save,
  User,
  Wrench,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
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
} from '@/components/ui/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { DatePicker } from '@/components/ui/shadcn/datepicker';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import CompactLoader from '@/components/ui/CompactLoader';
import workOrderService from '@/services/api/workOrderService';
import MessengerService from '@/services/ui/messengerService';
import useDataStore from '@/store/dataStore';
import WorkLogDialog from '@/components/workOrders/WorkLogDialog';
import CompleteWorkOrderDialog from '@/components/workOrders/CompleteWorkOrderDialog';
import WorkOrderAttachments from '@/components/workOrders/WorkOrderAttachments';
import {
  WorkOrder,
  WorkLogBase,
  WorkLogDetails,
} from '@/types/maintenance/WorkOrder';
import UserBase from '@/types/user/UserBase';
import { WorkOrderFormData, workOrderSchema } from '@/schemas/work-order.schema';
import { formatWithUserSettings } from '@/lib/dayjs-utils';
import { WorkLogOutcome, WorkOrderStatus } from '@/config/enum';
import { getWorkOrderOutcomeLabel, getWorkOrderStatusLabel, getWorkOrderStatusVariant } from '@/lib/colors';

const ReadOnlyField = ({
  label,
  value,
  className
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    <div className="text-sm">{value}</div>
  </div>
);

const WorkOrderHeader = ({
  workOrder,
  onBack,
  onCancel,
  onComplete,
  cancelling,
  saving,
  completing,
  t
}: {
  workOrder: WorkOrder;
  onBack: () => void;
  onCancel: () => void;
  onComplete: () => void;
  cancelling: boolean;
  saving: boolean;
  completing: boolean;
  t: any;
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
    <div className="flex items-start gap-3 min-w-0 flex-1">
      <Button
        variant="outline"
        size="icon"
        onClick={onBack}
        className="shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="page-header">{workOrder.title}</h1>
        <p className="page-subTitle">{t('workOrders.details.viewEdit')}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {workOrder.status !== WorkOrderStatus.Cancelled &&
        workOrder.status !== WorkOrderStatus.Completed && (
          <>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={cancelling || saving || completing}
              className="w-3/6 sm:w-auto shrink-0"
            >
              <X className="h-4 w-4" />
              {cancelling ? t('common.cancelling') : t('common.cancel')}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white w-3/6 sm:w-auto shrink-0"
              onClick={onComplete}
              disabled={completing || saving || cancelling}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completing
                ? t('common.completing')
                : t('workOrders.complete.complete')}
            </Button>
          </>
        )}
    </div>
  </div>
);

const WorkLogItem = ({ log, userMap, t }: { log: WorkLogDetails; userMap: Record<string, UserBase>; t: any }) => {
  const userName = log.performedBy ? (userMap[log.performedBy]?.firstName ?? '') + ' ' + (userMap[log.performedBy]?.lastName ?? '') : '';
  const isUserNameEmpty = !userName || userName.trim() === '';
  const displayName = !isUserNameEmpty ? userName : (log.performedBy || t('common.unknown'));

  return (
    <Card className="bg-muted/30">
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium cursor-help underline decoration-dotted decoration-muted-foreground/30 underline-offset-4">
                      {displayName}
                    </span>
                  </TooltipTrigger>
                  {log.performedBy && (
                    <TooltipContent>
                      <p className="text-xs">{log.performedBy}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-3">
              {log.outcome && (
                <Badge
                  variant={
                    log.outcome === WorkLogOutcome.Fixed
                      ? 'default'
                      : 'secondary'
                  }
                  className={
                    log.outcome === WorkLogOutcome.Fixed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : log.outcome === WorkLogOutcome.NotFixed
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : ''
                  }
                >
                  {getWorkOrderOutcomeLabel(log.outcome)}
                </Badge>
              )}
              {log.performedAtUtc && (
                <span className="text-sm text-muted-foreground">
                  {formatWithUserSettings(log.performedAtUtc, {
                    includeTime: true,
                  })}
                </span>
              )}
            </div>
          </div>

          {log.troubleshootingSteps && (
            <ReadOnlyField
              label={t('workOrders.workLog.troubleshootingSteps')}
              value={log.troubleshootingSteps}
              className="whitespace-pre-wrap"
            />
          )}

          {log.comments && (
            <ReadOnlyField
              label={t('common.comments')}
              value={log.comments}
              className="whitespace-pre-wrap"
            />
          )}

          {log.parts && log.parts.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                {t('workOrders.workLog.partsUsed')}:
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className='bg-card sticky top-0 z-1'>
                    <TableRow>
                      <TableHead>
                        {t('workOrders.workLog.manufacturer')}
                      </TableHead>
                      <TableHead>
                        {t('workOrders.workLog.model')}
                      </TableHead>
                      <TableHead>
                        {t('workOrders.workLog.partNumber')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('workOrders.workLog.quantity')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.parts.map((part, partIndex) => (
                      <TableRow key={partIndex}>
                        <TableCell>
                          {part.manufacturer || '-'}
                        </TableCell>
                        <TableCell>{part.model || '-'}</TableCell>
                        <TableCell>
                          {part.partNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {part.quantity || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const WorkOrderInformation = ({
  workOrder,
  form,
  onSubmit,
  isEditable,
  saving,
  cancelling,
  userOptions,
  userMap,
  t
}: {
  workOrder: WorkOrder;
  form: any;
  onSubmit: (data: WorkOrderFormData) => void;
  isEditable: boolean;
  saving: boolean;
  cancelling: boolean;
  userOptions: any[];
  userMap: Record<string, UserBase>;
  t: any;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          {t('workOrders.details.workOrderInformation')}
        </CardTitle>

        <div className='flex flex-row items-center gap-2'>
          {isEditable && (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={saving || cancelling || !form.formState.isDirty}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('common.saving') : t('common.update')}
            </Button>
          )}
          {
            form.formState.isDirty && <Button size="sm" variant='destructive' onClick={() => { form.reset(workOrder) }}>
              <Trash2 className="h-4 w-4" />
              Discard Changes
            </Button>
          }
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="pb-4 border-b">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ReadOnlyField
                label={t('workOrders.table.status')}
                value={
                  <Badge variant={getWorkOrderStatusVariant(workOrder.status)}>
                    {getWorkOrderStatusLabel(workOrder.status)}
                  </Badge>
                }
              />
              <ReadOnlyField
                label={t('workOrders.table.asset')}
                value={workOrder.assetName}
              />
              {workOrder.createdBy && (
                <ReadOnlyField
                  label={t('workOrders.details.createdBy')}
                  value={
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-muted-foreground/30 underline-offset-4">
                            {userMap[workOrder.createdBy]
                              ? `${userMap[workOrder.createdBy].firstName} ${userMap[workOrder.createdBy].lastName}`.trim()
                              : workOrder.createdBy}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{workOrder.createdBy}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                />
              )}
              {workOrder.createdAtUtc && (
                <ReadOnlyField
                  label={t('workOrders.table.createdAt')}
                  value={formatWithUserSettings(workOrder.createdAtUtc, {
                    includeTime: true,
                  })}
                />
              )}
              <ReadOnlyField
                label={t('workOrders.details.sourceType')}
                value={<span className="capitalize">{workOrder.sourceType.replace('_', ' ')}</span>}
              />
              {workOrder.status === WorkOrderStatus.Cancelled && (
                <>
                  {workOrder.cancelledBy && (
                    <ReadOnlyField
                      label={t('workOrders.details.cancelledBy')}
                      value={
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted decoration-muted-foreground/30 underline-offset-4">
                                {userMap[workOrder.cancelledBy]
                                  ? `${userMap[workOrder.cancelledBy].firstName} ${userMap[workOrder.cancelledBy].lastName}`.trim()
                                  : workOrder.cancelledBy}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{workOrder.cancelledBy}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      }
                    />
                  )}
                  {workOrder.cancelledAtUtc && (
                    <ReadOnlyField
                      label={t('workOrders.details.cancelledAt')}
                      value={formatWithUserSettings(workOrder.cancelledAtUtc, {
                        includeTime: true,
                      })}
                    />
                  )}
                  {workOrder.cancellationReason && (
                    <ReadOnlyField
                      label={t('workOrders.details.cancellationReason')}
                      value={workOrder.cancellationReason}
                      className="col-span-2 md:col-span-3"
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {
            isEditable ?
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('workOrders.table.title')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('workOrders.form.titlePlaceholder')}
                          disabled={!isEditable}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.description')} *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('workOrders.form.descriptionPlaceholder')}
                          rows={4}
                          disabled={!isEditable}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('workOrders.table.dueDate')} *</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value ? dayjs(field.value).toDate() : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(dayjs(date).format('YYYY-MM-DD'));
                            } else {
                              field.onChange('');
                            }
                          }}
                          fromDate={dayjs().startOf('day').toDate()}
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedUserEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('workOrders.table.assignedTo')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={userOptions}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder={t('workOrders.form.selectUsers')}
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
              :
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <ReadOnlyField
                  label={t('workOrders.table.title')}
                  value={workOrder.title}
                  className="col-span-2 md:col-span-3"
                />
                <ReadOnlyField
                  label={t('common.description')}
                  value={workOrder.description}
                  className="col-span-2 md:col-span-3 whitespace-pre-wrap"
                />
                <ReadOnlyField
                  label={t('workOrders.table.dueDate')}
                  value={formatWithUserSettings(workOrder.dueDate)}
                />
                <ReadOnlyField
                  label={t('workOrders.table.assignedTo')}
                  value={
                    <div className="flex flex-wrap gap-1.5">
                      {workOrder.assignedUserEmails && workOrder.assignedUserEmails.length > 0 ? (
                        <TooltipProvider>
                          {workOrder.assignedUserEmails.map((email) => {
                            const user = userMap[email];
                            const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
                            const displayName = userName || email;
                            return (
                              <Tooltip key={email}>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-[11px] font-normal cursor-help">
                                    {displayName}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{email}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </TooltipProvider>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                  }
                  className="col-span-1 md:col-span-2"
                />
              </div>
          }

        </form>
      </Form>
    </CardContent>
  </Card>
);

const WorkLogSection = ({ workOrder, onAddLog, userMap, t }: { workOrder: WorkOrder; onAddLog: () => void; userMap: Record<string, UserBase>; t: any }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {t('workOrders.workLog.title')} ({workOrder.workLogs?.length || 0})
        </CardTitle>
        {workOrder.status !== WorkOrderStatus.Cancelled &&
          workOrder.status !== WorkOrderStatus.Completed && (
            <Button
              onClick={onAddLog}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('workOrders.workLog.addWorkLog')}
            </Button>
          )}
      </div>
    </CardHeader>
    <CardContent>
      {!workOrder.workLogs || workOrder.workLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('workOrders.workLog.noWorkLogs')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workOrder.workLogs.map((log, index) => (
            <WorkLogItem key={index} log={log} userMap={userMap} t={t} />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const WorkOrderCancelDialog = ({
  isOpen,
  onClose,
  onConfirm,
  reason,
  setReason,
  cancelling,
  t
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reason: string;
  setReason: (val: string) => void;
  cancelling: boolean;
  t: any;
}) => (
  <AlertDialog open={isOpen} onOpenChange={onClose}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('workOrders.confirmCancel.title')}</AlertDialogTitle>
        <AlertDialogDescription>
          {t('workOrders.confirmCancel.description')}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-4">
        <label className="text-sm font-medium mb-2 block">
          {t('workOrders.confirmCancel.reasonLabel')} *
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('workOrders.confirmCancel.reasonPlaceholder')}
          rows={3}
          disabled={cancelling}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel
          disabled={cancelling}
          onClick={() => {
            onClose();
            setReason('');
          }}
        >
          {t('common.back')}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={cancelling || !reason.trim()}
          className="bg-destructive hover:bg-destructive/90"
        >
          {cancelling ? t('common.cancelling') : t('common.cancelWorkOrder')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);


const WorkOrderDetails: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workOrderId } = useParams<{ workOrderId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showWorkLogDialog, setShowWorkLogDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const { users, userMap } = useDataStore();

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: '',
      description: '',
      assetId: '',
      dueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      assignedUserEmails: [],
    },
  });

  const loadWorkOrder = useCallback(async () => {
    if (!workOrderId) return;
    setLoading(true);
    try {
      const data = await workOrderService.getById(workOrderId);
      setWorkOrder(data);
      form.reset({
        title: data.title,
        description: data.description,
        assetId: data.assetId,
        dueDate: data.dueDate,
        assignedUserEmails: data.assignedUserEmails || [],
      });
    } catch (error) {
      MessengerService.error(t('workOrders.messages.failedToLoadWorkOrder'));
      navigate('/work-orders');
    } finally {
      setLoading(false);
    }
  }, [workOrderId, form, t, navigate]);


  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  const onSubmit = async (data: WorkOrderFormData) => {
    if (!workOrderId) return;
    MessengerService.confirm(
      t('workOrders.confirmSave.description'),
      t('workOrders.confirmSave.title'),
      async () => {
        try {
          setSaving(true);
          await workOrderService.update(workOrderId, {
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            assignedUserEmails: data.assignedUserEmails || [],
          });
          MessengerService.success(t('workOrders.messages.workOrderUpdated'));
          await loadWorkOrder();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : t('workOrders.messages.workOrderUpdateError');
          MessengerService.error(errorMessage);
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleCancelWorkOrder = async () => {
    if (!workOrderId || !cancellationReason.trim()) return;
    setCancelling(true);
    try {
      await workOrderService.cancel(workOrderId, { comments: cancellationReason.trim() });
      MessengerService.success(t('workOrders.messages.workOrderCancelled'));
      setShowCancelConfirm(false);
      setCancellationReason('');
      await loadWorkOrder();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('workOrders.messages.workOrderCancelError');
      MessengerService.error(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const handleAddWorkLog = async (workLog: WorkLogBase) => {
    if (!workOrderId) return;
    try {
      await workOrderService.addWorkLog(workOrderId, workLog);
      MessengerService.success(t('workOrders.messages.workLogAdded'));
      await loadWorkOrder();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('workOrders.messages.workLogAddError');
      MessengerService.error(errorMessage);
      throw error;
    }
  };

  const handleComplete = async (workLog?: WorkLogBase) => {
    if (!workOrderId) return;
    setCompleting(true);
    try {
      await workOrderService.resolve(workOrderId, workLog);
      MessengerService.success(t('workOrders.messages.workOrderCompleted'));
      await loadWorkOrder();
      setShowCompleteDialog(false);
    } catch (error) {
      MessengerService.error(t('workOrders.messages.failedToCompleteWorkOrder'));
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><CompactLoader /></div>;
  if (!workOrder) return <div className="text-center py-12"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="text-lg font-medium text-muted-foreground mb-2">{t('workOrders.messages.workOrderNotFound')}</h3></div>;

  const isEditable = workOrder.status === WorkOrderStatus.Open;

  const userOptions = users.map((user) => ({
    label: (
      <div className="flex flex-col items-start">
        <span>{user.firstName} {user.lastName}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
    ),
    value: user.email,
    badgeLabel: `${user.firstName} ${user.lastName}`,
    badgeTooltip: user.email,
  }));

  return (
    <div className="space-y-4 sm:space-y-6 py-4">
      <WorkOrderHeader
        workOrder={workOrder}
        onBack={() => navigate('/work-orders')}
        onCancel={() => setShowCancelConfirm(true)}
        onComplete={() => setShowCompleteDialog(true)}
        cancelling={cancelling}
        saving={saving}
        completing={completing}
        t={t}
      />

      <div className="space-y-6">
        <WorkOrderInformation
          workOrder={workOrder}
          form={form}
          onSubmit={onSubmit}
          isEditable={isEditable}
          saving={saving}
          cancelling={cancelling}
          userOptions={userOptions}
          userMap={userMap}
          t={t}
        />

        <WorkOrderAttachments
          workOrderId={workOrderId!}
          status={workOrder.status}
          initialAttachments={workOrder.attachments ?? []}
        />

        <WorkLogSection
          workOrder={workOrder}
          onAddLog={() => setShowWorkLogDialog(true)}
          userMap={userMap}
          t={t}
        />

        <WorkLogDialog
          isOpen={showWorkLogDialog}
          onClose={() => setShowWorkLogDialog(false)}
          onSubmit={handleAddWorkLog}
        />

        <CompleteWorkOrderDialog
          isOpen={showCompleteDialog}
          onClose={() => setShowCompleteDialog(false)}
          onSubmit={handleComplete}
          hasWorkLogs={(workOrder.workLogs?.length ?? 0) > 0}
        />
      </div>

      <WorkOrderCancelDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelWorkOrder}
        reason={cancellationReason}
        setReason={setCancellationReason}
        cancelling={cancelling}
        t={t}
      />
    </div>
  );
};

export default WorkOrderDetails;
