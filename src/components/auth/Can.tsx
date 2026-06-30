import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { ModulesTag } from '@/types/common/common';

interface CanProps {
  tag: ModulesTag;
  action?: string | string[] | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const Can: React.FC<CanProps> = ({
  tag,
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermission();

  if (hasPermission(tag, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default Can;
