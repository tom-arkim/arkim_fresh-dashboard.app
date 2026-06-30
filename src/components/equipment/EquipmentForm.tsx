import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/shadcn/dialog';
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
import {
  MetricParameter,
  AlarmType,
  SensorType,
} from '@/config/enum';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import {
  Save,
  Trash2,
  Plus,
  Info,
  Monitor,
  Settings,
  Loader2,
  Radio,
  AlertCircle,
  Bell,
  Archive,
  RotateCcw,
  File,
  FileStack,
} from 'lucide-react';
import AssetDetails from '@/types/equipment/AssetDetails';
import equipmentService from '@/services/api/equipmentService';
import {
  createEquipmentSchema,
  EquipmentFormData,
} from '@/schemas/equipment.schema';
import CompactLoader from '@/components/ui/CompactLoader';
import { cn } from '@/lib/utils';
import MessengerService from '@/services/ui/messengerService';
import useSiteStore from '@/store/siteStore';
import DocumentTable from './DocumentTable';


interface EquipmentFormProps {
  open: boolean;
  onOpenChange: () => void;
  equipment: Partial<AssetDetails> | null;
  onFormSubmit: () => void;
  setPreviewData: (data: { url: string; name: string; }) => void;
}

// Define the options for the new dropdowns
const metricParameterOptions = [
  { value: MetricParameter.Temperature, label: 'Temperature' },
  { value: MetricParameter.Vibration, label: 'Vibration' },
  { value: MetricParameter.Current, label: 'Current' },
  { value: MetricParameter.SurfaceTemperature, label: 'Surface Temperature' },
];

const alarmTypeOptions = [
  { value: AlarmType.TrendBehavior, label: 'Trend Behavior' },
  { value: AlarmType.Thresholds, label: 'Thresholds' },
  { value: AlarmType.SignalDrop, label: 'Signal Drop/Unresponsive' },
  { value: AlarmType.Noise, label: 'Noise' },
  { value: AlarmType.FaultCode, label: 'Fault Code' },
];

