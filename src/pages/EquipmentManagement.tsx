import EquipmentForm from '@/components/equipment/EquipmentForm';
import CompactLoader from '@/components/ui/CompactLoader';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Label } from '@/components/ui/shadcn/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { AssetsEquipmentStatus } from '@/config/enum';
import { EQUIPMENT_STATUS_CONFIG } from '@/lib/colors';
import { formatWithUserSettings } from '@/lib/dayjs-utils';
import useSiteStore from '@/store/siteStore';
import useDataStore from '@/store/dataStore';
import AssetDetails from '@/types/equipment/AssetDetails';
import SensorDetails from '@/types/equipment/SensorDetails';
import { TaskDetailsModalProps } from '@/types/maintenance/MaintenanceTask';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  Calendar,
  CookingPot,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Archive,
  RotateCcw,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CreateTaskModal from '@/components/maintenance/TaskDetailsModal';
import Can from '@/components/auth/Can';
import { MODULES } from '@/config/constant';
import { usePermission } from '@/hooks/usePermission';
import EquipmentViewModal from '@/components/equipment/EquipmentViewModal';
import equipmentService from '@/services/api/equipmentService';
import MessengerService from '@/services/ui/messengerService';
import { Switch } from '@/components/ui/shadcn/switch';
import Pagination, { SizeType } from '@/components/ui/Pagination';
import PDFPreviewer from '@/components/common/PdfViewer';
import { useAuth } from '@/components/contexts/AuthContext';
import { useAssetBroadcast } from '@/hooks/broadcasts/use-asset-broadcast';

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
};

