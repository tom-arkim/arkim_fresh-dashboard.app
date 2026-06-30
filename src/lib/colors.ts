import { AssetsEquipmentStatus, WorkLogOutcome, WorkOrderStatus } from '@/config/enum';
import { cn } from '@/lib/utils';
import i18n from '@/i18n/i18n';

const t = i18n.t;

export const COLORS = [
  'blue',
  'emerald',
  'purple',
  'amber',
  'rose',
  'cyan',
  'orange',
  'indigo',
  'lime',
  'pink',
  'slate',
  // 'red',
  'green',
  'violet',
  'yellow',
] as const;

// Event Variants
export const dayEventVariants = {
  blue: 'bg-blue-500 text-white border-blue-600',
  emerald: 'bg-emerald-200 text-emerald-900 border-emerald-400',
  purple: 'bg-purple-600 text-white border-purple-700',
  amber: 'bg-amber-300 text-amber-900 border-amber-500',
  rose: 'bg-rose-500 text-white border-rose-600',
  cyan: 'bg-cyan-200 text-cyan-900 border-cyan-400',
  orange: 'bg-orange-600 text-white border-orange-700',
  indigo: 'bg-indigo-500 text-white border-indigo-600',
  lime: 'bg-lime-300 text-lime-900 border-lime-500',
  pink: 'bg-pink-600 text-white border-pink-700',
  slate: 'bg-slate-400 text-white border-slate-500',
  // red: 'bg-red-500 text-white border-red-600',
  green: 'bg-green-600 text-white border-green-700',
  violet: 'bg-violet-400 text-white border-violet-500',
  yellow: 'bg-yellow-400 text-yellow-900 border-yellow-600',
};

export const borderColors: Record<string, string> = {
  blue: 'border-blue-500',
  emerald: 'border-emerald-500',
  purple: 'border-purple-500',
  amber: 'border-amber-500',
  rose: 'border-rose-500',
  cyan: 'border-cyan-500',
  orange: 'border-orange-500',
  indigo: 'border-indigo-500',
  lime: 'border-lime-500',
  pink: 'border-pink-500',
  slate: 'border-slate-500',
  // red: 'border-red-500',
  green: 'border-green-500',
  violet: 'border-violet-500',
  yellow: 'border-yellow-500',
};

export const EQUIPMENT_STATUS_CONFIG: Record<
  AssetsEquipmentStatus,
  { label: string; className: string }
> = {
  [AssetsEquipmentStatus.Operational]: {
    label: 'Operational',
    className: 'bg-green-100 text-green-800',
  },
  [AssetsEquipmentStatus.Warning]: {
    label: 'Warning',
    className: 'bg-yellow-100 text-yellow-800',
  },
  [AssetsEquipmentStatus.Maintenance]: {
    label: 'Maintenance',
    className: 'bg-blue-100 text-blue-800',
  },
};

export const getWorkOrderCardBorderColor = (status: WorkOrderStatus | undefined, isWorkOrder: boolean, isCompact: boolean = false) => {
  let base = '!border-0';

  if (isCompact) {
    base += ' !border-1';
  } else {
    base += ' !border-l-4';
  }

  if (!isWorkOrder) {
    return cn(base, '!border-dashed !border-tab');
  }

  switch (status) {
    case WorkOrderStatus.Open:
      return cn(base, '!border-solid !border-st-open');
    case WorkOrderStatus.ThreadOpened:
      return cn(base, '!border-solid !border-st-progress');
    case WorkOrderStatus.Completed:
      return cn(base, '!border-solid !border-st-done');
    case WorkOrderStatus.Cancelled:
      return cn(base, '!border-solid !border-st-cancel');
    default:
      return cn(base, '!border-solid !border-gray-500');
  }
}

export const getWorkOrderStatusVariant = (
  status: string
): 'info' | 'warning' | 'success' | 'error' | 'neutral' | 'outline' => {
  switch (status) {
    case WorkOrderStatus.Open:
      return 'warning';   // amber
    case WorkOrderStatus.ThreadOpened:
      return 'info';      // blue
    case WorkOrderStatus.Completed:
      return 'success';   // green
    case WorkOrderStatus.Cancelled:
      return 'neutral';   // grey
    default:
      return 'outline';
  }
};

export const getWorkOrderStatusLabel =
  (status: WorkOrderStatus): string => {
    if (!status) {
      return '';
    }
    switch (status) {
      case WorkOrderStatus.Open:
        return t('workOrders.status.open');
      case WorkOrderStatus.ThreadOpened:
        return t('workOrders.status.threadOpened');
      case WorkOrderStatus.Completed:
        return t('workOrders.status.completed');
      case WorkOrderStatus.Cancelled:
        return t('workOrders.status.cancelled');
      default:
        return status;
    }
  };


export const getWorkOrderOutcomeLabel = (outcome: WorkLogOutcome): string => {
  switch (outcome) {
    case WorkLogOutcome.Fixed:
      return t('workOrders.workLog.outcomes.fixed');
    case WorkLogOutcome.NotFixed:
      return t('workOrders.workLog.outcomes.notFixed');
    case WorkLogOutcome.PartiallyFixed:
      return t('workOrders.workLog.outcomes.partiallyFixed');
    default:
      return outcome;
  }
};