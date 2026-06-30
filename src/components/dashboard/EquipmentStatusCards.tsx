import { Badge } from '@/components/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/shadcn/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { AssetsEquipmentStatus } from '@/config/enum';
import { formatWithUserSettings } from '@/lib/dayjs-utils';
import { isApiError } from '@/lib/utils';
import useSiteStore from '@/store/siteStore';
import { EquipmentStatusOverview } from '@/types/dashboard/dashboard';
import { AssetEquipmentState } from '@/types/equipment/AssetStatus';
import { Square } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, Legend } from 'recharts';

function EquipmentDialog({
  isOpen,
  setIsOpen,
  items,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  items: AssetEquipmentState[];
}) {
  const { t } = useTranslation();
  if (!items || items.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('dashboard.equipmentStatus.equipmentDetails.title')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.equipmentStatus.equipmentDetails.noEquipment')}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t('dashboard.equipmentStatus.equipmentDetails.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.equipmentStatus.equipmentDetails.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader className='bg-card sticky top-0 z-1'>
              <TableRow>
                <TableHead>
                  {t('dashboard.equipmentStatus.equipmentDetails.name')}
                </TableHead>
                <TableHead>
                  {t('dashboard.equipmentStatus.equipmentDetails.type')}
                </TableHead>
                <TableHead>
                  {t('dashboard.equipmentStatus.equipmentDetails.model')}
                </TableHead>
                <TableHead>
                  {t(
                    'dashboard.equipmentStatus.equipmentDetails.lastMaintenance'
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    'dashboard.equipmentStatus.equipmentDetails.nextMaintenance'
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(({ asset, lastMaintenance, nextMaintenance }) => {
                const lastMaintenanceDate = lastMaintenance
                  ? formatWithUserSettings(lastMaintenance)
                  : '-';
                const nextMaintenanceDate = nextMaintenance
                  ? formatWithUserSettings(nextMaintenance)
                  : '-';
                return (
                  <TableRow key={asset.id} className="hover:bg-muted/50">
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell>{asset.model ?? '-'}</TableCell>
                    <TableCell>{lastMaintenanceDate}</TableCell>
                    <TableCell>{nextMaintenanceDate}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  refetch: number;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
};

function EquipmentStatusCards({ refetch, setRefreshing }: Props) {
  const { t } = useTranslation();
  const [equipmentSummary, setEquipmentSummary] =
    useState<EquipmentStatusOverview | null>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loader, setLoader] = useState(false);
  const { currentSite } = useSiteStore();

  const STATUS_CONFIG: Record<
    AssetsEquipmentStatus,
    { label: string; color: string; description: string }
  > = useMemo(() => {
    return {
      [AssetsEquipmentStatus.Operational]: {
        label: t('equipment.status.operational'),
        description: t('equipment.statusDescription.operational'),
        color: '#16a34a',
      },
      [AssetsEquipmentStatus.Warning]: {
        label: t('equipment.status.warning'),
        color: '#f59e0b',
        description: t('equipment.statusDescription.warning'),
      },
      [AssetsEquipmentStatus.Maintenance]: {
        label: t('equipment.status.maintenance'),
        color: '#6b7280',
        description: t('equipment.statusDescription.maintenance'),
      },
    };
  }, [t]);

  const [selectedStatus, setSelectedStatus] = useState<
    keyof typeof STATUS_CONFIG | null
  >(null);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const getEquipmentStatusSummary = useCallback(async () => {
    try {
      setRefreshing(true);
      setLoader(true);
      if (!currentSite) return;
      // const response = await dashboardService.getEuipmentStatus(
      //   currentSite?.id!
      // );
      // setEquipmentSummary(response);
    } catch (error: any) {
      if (isApiError(error)) {
        setError(
          error.message ?? 'Failed to load equipment status. Please try again.'
        );
      }
    } finally {
      setLoader(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite, setRefreshing, refetch]);

  const { data, assetsData } = useMemo(() => {
    if (!equipmentSummary?.assets)
      return {
        data: [],
        assetsData: {
          [AssetsEquipmentStatus.Operational]: [],
          [AssetsEquipmentStatus.Warning]: [],
          [AssetsEquipmentStatus.Maintenance]: [],
        },
      };

    const counts: Record<AssetsEquipmentStatus, number> = {
      [AssetsEquipmentStatus.Operational]: 0,
      [AssetsEquipmentStatus.Warning]: 0,
      [AssetsEquipmentStatus.Maintenance]: 0,
    };
    const assetsByStatus: Record<AssetsEquipmentStatus, AssetEquipmentState[]> = {
      [AssetsEquipmentStatus.Operational]: [],
      [AssetsEquipmentStatus.Warning]: [],
      [AssetsEquipmentStatus.Maintenance]: [],
    };

    // Loop through assets
    equipmentSummary.assets.forEach((item) => {
      const status = item.status as AssetsEquipmentStatus;
      if (STATUS_CONFIG[status]) {
        counts[status] += 1;
        assetsByStatus[status].push(item);
      }
    });

    // Prepare chart data
    const chartData = Object.entries(STATUS_CONFIG).map(
      ([key, { label, color, description }]) => {
        const id = Number(key) as AssetsEquipmentStatus;
        return {
          id: id,
          name: label,
          description: description,
          value: counts[id] ?? 0,
          color,
        };
      }
    );

    return {
      data: chartData,
      assetsData: assetsByStatus,
    };
  }, [STATUS_CONFIG, equipmentSummary]);

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-4 mt-2 flex-wrap">
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    getEquipmentStatusSummary();
  }, [getEquipmentStatusSummary]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.equipmentStatus.title')}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loader) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.equipmentStatus.title')}</CardTitle>
          <CardDescription>
            <div className="flex justify-center items-center p-6">
              {/* Circle skeleton mimicking pie chart */}
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {/* Legend skeletons */}
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!equipmentSummary) return <Card>
    <CardHeader>
      <CardTitle>{t('dashboard.equipmentStatus.title')}</CardTitle>
      <CardDescription>
        {t('common.noData')}
      </CardDescription>
    </CardHeader>
  </Card>;
  const totalAssets = equipmentSummary.assets?.length ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.equipmentStatus.title')}</CardTitle>
        <CardDescription>
          {t('dashboard.equipmentStatus.description', {
            count: totalAssets,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={STATUS_CONFIG}
          className="h-[320px] w-full flex flex-col items-center justify-center z-10"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              label
              onClick={(item: any) => {
                setSelectedStatus(item?.id);
                setDialogOpen(true);
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    transform:
                      hoverIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: '50% 50%',
                    transition: 'transform 0.2s ease',
                  }}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number, name: string, item: any) => {
                return (
                  <span className="text-sm text-muted-foreground flex gap-2 items-center">
                    <Square
                      color={item?.payload?.color}
                      size={15}
                      fill={item?.payload?.fill}
                      stroke={item?.payload?.stroke}
                    />
                    {name}: {value}
                  </span>
                );
              }}
            />
            <Legend content={renderLegend} />
          </PieChart>
        </ChartContainer>
        <CardFooter className="mt-4">
          <div className="flex flex-wrap gap-4 w-full">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex flex-col border border-muted justify-between p-2 bg-accent rounded-md transition-colors duration-150 hover:bg-accent/70 gap-2 hover:cursor-pointer w-full"
                onClick={() => {
                  setSelectedStatus(item.id);
                  setDialogOpen(true);
                }}
              >
                {/* Header row with badge and percentage */}
                <div className="flex items-center justify-between">
                  <Badge
                    style={{
                      backgroundColor: item.color,
                    }}
                    className="text-white"
                  >
                    <span>{item.name}</span>
                    <span className="text-sm">
                      {item.value} (
                      {totalAssets > 0
                        ? Math.round(((item.value ?? 0) / totalAssets) * 100)
                        : 0}
                      %)
                    </span>
                  </Badge>
                  {/* Description below */}
                  <p className="text-sm text-muted-foreground italic">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardFooter>
      </CardContent>

      <EquipmentDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        items={
          selectedStatus !== null ? assetsData[selectedStatus] : []
        }
      />
    </Card>
  );
}

export default EquipmentStatusCards;