const EquipmentManagement: React.FC = () => {
  const { refreshContext, context } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState<AssetDetails[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<AssetDetails[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEquipment, setDialogEquipment] = useState<AssetDetails | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ url: string; name: string; } | null>(null);
  const [viewEquipment, setViewEquipment] = useState<AssetDetails | null>(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState<string>('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [scheduleMaintenanceProps, setScheduleMaintenanceProps] =
    useState<TaskDetailsModalProps>({
      isOpen: false,
      onClose: () => { },
      availableAssets: [],
      availableUsers: [],
      dataLoading: false,
    });
  const { users: availableUsers, fetchAssets } = useDataStore();
  const { hasPermission } = usePermission();

  const { currentSite } = useSiteStore();

  // ─── Clear filters when site changes (synchronous, before effects run) ────
  const prevSiteId = useRef(currentSite?.id);
  if (prevSiteId.current !== currentSite?.id) {
    prevSiteId.current = currentSite?.id;
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setIncludeArchived(false);
    setSorting([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setEquipments([]);
    setFilteredEquipments([]);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // broadcast setup
  const { requestAssetRefresh, assetCreatedOrUpdated } = useAssetBroadcast(async (event) => {
    if (event.type === 'ASSET_CREATED_OR_UPDATED' || event.type === 'ASSET_REFRESHED') {
      await loadEquipments();
    }
  });

  const loadEquipments = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentSite?.id) {
        return;
      }
      const data = await equipmentService.list(
        filters.search,
        currentSite?.id,
        includeArchived
      );
      setEquipments(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      MessengerService.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [filters.search, currentSite, includeArchived]);

  const handleCreate = () => {
    setDialogOpen(true);
    setDialogEquipment(null);
  };

  const handleOnSubmit = async () => {
    setDialogOpen(false);
    setDialogEquipment(null);
    assetCreatedOrUpdated();
    await loadEquipments();
    await fetchAssets(currentSite?.id || '', hasPermission(MODULES.EQUIPMENT.TAG));
  };

  const handleEdit = (equipment: AssetDetails) => {
    setDialogOpen(true);
    setDialogEquipment(equipment);
  };

  const handleOnClose = async () => {
    setDialogOpen(false);
    setDialogEquipment(null);
  };

  const handleView = (equipment: AssetDetails) => {
    setViewEquipment(equipment);
    setViewDialogOpen(true);
  };

  const handleArchive = useCallback(
    async (equipment: AssetDetails) => {
      const isArchived = equipment.archived;

      MessengerService.confirm(
        isArchived
          ? t('equipment.confirmations.unarchive')
          : t('equipment.confirmations.archive'),
        t('common.confirmationTitle'),
        async () => {
          try {
            setIsArchiving(true);
            await equipmentService.archive(equipment.id!, !isArchived);
            MessengerService.success(
              isArchived
                ? t('equipment.messages.equipmentUnarchived')
                : t('equipment.messages.equipmentArchived')
            );
            assetCreatedOrUpdated();
            await loadEquipments();
            await fetchAssets(currentSite?.id || '', hasPermission(MODULES.EQUIPMENT.TAG));
          } catch (error: any) {
            MessengerService.error(
              `Failed to ${isArchived ? 'unarchive' : 'archive'} asset: ${error.message}`
            );
          } finally {
            setIsArchiving(false);
          }
        },
        undefined,
        isArchived ?
          t('equipment.table.equipmentUnarchive') :
          t('equipment.table.equipmentArchive')
      );
    },
    [loadEquipments, t]
  );

  const handleScheduleMaintenance = useCallback(async (info: AssetDetails) => {
    const assetDetails = {
      id: info.id,
      name: info.name,
      description: info.description,
      type: info.type,
    };

    setScheduleMaintenanceProps({
      isOpen: true,
      onClose: () => {
        setScheduleMaintenanceProps({
          ...scheduleMaintenanceProps,
          isOpen: false,
        });
      },
      dataLoading: dataLoading,
      availableAssets: [assetDetails],
      availableUsers: availableUsers,
      selectedAsset: assetDetails,
    });
  }, [availableUsers, dataLoading, scheduleMaintenanceProps]);

  const columns: ColumnDef<AssetDetails>[] = useMemo(() => {
    const preColumns: ColumnDef<AssetDetails>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('equipment.table.equipmentName')}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'model',
        header: t('equipment.table.model'),
        cell: ({ row }) => {
          const model = row.getValue('model') as string | null;
          return model || <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: 'type',
        header: t('equipment.table.equipmentType'),
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          return <div className="flex items-center gap-2">{type ?? '-'}</div>;
        },
      },
      {
        accessorKey: 'location',
        header: t('equipment.table.siteArea'),
        cell: ({ row }) => {
          const location = row.getValue('location') as string;
          return (
            <div className="flex items-center gap-2">{location ?? '-'}</div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('equipment.table.status')}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const status = row.getValue('status') as AssetsEquipmentStatus;
          return (
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium ${EQUIPMENT_STATUS_CONFIG[status]?.className}`}
            >
              {EQUIPMENT_STATUS_CONFIG[status]?.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'sensors',
        header: t('equipment.table.sensors'),
        cell: ({ row }) => {
          const sensors = row.getValue('sensors') as SensorDetails[];
          if (sensors && sensors.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {sensors.map((sensor) => (
                  <Badge key={sensor.id} variant="secondary">
                    {sensor.type}
                  </Badge>
                ))}
              </div>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: 'archived',
        header: t('equipment.table.archived'),
        cell: ({ row }) => {
          const archived = row.getValue('archived') as boolean;
          return archived ? (
            <Badge variant="destructive">{t('common.archived')}</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {t('common.active')}
            </Badge>
          );
        },
      },
    ];

    const canDelete = hasPermission(MODULES.EQUIPMENT.TAG, MODULES.EQUIPMENT.ACTIONS.DELETE);
    const canSchedule = hasPermission(MODULES.MAINTENANCE.TAG);

    if (canDelete || canSchedule) {
      preColumns.push({
        id: 'actions',
        header: t('equipment.table.actions'),
        cell: ({ row }) => {
          const equipment = row.original;
          return (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('equipment.table.actions')}</DropdownMenuLabel>
                  {canSchedule && (
                    <DropdownMenuItem
                      onClick={() => handleScheduleMaintenance(equipment)}
                      disabled={isArchiving}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('equipment.table.scheduleMaintenance')}
                    </DropdownMenuItem>
                  )}
                  {(canDelete || canSchedule) && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => handleArchive(equipment)}
                      disabled={isArchiving}
                      className={equipment.archived ? 'text-primary' : 'text-destructive focus:text-destructive'}
                    >
                      {equipment.archived ? (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      ) : (
                        <Archive className="h-4 w-4 mr-2" />
                      )}
                      {equipment.archived ? t('equipment.table.equipmentUnarchive') : t('equipment.table.equipmentArchive')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    return preColumns;
  }, [t, hasPermission, handleArchive, handleScheduleMaintenance, isArchiving]);

  const table = useReactTable({
    data: filteredEquipments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  useEffect(() => {
    if (filters.status === 'all') {
      setFilteredEquipments([...equipments]);
    } else {
      const data = equipments.filter((eq) => eq.status.toString() === filters.status);
      setFilteredEquipments(data);
    }
  }, [equipments, filters.status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((pre) => ({ ...pre, search: searchInput }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 sticky top-0 z-20 pt-4 pb-2" style={{
        backgroundImage: "var(--background-gradient)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover"
      }}>
        <div className="min-w-0">
          <h1 className="page-header truncate">{t('equipment.title')}</h1>
          <p className="page-subTitle">{t('equipment.subTitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Can tag={MODULES.EQUIPMENT.TAG} action={MODULES.EQUIPMENT.ACTIONS.WRITE}>
            <Button onClick={handleCreate} className="sm:w-auto sm:flex-none flex-1" disabled={isArchiving}>
              <Plus className="h-4 w-4 mr-2" />
              <span>{t('equipment.form.createNewEquipment')}</span>
            </Button>
          </Can>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => { requestAssetRefresh(); loadEquipments(); }}
                disabled={loading || isArchiving}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.refresh')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* List */}
      <div className='px-2'>
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap lg:items-center gap-4 lg:justify-between">
              <CardTitle className="m-0 flex items-center gap-2 shrink-0">
                <Box className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>{t('equipment.allAssets')}</span>
              </CardTitle>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:min-w-[500px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      className="pl-8 pr-8 w-full"
                      placeholder={t('common.search')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                      >
                        <X size={16} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  <Select
                    value={filters.status}
                    onValueChange={(value: string) => setFilters((pre) => ({ ...pre, status: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={'all'}>{t('common.allStatus')}</SelectItem>
                      <SelectItem value={AssetsEquipmentStatus.Operational.toString()}>{t('common.operational')}</SelectItem>
                      <SelectItem value={AssetsEquipmentStatus.Maintenance.toString()}>{t('common.maintenance')}</SelectItem>
                      <SelectItem value={AssetsEquipmentStatus.Warning.toString()}>{t('common.warning')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 shrink-0 px-1 w-full sm:w-auto">
                  <Switch
                    id="includeArchived"
                    checked={includeArchived}
                    onCheckedChange={(checked) => setIncludeArchived(!!checked)}
                  />
                  <Label htmlFor="includeArchived" className="text-sm font-medium leading-none cursor-pointer">
                    {t('common.includeArchived')}
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className='bg-card sticky top-0 z-1'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={header.id === 'actions' ? 'w-[100px] text-right' : ''}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="flex justify-center items-center py-12"><CompactLoader /></div>
                    </TableCell>
                  </TableRow>
                ) : table.getPaginationRowModel().rows?.length ? (
                  table.getPaginationRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={`cursor-pointer ${isArchiving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (isArchiving) return;
                        if (hasPermission(MODULES.EQUIPMENT.TAG, MODULES.EQUIPMENT.ACTIONS.WRITE)) {
                          handleEdit(row.original);
                        } else {
                          handleView(row.original);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24">
                      <div className="text-center py-12">
                        <CookingPot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('equipment.messages.noEquipmentAvailable')}</h3>
                        <p className="text-sm text-muted-foreground">{t('equipment.messages.noEquipmentAvailableDescription')}</p>
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
              onPageChange={(page) => { table.setPageIndex(page - 1); }}
              onSizeChange={(size) => { table.setPageSize(Number(size)); table.setPageIndex(0); }}
            />
          </CardContent>
        </Card>
      </div>

      <EquipmentForm
        equipment={dialogEquipment}
        onFormSubmit={handleOnSubmit}
        open={dialogOpen}
        onOpenChange={handleOnClose}
        setPreviewData={setPreviewData}
      />

      <EquipmentViewModal
        equipment={viewEquipment}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        setPreviewData={setPreviewData}
      />

      <CreateTaskModal {...scheduleMaintenanceProps} />

      {previewData && (
        <PDFPreviewer
          url={previewData.url}
          filename={previewData.name}
          open={!!previewData}
          onClose={() => setPreviewData(null)}
          downloadable={false}
          fetchPdf={async (url) => {
            const res = await fetch(url, { credentials: 'include' });
            if (res.status === 403) refreshContext();
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return res.blob();
          }}
        />
      )}
    </div>
  );
};

export default EquipmentManagement;