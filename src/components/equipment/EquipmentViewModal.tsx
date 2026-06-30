import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Badge } from '@/components/ui/shadcn/badge';
import {
    Info,
    Monitor,
    Radio,
    Settings,
    MapPin,
    Tag,
    Hash,
    Activity,
    Cpu,
    Layers,
    File,
} from 'lucide-react';
import AssetDetails from '@/types/equipment/AssetDetails';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import useSiteStore from '@/store/siteStore';

import DocumentTable from './DocumentTable';

interface EquipmentViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    equipment: AssetDetails | null;
    setPreviewData: (data: { url: string; name: string; }) => void;
}

const EquipmentViewModal: React.FC<EquipmentViewModalProps> = ({
    open,
    onOpenChange,
    equipment,
    setPreviewData
}) => {
    const { t } = useTranslation();
    const { userSites } = useSiteStore();

    if (!equipment) return null;

    const siteName = userSites.find((site) => site.id === equipment.siteId)?.name || 'N/A';

    const InfoItem = ({
        icon: Icon,
        label,
        value,
    }: {
        icon: any;
        label: string;
        value: string | number | boolean | undefined | null;
    }) => (
        <div className="flex items-center gap-3 py-1.5 transition-colors group">
            <div className="shrink-0 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight leading-none mb-1">
                    {label}
                </p>
                <p className="text-sm font-medium text-foreground truncate" title={String(value || '-')}>
                    {value === true ? t('common.yes') : value === false ? t('common.no') : value || '-'}
                </p>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogDescription />
                <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-primary/10 rounded-2xl shadow-inner">
                                <Monitor className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <DialogTitle className="text-lg sm:text-3xl font-black tracking-tight text-left">
                                        {equipment.name}
                                    </DialogTitle>
                                    <Badge variant="outline" className="px-3 py-1 font-bold text-xs bg-background/50">
                                        {equipment.type || 'N/A'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1.5 underline-offset-4 decoration-primary/30">
                                    <MapPin size={14} /> {siteName} • {equipment.location}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-auto">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2  gap-x-8 gap-y-10">

                            {/* Column 1: Basic Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                    <Info className="h-4 w-4 text-primary/70" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">{t('equipment.form.basicInfo')}</h3>
                                </div>
                                <div className="space-y-1">
                                    <InfoItem icon={Tag} label={t('equipment.form.type')} value={equipment.type} />
                                    <InfoItem icon={MapPin} label={t('equipment.form.siteLocation')} value={equipment.location} />
                                </div>
                                {equipment.description && (
                                    <div className="mt-4">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                            {t('equipment.form.description')}
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            {equipment.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Column 2: Equipment Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                    <Settings className="h-4 w-4 text-primary/70" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">{t('equipment.form.equipmentDetails')}</h3>
                                </div>
                                <div className="space-y-1">
                                    <InfoItem icon={Cpu} label={t('equipment.form.manufacturer')} value={equipment.manufacturer} />
                                    <InfoItem icon={Layers} label={t('equipment.form.model')} value={equipment.model} />
                                    <InfoItem icon={Hash} label={t('equipment.form.serialNumber')} value={equipment.serialNumber} />
                                    <InfoItem icon={Activity} label={t('equipment.form.vfdAvailable')} value={equipment.isVdfAvailable} />
                                    {equipment.isVdfAvailable && (
                                        <InfoItem icon={Hash} label={t('equipment.form.macId')} value={equipment.vdfMacId} />
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Sensors */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                    <Radio className="h-4 w-4 text-primary/70" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">{t('equipment.form.sensors')}</h3>
                                </div>
                                <div className="space-y-4">
                                    {equipment.sensors && equipment.sensors.length > 0 ? (
                                        equipment.sensors.map((sensor, idx) => (
                                            <div key={idx} className="flex gap-3 group">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                                                    <Radio className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 leading-none mb-1">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{sensor.type}</p>
                                                        <span className="text-[9px] text-muted-foreground/50">#{idx + 1}</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-foreground truncate">{sensor.parameter}</p>
                                                    {sensor.description && (
                                                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{sensor.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic px-2">{t('equipment.messages.noSensorsAvailable')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 4: Monitoring Parameters */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                    <Activity className="h-4 w-4 text-primary/70" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">{t('equipment.form.monitoringParameters')}</h3>
                                </div>
                                <div className="space-y-5">
                                    {equipment.monitors && equipment.monitors.length > 0 ? (
                                        equipment.monitors.map((monitor: any, idx) => (
                                            <div key={idx} className="flex gap-3 group">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                                    <Activity className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">{monitor.parameter || monitor.monitorId}</p>
                                                        <Badge
                                                            variant={monitor.priority === 'high' ? 'destructive' : monitor.priority === 'medium' ? 'default' : 'secondary'}
                                                            className="text-[8px] font-black h-3.5 px-1.5 uppercase leading-none"
                                                        >
                                                            {monitor.priority || 'Medium'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                                        <span className="text-muted-foreground capitalize text-[11px] font-medium">{monitor.condition || 'Threshold'}</span>
                                                        {monitor.value || monitor.min_value || '0'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic px-2">No monitoring params active</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 5: Documents */}
                            <div className="space-y-4 md:col-span-2">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                    <File className="h-4 w-4 text-primary/70" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">{t('equipment.form.documents')}</h3>
                                </div>
                                <div className="space-y-5">
                                    <DocumentTable bgColor='bg-transparent' equipment={equipment} setPreviewData={setPreviewData} emptyState={<p className="text-xs text-muted-foreground italic px-2">No documents found</p>} />
                                </div>
                            </div>
                        </div>


                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default EquipmentViewModal;
