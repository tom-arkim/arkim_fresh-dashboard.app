import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Trash2,
  RefreshCw,
  Webhook as WebhookIcon,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Edit,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Switch } from '@/components/ui/shadcn/switch';
import { Checkbox } from '@/components/ui/shadcn/checkbox';

import Messenger from '../../services/ui/messengerService';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import CompactLoader from '@/components/ui/CompactLoader';
import { logger } from '@/lib/logger';
import MessengerService from '../../services/ui/messengerService';
import webhookService from '@/services/api/webhookService';
import { EntityType, Webhook, WebhookFormValues } from '@/types/maintenance/Webhook';
import Pagination, { SizeType } from '@/components/ui/Pagination';
import { useWebHooksBroadcast } from '@/hooks/broadcasts/use-webhooks-broadcast';

const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'asset', label: 'Asset' },
  { value: 'work_order', label: 'Work Order' },
];

const WebhookManagement: React.FC = () => {
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  const { requestWebHooksRefresh } = useWebHooksBroadcast((event) => {
    if (event.type === 'WEBHOOKS_REFRESHED') {
      loadWebhooks();
    }
  });

  // Form setup
  const form = useForm<WebhookFormValues>({
    defaultValues: {
      title: '',
      url: '',
      isActive: true,
      entityTypes: [],
    },
  });

  // Load webhooks
  const loadWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await webhookService.list();
      setWebhooks(data);
    } catch (err) {
      logger.error('Error loading webhooks:', err);
      setError(t('webhooks.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initial load
  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  // Handle opening the create dialog
  const handleOpenCreateDialog = () => {
    setEditingWebhook(null);
    form.reset({
      title: '',
      url: '',
      isActive: true,
      entityTypes: [],
    });
    setOpenDialog(true);
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    form.reset({
      title: webhook.title,
      url: webhook.url,
      isActive: webhook.isActive,
      entityTypes: webhook.entityTypes,
    });
    setOpenDialog(true);
  };

  // Handle closing the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingWebhook(null);
    form.reset();
  };

  // Handle form submission
  const handleSubmit = async (values: WebhookFormValues) => {
    try {
      setIsSaving(true);

      if (editingWebhook) {
        // Update existing webhook
        await webhookService.update(editingWebhook.id, values);
        Messenger.success(t('webhooks.updateSuccess'));
      } else {
        // Create new webhook
        await webhookService.create(values);
        Messenger.success(t('webhooks.createSuccess'));
      }

      setOpenDialog(false);
      form.reset();
      requestWebHooksRefresh();
      await loadWebhooks();
    } catch (err) {
      logger.error('Error saving webhook:', err);
      Messenger.error(
        editingWebhook
          ? t('webhooks.updateError')
          : t('webhooks.createError')
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggling webhook active status
  const handleToggleActive = useCallback(
    async (webhook: Webhook) => {
      try {
        const updatedData: WebhookFormValues = {
          title: webhook.title,
          url: webhook.url,
          isActive: !webhook.isActive,
          entityTypes: webhook.entityTypes,
        };
        await webhookService.update(webhook.id, updatedData);
        Messenger.success(t('webhooks.statusToggled'));
        requestWebHooksRefresh();
        await loadWebhooks();
      } catch (err) {
        logger.error('Error toggling webhook status:', err);
        Messenger.error(t('webhooks.statusToggleError'));
      }
    },
    [loadWebhooks, t]
  );

  // Handle deleting a webhook
  const handleDelete = useCallback(
    (webhook: Webhook) => {
      MessengerService.confirmDelete({
        itemName: webhook.title,
        itemType: 'Webhook',
        onDelete: async () => {
          await webhookService.delete(webhook.id);
        },
        onSuccess: async () => {
          requestWebHooksRefresh();
          await loadWebhooks();
        },
        onError: (error) => {
          logger.error('Error deleting webhook:', error);
          MessengerService.error(t('webhooks.deleteError'));
        },
        undoTimeout: 5000,
      });
    },
    [loadWebhooks, t]
  );

  // Truncate URL for display
  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const columns: ColumnDef<Webhook>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('webhooks.title'),
        cell: ({ row }) => (
          <div className="max-w-[250px] truncate font-medium">
            {row.original.title}
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'url',
        header: t('webhooks.url'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm text-muted-foreground max-w-[300px] truncate">
              {truncateUrl(row.original.url)}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); window.open(row.original.url, '_blank'); }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('webhooks.openUrl')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 350,
      },
      {
        accessorKey: 'status',
        header: t('webhooks.status'),
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'default' : 'secondary'}
            className="font-medium"
          >
            {row.original.isActive
              ? t('webhooks.active')
              : t('webhooks.inactive')}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: 'entityTypes',
        header: t('webhooks.entityTypes'),
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {row.original.entityTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type === 'work_order' ? 'Work Order' : 'Asset'}
              </Badge>
            ))}
          </div>
        ),
        size: 200,
      },
      {
        id: 'actions',
        header: t('common.actions'),
        cell: ({ row }) => (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleToggleActive(row.original); }}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    {row.original.isActive
                      ? t('webhooks.deactivate')
                      : t('webhooks.activate')}
                  </span>
                  <Switch checked={row.original.isActive} className="ml-2" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(row.original); }}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('webhooks.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('webhooks.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 100,
      },
    ],
    [t, handleOpenEditDialog, handleToggleActive, handleDelete]
  );

  const table = useReactTable({
    data: webhooks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="page-header">{t('webhooks.title')}</h1>
              <p className="page-subTitle">
                {t(
                  'webhooks.subTitle',
                  'Manage webhook endpoints for third-party integrations'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog open={openDialog} onOpenChange={(open) => {
              if (!open && isSaving) {
                return; // Blocks close attempt during save
              }
              setOpenDialog(open);
              // Cleanup when actually closing
              if (!open) {
                setEditingWebhook(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('webhooks.addWebhook')}
                </Button>
              </DialogTrigger>
              <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => {
                if (isSaving) {
                  e.preventDefault(); // Prevents closing when clicking outside
                }
              }} onEscapeKeyDown={(e) => {
                if (isSaving) {
                  e.preventDefault(); // Prevents closing with Escape key
                }
              }}>
                <DialogHeader>
                  <DialogTitle>
                    {editingWebhook
                      ? t('webhooks.editWebhook')
                      : t('webhooks.addWebhook')}
                  </DialogTitle>
                  <DialogDescription>
                    {t(
                      'webhooks.dialogDescription',
                      'Configure a webhook endpoint to receive notifications for asset and work order changes.'
                    )}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      rules={{ required: t('webhooks.titleRequired') }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('webhooks.title')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'webhooks.titlePlaceholder',
                                'e.g., Production CMMS Integration'
                              )}
                              {...field}
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="url"
                      rules={{
                        required: t('webhooks.urlRequired'),
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: t(
                            'webhooks.urlInvalid',
                            'Please enter a valid URL starting with http:// or https://'
                          ),
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('webhooks.url')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'webhooks.urlPlaceholder',
                                'https://api.example.com/webhook'
                              )}
                              {...field}
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entityTypes"
                      rules={{
                        validate: (value) =>
                          value.length > 0 ||
                          t(
                            'webhooks.entityTypesRequired',
                            'Select at least one entity type'
                          ),
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('webhooks.entityTypes')}
                          </FormLabel>
                          <FormDescription>
                            {t(
                              'webhooks.entityTypesDescription',
                              'Select which entity types should trigger this webhook'
                            )}
                          </FormDescription>
                          <div className="space-y-2">
                            {ENTITY_TYPE_OPTIONS.map((option) => (
                              <div
                                key={option.value}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`entity-${option.value}`}
                                  checked={field.value.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...field.value, option.value]
                                      : field.value.filter(
                                        (v) => v !== option.value
                                      );
                                    field.onChange(newValue);
                                  }}
                                  disabled={isSaving}
                                />
                                <label
                                  htmlFor={`entity-${option.value}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('webhooks.active')}
                            </FormLabel>
                            <FormDescription>
                              {t(
                                'webhooks.activeDescription',
                                'Enable this webhook to receive notifications'
                              )}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSaving}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        disabled={isSaving}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {isSaving
                          ? t('common.saving')
                          : editingWebhook
                            ? t('common.update')
                            : t('common.create')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    requestWebHooksRefresh();
                    loadWebhooks();
                  }}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('webhooks.refresh')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Webhooks Table Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WebhookIcon className="h-6 w-6" />
              {t('webhooks.title')} ({webhooks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Table>
                <TableHeader className="bg-card sticky top-0 z-1">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            header.column.id === 'actions' && 'text-center'
                          )}
                          style={{ width: `${header.getSize()}px` }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <div className="flex justify-center items-center">
                          <CompactLoader />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className="cursor-pointer h-12"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} onClick={() => handleOpenEditDialog(row.original)}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24">
                        <div className="text-center py-12 space-y-2">
                          <WebhookIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            {t('webhooks.noWebhooks')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              'webhooks.noWebhooksDescription'
                            )}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                isDataLoading={loading}
                className='mt-5'
                totalPages={table.getPageCount()}
                page={table.getState().pagination.pageIndex + 1}
                size={String(table.getState().pagination.pageSize) as SizeType}
                onPageChange={(page) => {
                  table.setPageIndex(page - 1);
                }}
                onSizeChange={(size) => {
                  table.setPageSize(Number(size));
                  table.setPageIndex(0);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default WebhookManagement;