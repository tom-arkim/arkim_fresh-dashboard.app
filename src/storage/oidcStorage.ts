// OIDC-specific storage management
import { STORAGE_KEYS } from '@/config/constant';
// This module handles storage for OIDC authentication without touching existing auth storage

// Clear OIDC authentication storage
export const clearOidcStorage = () => {
  // Clear OIDC storage keys from localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.OIDC_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  clearOidcRedirectUrl();
};

// Store redirect URL for OIDC flow
export const setOidcRedirectUrl = (url: string) => {
  localStorage.setItem(STORAGE_KEYS.OIDC_REDIRECT_URL, url);
};

export const getOidcRedirectUrl = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.OIDC_REDIRECT_URL);
};

// Clear redirect URL
export const clearOidcRedirectUrl = () => {
  localStorage.removeItem(STORAGE_KEYS.OIDC_REDIRECT_URL);
};