const sensorTypeOptions = [
  { value: SensorType.Tasmota, label: 'Tasmota' },
  { value: SensorType.Ruuvi, label: 'Ruuvi' },
  { value: SensorType.PLC, label: 'plc' },
];

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  open,
  onOpenChange,
  equipment,
  onFormSubmit,
  setPreviewData,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getUseMetricSystem, userSites } = useSiteStore();
  const userMetricSystem = getUseMetricSystem();

  const id = equipment?.id;
  const isNew = !id;

  // Main equipment form
  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      id: '',
      name: '',
      description: '',
      type: '',
      siteId: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      sensors: [],
      location: '',
      // New monitoring parameters array
      monitors: [],
      isVdfAvailable: false,
      vdfMacId: '',
    },
    mode: 'onChange',
  });

  const {
    formState: { errors },
  } = form;

  const {
    fields: sensorFields,
    append: appendSensor,
    remove: removeSensor,
  } = useFieldArray({
    control: form.control,
    name: 'sensors',
    keyName: 'sensorId',
  });

  const {
    fields: monitoringFields,
    append: appendMonitoring,
    remove: removeMonitoring,
  } = useFieldArray({
    control: form.control,
    name: 'monitors',
    keyName: 'monitorId',
  });

  // Load equipment data from API
  const loadEquipmentData = async (equipmentId: string) => {
    setIsLoading(true);
    try {
      const data = await equipmentService.getById(equipmentId);
      form.reset({
        id: data.id,
        name: data.name,
        description: data.description || '',
        type: data.type || '',
        siteId: data.siteId,
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        sensors: data.sensors
          ? data.sensors.map((e) => {
            return {
              id: e.id,
              description: e.description || '',
              type: e.type || '',
              parameter: e.parameter || '',
            };
          })
          : [],
        location: data.location || '',
        vdfMacId: data.vdfMacId || '',
        isVdfAvailable: data.isVdfAvailable || false,
        monitors:
          data.monitors && data.monitors.length > 0 ? data.monitors : [],
      });
    } catch (err: any) {
      setError(`Failed to load equipment details: ${err.message}`);
      MessengerService.error(
        `Failed to load equipment details: ${err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load equipment data when id changes
  useEffect(() => {
    if (id) {
      loadEquipmentData(id);
    } else {
      // Reset form for new equipment
      form.reset({
        id: '',
        name: '',
        description: '',
        type: '',
        siteId: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        sensors: [],
        location: '',
        vdfMacId: '',
        isVdfAvailable: false,
        monitors: [],
      });
    }
    setError(null);
    setActiveTab('basic');
  }, [id, form]);

  // Add new sensor to the list
  const handleAddSensor = () => {
    appendSensor({
      id: '',
      description: '',
      type: '',
      parameter: '',
    });
  };

  // Remove a sensor from the list
  const handleRemoveSensor = (index: number) => {
    MessengerService.confirm(
      t('equipment.confirmations.removeSensor'),
      t('common.confirmationTitle'),
      () => {
        removeSensor(index);
        form.trigger('sensors');
      },
      undefined,
      t('common.remove')
    );
  };

  // Add new monitoring parameter to the list
  const handleAddMonitoring = () => {
    appendMonitoring({
      id: Math.random().toString(36).substring(2, 9),
      parameter: '',
      alarmType: '',
      condition: '',
      value: 0,
      priority: 'medium',
    });
  };

  // Remove a monitoring parameter from the list
  const handleRemoveMonitoring = (index: number) => {
    MessengerService.confirm(
      t('equipment.confirmations.removeMonitoringParameter'),
      t('common.confirmationTitle'),
      () => {
        removeMonitoring(index);
        form.trigger('monitors');
      },
      undefined,
      t('common.remove')
    );
  };

  // Handle form submission
  const onSubmit = async (data: EquipmentFormData) => {
    setError(null);

    MessengerService.confirm(
      isNew
        ? t('equipment.confirmations.create')
        : t('equipment.confirmations.update'),
      t('common.confirmationTitle'),
      async () => {
        try {
          setIsSubmitting(true);
          if (isNew) {
            await equipmentService.create(data);
            MessengerService.success(
              t('equipment.messages.equipmentCreated')
            );
            onFormSubmit();
          } else if (id) {
            await equipmentService.update(data);
            MessengerService.success(
              t('equipment.messages.equipmentUpdated')
            );
            onFormSubmit();
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const currentTabErrors = {
    basic: !!(
      errors.name ||
      errors.type ||
      errors.siteId ||
      errors.location ||
      errors.description
    ),
    device: !!(
      errors.manufacturer ||
      errors.model ||
      errors.serialNumber ||
      errors.isVdfAvailable ||
      errors.vdfMacId
    ),
    sensors: !!errors.sensors,
    specs: !!errors.monitors,
  };

  const onError = (errors: Record<string, any>) => {
    const hasBasicErrors = !!(
      errors.name ||
      errors.type ||
      errors.siteId ||
      errors.location ||
      errors.description
    );
    const hasDeviceErrors = !!(
      errors.manufacturer ||
      errors.model ||
      errors.serialNumber ||
      errors.isVdfAvailable ||
      errors.vdfMacId
    );
    const hasSensorErrors = !!errors.sensors;
    const hasSpecErrors = !!errors.monitors;

    if (hasBasicErrors) setActiveTab('basic');
    else if (hasDeviceErrors) setActiveTab('device');
    else if (hasSensorErrors) setActiveTab('sensors');
    else if (hasSpecErrors) setActiveTab('specs');

    return false;
  };

  // Handle equipment archiving
  const handleArchive = () => {
    if (!id) return;
    const isArchived = equipment?.archived;

    MessengerService.confirm(
      isArchived
        ? t('equipment.confirmations.unarchive')
        : t('equipment.confirmations.archive'),
      t('common.confirmationTitle'),
      async () => {
        try {
          setIsSubmitting(true);
          await equipmentService.archive(id, !isArchived);
          MessengerService.success(
            isArchived
              ? t('equipment.messages.equipmentUnarchived')
              : t('equipment.messages.equipmentArchived')
          );
          onFormSubmit();
        } catch (err: any) {
          setError(err.message);
          MessengerService.error(
            `Failed to ${isArchived ? 'unarchive' : 'archive'} equipment: ${err.message
            }`
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      undefined,
      isArchived ?
        t('equipment.table.equipmentUnarchive') :
        t('equipment.table.equipmentArchive')
    );
  };

  // label fetching removed; labels are now free-text

  // Helper function to get dynamic field labels based on parameter type
  const getParameterFieldLabels = useCallback(
    (parameterType: string, t: any) => {
      switch (parameterType) {
        case MetricParameter.Temperature:
          return {
            minLabel: t('equipment.form.minTemperature'),
            maxLabel: t('equipment.form.maxTemperature'),
            unit: userMetricSystem ? '°C' : '°F',
            minPlaceholder: '0',
            maxPlaceholder: '100',
          };
        case MetricParameter.Vibration:
          return {
            minLabel: t('equipment.form.minVibration'),
            maxLabel: t('equipment.form.maxVibration'),
            unit: t('equipment.form.gForce'),
            minPlaceholder: '0.8',
            maxPlaceholder: '1.1',
          };
        case MetricParameter.Current:
          return {
            minLabel: t('equipment.form.minCurrent'),
            maxLabel: t('equipment.form.maxCurrent'),
            unit: t('equipment.form.ampsPercent'),
            minPlaceholder: '0',
            maxPlaceholder: '100',
          };
        case MetricParameter.SurfaceTemperature:
          return {
            minLabel: t('equipment.form.minSurfaceTemperature'),
            maxLabel: t('equipment.form.maxSurfaceTemperature'),
            unit: userMetricSystem ? '°C' : '°F',
            minPlaceholder: '0',
            maxPlaceholder: '100',
          };
        default:
          return {
            minLabel: t('equipment.form.minOperatingRange'),
            maxLabel: t('equipment.form.maxOperatingRange'),
            unit: '',
            minPlaceholder: '0',
            maxPlaceholder: '100',
          };
      }
    },
    [userMetricSystem]
  );

  // no label fetch effect needed

  useEffect(() => {
    return () => {
      form.reset();
      setActiveTab('basic');
    };
  }, [open]);

  // Tab render functions using closures
  const renderBasicInfoTab = () => {
    return (
      <TabsContent
        value="basic"
        className="m-0 data-[state=active]:flex data-[state=active]:flex-col h-[420px]"
      >
        <Card className="shadow-sm flex-1 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('equipment.form.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.equipmentName')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.equipmentName')}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.type')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.type')}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.site')} *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('equipment.form.site')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userSites?.map((site) => (
                          <SelectItem key={site.id} value={site.id!}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.siteArea')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.siteArea')}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('equipment.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('equipment.form.description')}
                      disabled={isSubmitting}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  const renderDeviceDetailsTab = () => {
    return (
      <TabsContent
        value="device"
        className="m-0 data-[state=active]:flex data-[state=active]:flex-col h-[420px]"
      >
        <Card className="shadow-sm flex-1 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {t('equipment.form.equipmentDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.manufacturer')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.manufacturer')}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.model')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.model')}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.serialNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.serialNumber')}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVdfAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.vfdAvailable')} *</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={(value) => {
                          field.onChange(value === 'true');
                          form.clearErrors('vdfMacId');
                          if (value === 'false') {
                            form.setValue('vdfMacId', '');
                          }
                        }}
                        value={field.value ? 'true' : 'false'}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            {t('common.yes')}
                          </SelectItem>
                          <SelectItem value="false">
                            {t('common.no')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 items-start">
              <FormField
                control={form.control}
                name="vdfMacId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('equipment.form.macId')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('equipment.form.macId')}
                        disabled={
                          isSubmitting || form.watch('isVdfAvailable') === false
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  const renderSensorsTab = () => {
    return (
      <TabsContent
        value="sensors"
        className="m-0 data-[state=active]:flex data-[state=active]:flex-col h-[420px]"
      >
        <div className="space-y-4 h-full flex flex-col">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('equipment.form.saveReminder')}
            </AlertDescription>
          </Alert>

          {/* Add New Sensor */}
          <Card className="shadow-sm flex-1 flex flex-col min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                {t('equipment.form.sensors')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-auto">
              {sensorFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="text-center space-y-4">
                    <div className="rounded-full bg-muted p-4 w-16 h-16 flex items-center justify-center mx-auto">
                      <Radio className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {t('equipment.form.noSensors')}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('equipment.form.addSensorDescription')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddSensor}
                      className="mt-2"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('equipment.form.addFirstSensor')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {sensorFields.map((sensor, index) => (
                    <Card
                      key={sensor.id || index}
                      className="border p-4 shadow-sm gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">
                          {t('equipment.form.sensor', { number: index + 1 })}
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSensor(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`sensors.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                {t('equipment.form.sensorType')} *
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select sensor type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sensorTypeOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="min-h-5">
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sensors.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                {t('equipment.form.sensorDescription')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    'equipment.form.sensorDescription'
                                  )}
                                  disabled={isSubmitting}
                                  {...field}
                                />
                              </FormControl>
                              <div className="min-h-5">
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sensors.${index}.parameter`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                {t('equipment.form.metricParameter')} *
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue
                                      placeholder={t(
                                        'equipment.form.selectParameter'
                                      )}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {metricParameterOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="min-h-5">
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sensors.${index}.id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                {t('equipment.form.sensorId')} *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t('equipment.form.sensorId')}
                                  disabled={isSubmitting}
                                  {...field}
                                />
                              </FormControl>
                              <div className="min-h-5">
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}

                  <p className={cn('text-destructive text-sm')}>
                    {errors.sensors?.root?.message}
                  </p>
                  <Button
                    type="button"
                    className="w-full mt-2"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleAddSensor}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('equipment.form.addSensor')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    );
  };

  const renderSpecificationsTab = () => {
    return (
      <TabsContent
        value="specs"
        className="m-0 data-[state=active]:flex data-[state=active]:flex-col h-[420px]"
      >
        <Card className="shadow-sm flex-1 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('equipment.form.specification')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-auto">
            {monitoringFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="text-center space-y-4">
                  <div className="rounded-full bg-muted p-4 w-16 h-16 flex items-center justify-center mx-auto">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {t('equipment.form.noMonitoringParameters')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('equipment.form.addMonitoringParameterDescription')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddMonitoring}
                    className="mt-2"
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:block">
                      {t('equipment.form.addFirstMonitoringParameter')}
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {monitoringFields.map((monitoringField, index) => (
                  <Card
                    key={monitoringField.id}
                    className="border p-4 shadow-sm gap-0"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">
                        {t('equipment.form.parameterNumber', {
                          number: index + 1,
                        })}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMonitoring(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {/* Metric Parameter Field */}
                      <FormField
                        control={form.control}
                        name={`monitors.${index}.parameter`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('equipment.form.metricParameter')} *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={t(
                                      'equipment.form.selectParameter'
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {metricParameterOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="min-h-5">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Alarm Type Field */}
                      <FormField
                        control={form.control}
                        name={`monitors.${index}.alarmType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('equipment.form.alarmType')} *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={t(
                                      'equipment.form.selectAlarmType'
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {alarmTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="min-h-5">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Priority Field */}
                      <FormField
                        control={form.control}
                        name={`monitors.${index}.priority`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('equipment.form.priority')} *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={t(
                                      'equipment.form.selectPriority'
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">
                                  {t('equipment.form.priorityLow')}
                                </SelectItem>
                                <SelectItem value="medium">
                                  {t('equipment.form.priorityMedium')}
                                </SelectItem>
                                <SelectItem value="high">
                                  {t('equipment.form.priorityHigh')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="min-h-5">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Natural Language Row: [Metric] is [condition] [value] */}
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <FormLabel className="mb-3 block text-sm font-medium text-muted-foreground">
                        {t('equipment.form.triggerCondition')}
                      </FormLabel>
                      <div className="flex flex-col md:flex-row gap-3 items-start md:items-start">
                        {/* "When" text */}
                        <div className="hidden md:flex items-center justify-center px-1 h-10">
                          <span className="text-sm font-medium text-muted-foreground">
                            {t('equipment.form.when')}
                          </span>
                        </div>

                        {/* Metric Display (Read-only) */}
                        <div className="shrink-0 min-w-[140px]">
                          <div className="h-10 px-3 py-2 rounded-md border bg-background flex items-center text-sm font-medium shadow-sm">
                            {(() => {
                              const selectedParameter = form.watch(
                                `monitors.${index}.parameter`
                              );
                              switch (selectedParameter) {
                                case 'temperature':
                                  return 'Temperature';
                                case 'surface_temperature':
                                  return 'Surface Temperature';
                                case 'vibration':
                                  return 'RMS';
                                case 'current':
                                  return 'Amps';
                                default:
                                  return 'Metric';
                              }
                            })()}
                          </div>
                        </div>

                        {/* "is" text */}
                        <div className="hidden md:flex items-center justify-center px-1 h-10">
                          <span className="text-sm font-medium text-muted-foreground">
                            is
                          </span>
                        </div>

                        {/* Condition Dropdown (Dynamic based on parameter) */}
                        <FormField
                          control={form.control}
                          name={`monitors.${index}.condition`}
                          render={({ field }) => {
                            const selectedParameter = form.watch(
                              `monitors.${index}.parameter`
                            );

                            // Determine condition options based on selected parameter
                            const getConditionOptions = () => {
                              if (
                                selectedParameter === 'temperature' ||
                                selectedParameter === 'surface_temperature'
                              ) {
                                return [
                                  {
                                    value: 'above',
                                    label: t('equipment.form.above'),
                                  },
                                  {
                                    value: 'below',
                                    label: t('equipment.form.below'),
                                  },
                                ];
                              } else if (selectedParameter === 'current') {
                                return [
                                  {
                                    value: 'increase',
                                    label: t('equipment.form.increase'),
                                  },
                                  {
                                    value: 'decrease',
                                    label: t('equipment.form.decrease'),
                                  },
                                ];
                              } else if (selectedParameter === 'vibration') {
                                return [
                                  {
                                    value: 'above',
                                    label: t('equipment.form.above'),
                                  },
                                  {
                                    value: 'below',
                                    label: t('equipment.form.below'),
                                  },
                                ];
                              } else {
                                return [
                                  {
                                    value: 'above',
                                    label: t('equipment.form.above'),
                                  },
                                  {
                                    value: 'below',
                                    label: t('equipment.form.below'),
                                  },
                                ];
                              }
                            };

                            const conditionOptions = getConditionOptions();

                            return (
                              <div className="flex-1 min-w-[120px]">
                                <FormItem className="space-y-1">
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={
                                      isSubmitting || !selectedParameter
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full bg-background">
                                        <SelectValue
                                          placeholder={t(
                                            'equipment.form.condition'
                                          )}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {conditionOptions.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              </div>
                            );
                          }}
                        />

                        {/* Value Field with Dynamic Unit */}
                        <FormField
                          control={form.control}
                          name={`monitors.${index}.value`}
                          render={({ field }) => {
                            const selectedParameter = form.watch(
                              `monitors.${index}.parameter`
                            );
                            const labels = getParameterFieldLabels(
                              selectedParameter,
                              t
                            );

                            return (
                              <div className="flex-1 min-w-[120px]">
                                <FormItem className="space-y-1">
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        placeholder={t('equipment.form.value')}
                                        disabled={
                                          isSubmitting || !selectedParameter
                                        }
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="appearance-none pr-12 bg-background"
                                      />
                                      <span className="absolute right-3 top-2 text-sm text-muted-foreground font-medium">
                                        {labels.unit || ''}
                                      </span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              </div>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMonitoring}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('equipment.form.addMonitoringParameter')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  const renderDocumentTab = () => {
    return (
      <TabsContent
        value="document"
        className="m-0 data-[state=active]:flex data-[state=active]:flex-col h-[420px]"
      >
        <Card className="shadow-sm flex-1 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              {t('equipment.form.documents')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-hidden">
            <DocumentTable equipment={equipment ?? null} setPreviewData={setPreviewData} emptyState={<div className="text-center py-12">
              <FileStack
                className="text-muted-foreground w-15 h-15 mx-auto mb-4"
                strokeWidth={1}
              />
              <h3 className="text-base font-medium mb-1">
                No Document Found
              </h3>
              <p className="text-sm text-muted-foreground">
                Asset related documents will appear here
              </p>
            </div>} />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={() => {
          form.reset();
          onOpenChange();
        }}
      >
        <DialogContent
          className="w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        // onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isNew
                ? t('equipment.form.createNewEquipment')
                : t('equipment.form.editEquipment')}
            </DialogTitle>
          </DialogHeader>

          {/* Loading State */}
          {isLoading ? (
            <CompactLoader />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Main Form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit, onError)}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 overflow-hidden">
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full h-full flex flex-col"
                    >
                      <TabsList className={cn({
                        'inline-flex sm:grid w-full h-auto sm:h-10 p-1 bg-muted/50 overflow-x-auto overflow-y-hidden justify-start sm:justify-center shadow-md no-scrollbar': true,
                        'sm:grid-cols-4': isNew,
                        'sm:grid-cols-5': !isNew,
                      })}>
                        <TabsTrigger
                          value="basic"
                          className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2"
                        >
                          <Info className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {t('equipment.form.tabs.basicInfo')}
                          </span>
                          {currentTabErrors.basic && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="device"
                          className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2"
                        >
                          <Monitor className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {t('equipment.form.tabs.equipmentDetails')}
                          </span>
                          {currentTabErrors.device && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </TabsTrigger>
                        {
                          !isNew && <TabsTrigger
                            value="document"
                            className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2"
                          >
                            <File className="h-4 w-4" />
                            <span className="whitespace-nowrap">
                              {t('equipment.form.documents')}
                            </span>
                          </TabsTrigger>
                        }
                        <TabsTrigger
                          value="sensors"
                          className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2"
                        >
                          <Radio className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {t('equipment.form.tabs.sensors')}
                          </span>
                          {currentTabErrors.sensors && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="specs"
                          className="flex items-center gap-2 shrink-0 sm:shrink data-[state=active]:shadow-sm px-4 sm:px-2"
                        >
                          <Bell className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {t('equipment.form.tabs.specification')}
                          </span>
                          {currentTabErrors.specs && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex-1 overflow-hidden py-4">
                        {/* Basic Info Tab */}
                        {renderBasicInfoTab()}

                        {/* Device Details Tab */}
                        {renderDeviceDetailsTab()}

                        {/* Documents Tab */}
                        {!isNew && renderDocumentTab()}

                        {/* Sensors Tab */}
                        {renderSensorsTab()}

                        {/* Technical Specifications Tab */}
                        {renderSpecificationsTab()}
                      </div>
                    </Tabs>
                  </div>
                </form>
              </Form>
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-3">
            <div className="w-full sm:w-auto">
              {!isNew && (
                <Button
                  variant={equipment?.archived ? 'outline' : 'destructive'}
                  onClick={handleArchive}
                  disabled={isSubmitting}
                  type="button"
                  className="w-full sm:w-auto"
                >
                  {equipment?.archived ? (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  {equipment?.archived
                    ? t('equipment.table.equipmentUnarchive')
                    : t('equipment.table.equipmentArchive')}
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onOpenChange}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit, onError)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EquipmentForm;
