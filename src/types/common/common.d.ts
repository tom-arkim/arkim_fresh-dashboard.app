import { MODULES } from "@/config/constant";

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  tag: ModulesTag;
}

// valueof MODULES TAGs
export type ModulesTag = typeof MODULES[keyof typeof MODULES]["TAG"];