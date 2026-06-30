import { useAuth, useUserContext } from '@/components/contexts/AuthContext';
import { useEffect, useState } from 'react';
import siteService from '@/services/api/siteService';
import useSiteStore from '@/store/siteStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/shadcn/select';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import SiteDetails from '@/types/sites/SiteDetails';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/shadcn/separator';
import { ChartNoAxesGantt, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationBroadcast } from '@/hooks/broadcasts/use-location-broadcast';

export function SiteDropDown() {
  const { context } = useAuth();
  const [sites, setSites] = useState<SiteDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    setCurrentSite,
    currentSite,
    setUserSites,
    setIsLoading: setIsLoadingStore,
  } = useSiteStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { locationUpdated } = useLocationBroadcast((event) => {
    if (event.type === 'LOCATION_UPDATED') {
      setCurrentSite(sites?.find((site) => site.id === event.locationId) ?? sites[0]);
    }
  });

  const userContextDetails = useUserContext();

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        setIsLoadingStore(true);

        const userSitesList = (await siteService.listUserSites()).filter((location) => context?.user.assignedSites?.includes(location.id ?? ''));

        // Sort alphabetically
        userSitesList.sort((a, b) => a.name.localeCompare(b.name));

        if (userSitesList.length > 0) {
          setSites(userSitesList);
          setUserSites(userSitesList);

          // If user has a default location
          if (userContextDetails?.user?.defaultSite) {
            const preferredLocation = userSitesList.find(
              (site) => site.id === userContextDetails.user?.defaultSite
            );
            if (preferredLocation) {
              setCurrentSite(preferredLocation);
            }
          } else {
            // fallback: pick the first one
            setCurrentSite(userSitesList[0]);
          }
        }
      } catch (err) {
        logger.error('Error fetching sites:', err);
      } finally {
        setLoading(false);
        setIsLoadingStore(false);
      }
    };

    fetchSites();
  }, [
    setCurrentSite,
    setIsLoadingStore,
    setUserSites,
    userContextDetails?.user?.defaultSite,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium leading-none">
          {t('sites.sitesLoading')}
        </p>
      </div>
    );
  }

  return (
    <section className="flex gap-2 items-end">
      <Select
        value={currentSite?.id}
        onValueChange={(value) => {
          if (value === 'viewAll') {
            navigate('/settings/sites');
            return;
          }

          const selected = sites?.find((site) => site.id === value);
          if (selected) {
            setCurrentSite(selected);
            locationUpdated(selected.id ?? sites[0].id!);
          }
        }}
      >
        <SelectTrigger className="w-[200px] font-medium text-sm bg-card/50">
          <p className='flex flex-row items-center gap-1'>
            <Factory />
            {currentSite?.name}
          </p>
        </SelectTrigger>
        <SelectContent>
          {sites?.map((site) => (
            <SelectItem key={site.id} value={site.id!} className={cn(
              'group/siteTab flex flex-row items-center gap-2 my-1',
              { 'bg-sidebar-accent font-medium': currentSite?.id === site.id }
            )}>
              <Factory className={currentSite?.id === site.id ? 'text-primary group-hover/siteTab:text-muted-foreground' : ''} />
              {site.name}
            </SelectItem>
          ))}
          <Separator className='my-1' />
          <SelectItem value="viewAll">
            <ChartNoAxesGantt className='text-foreground' />{t('sites.viewAllSites')}
          </SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}
