import { useCallback } from 'react';
import { useUserContext } from '@/components/contexts/AuthContext';
import { MODULES } from '@/config/constant';
import { ModulesTag } from '@/types/common/common';

/**
 * Hook to check if the user has permission to access a certain module or feature
 *
 * @returns {object} An object containing a single function `hasPermission` which takes two parameters:
 *   - `tag`: The module or feature to check for permission
 *   - `action`: The action to check for permission (optional) if not provided, checks only for module access
 *   Returns `true` if the user has permission, `false` otherwise
 */
export const usePermission = () => {
  const userContext = useUserContext();
  const user = userContext?.user;

  const hasPermission = useCallback(
    (tag: ModulesTag, action?: string | string[] | null): boolean => {
      if (!user) return false;

      // Admin has full access
      if (user.isAdmin) return true;

      let hasTechnicianAccess = false;
      let hasMonitoringAccess = false;

      if (user.isTechnician) {
        const technicianPermission: Partial<Record<ModulesTag, string[]>> = {};

        if (tag in technicianPermission) {
          if (!action) {
            hasTechnicianAccess = true;
          } else {
            const allowedActions =
              technicianPermission[tag as keyof typeof technicianPermission];

            if (!allowedActions) {
              hasTechnicianAccess = false;
            } else {
              if (Array.isArray(action)) {
                hasTechnicianAccess = action.every((act) =>
                  allowedActions.includes(act)
                );
              } else {
                hasTechnicianAccess = allowedActions.includes(action);
              }
            }
          }
        }
      }

      if (user.isMonitoring) {
        const monitoringPermission: Partial<Record<ModulesTag, string[]>> = {
          [MODULES.DASHBOARD.TAG]: [],
          [MODULES.MONITORING.TAG]: [],
          [MODULES.COMPANY_SELECTION.TAG]: [],
          [MODULES.NOTIFICATION.TAG]: [],
          [MODULES.GENERAL.TAG]: [],
          [MODULES.EQUIPMENT.TAG]: [
            MODULES.EQUIPMENT.ACTIONS.READ,
          ]
        };

        if (tag in monitoringPermission) {
          if (!action) {
            hasMonitoringAccess = true;
          } else {
            const allowedActions =
              monitoringPermission[tag as keyof typeof monitoringPermission];

            if (!allowedActions) {
              hasMonitoringAccess = false;
            } else {
              if (Array.isArray(action)) {
                hasMonitoringAccess = action.every((act) =>
                  allowedActions.includes(act)
                );
              } else {
                hasMonitoringAccess = allowedActions.includes(action);
              }
            }
          }
        }
      }

      return hasTechnicianAccess || hasMonitoringAccess;
    },
    [user]
  );

  return { hasPermission };
};
