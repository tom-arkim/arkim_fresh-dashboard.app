import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Plus, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import SiteBase from '@/types/sites/SiteBase';
import siteService from '@/services/api/siteService';
import Messenger from '@/services/ui/messengerService';
import { useTranslation } from 'react-i18next';
import MessengerService from '@/services/ui/messengerService';
import { SiteListCard } from '@/components/settings/sites/SitesListItem';
import { SiteFormDialog } from '@/components/settings/sites/SitesForm';
import { logger } from '@/lib/logger';
import { useSitesBroadcast } from '@/hooks/broadcasts/use-sites-broadcast';

export default function SitesManagement() {
  const { t } = useTranslation();
  const [sites, setSites] = useState<SiteBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSite, setDialogSite] = useState<SiteBase | null>(null);

  const { requestSitesRefresh } = useSitesBroadcast((event) => {
    if (event.type === 'SITES_REFRESHED') {
      loadSites();
    }
  });

  const loadSites = async () => {
    setLoading(true);
    try {
      const data = await siteService.list('');
      setSites(data);
    } catch {
      Messenger.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleOnSubmit = async () => {
    requestSitesRefresh();
    await loadSites();
    setDialogOpen(false);
    setDialogSite(null);
  };

  const handleOnClose = async () => {
    setDialogOpen(false);
    setDialogSite(null);
  };

  const handleEdit = (site: SiteBase) => {
    setDialogSite(site);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setDialogOpen(true);
    setDialogSite(null);
  };

  const handleDelete = async (siteId: string) => {
    // Find the site to get its name
    const site = sites.find((s) => s.id === siteId);
    const siteName = site?.name || 'Site';

    MessengerService.confirmDelete({
      itemName: siteName,
      itemType: 'Site',
      onDelete: async () => {
        await siteService.delete(siteId);
      },
      onSuccess: async () => {
        requestSitesRefresh();
        await loadSites();
      },
      onError: (error) => {
        logger.error('Error deleting site:', error);
        MessengerService.error(`Failed to delete site: ${error.message}`);
      },
      undoTimeout: 5000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between sm:items-center sm:flex-row flex-col space-y-2">
        <div>
          <h1 className="page-header">{t('sites.title')}</h1>
          <p className="page-subTitle">{t('sites.subTitle')}</p>
        </div>
        <div className="flex items-center space-x-2 sm:w-auto w-full">
          <Button onClick={handleCreate} className='sm:flex-none flex-1'>
            <Plus className="h-4 w-4 mr-2" />{' '}
            {t('sites.form.createNewSite')}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  requestSitesRefresh();
                  loadSites();
                }}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.refresh')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* List */}
      <SiteListCard sites={sites} loading={loading} onEdit={handleEdit} />

      {/* Dialog */}
      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={handleOnClose}
        initialData={dialogSite}
        onFormSubmit={handleOnSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
