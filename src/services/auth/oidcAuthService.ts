import {
  UserManagerSettings,
  UserManager,
  WebStorageStateStore,
  User,
  InMemoryWebStorage,
} from 'oidc-client-ts';
import { STORAGE_KEYS, OIDC_CONFIG } from '@/config/constant';
import { clearOidcRedirectUrl, clearOidcStorage, getOidcRedirectUrl, setOidcRedirectUrl } from '@/storage/oidcStorage';
import authService from '@/services/api/authService';
import { logger } from '@/lib/logger';

class OidcAuthService {
  private userManager: UserManager | null = null;
  private signOutInFlight: boolean = false;

  constructor() {
    this.signOutInFlight = sessionStorage.getItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY) === '1';
  }

  public getUserManager(): UserManager {
    if (!this.userManager) {
      this.userManager = this.createUserManager();
    }
    return this.userManager;
  }

  public resetUserManager(): void {
    this.userManager = null;
  }

  public isSigningOut(): boolean {
    return this.signOutInFlight;
  }

  public clearSignOutFlag(): void {
    this.signOutInFlight = false;
    try {
      sessionStorage.removeItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY);
    } catch (error) {
      logger.warn('Failed to remove signout flag from session storage:', error);
    }
  }

  public async signIn(redirectUrl?: string): Promise<void> {
    try {
      const manager = this.getUserManager();

      if (redirectUrl) {
        setOidcRedirectUrl(redirectUrl);
      }

      await manager.signinRedirect();
    } catch (error) {
      logger.error('Error initiating sign in:', error);
      throw error;
    }
  }

  public async signInCallback(): Promise<{ user: User; redirectUrl?: string }> {
    this.clearSignOutFlag();

    try {
      const manager = this.getUserManager();

      // Remove existing user to ensure a fresh start
      await manager.removeUser();

      const user = await manager.signinRedirectCallback();

      if (!user.id_token || !user.refresh_token) {
        throw new Error('Missing required tokens from OIDC response');
      }

      // Exchange tokens with the backend
      await authService.exchangeTokens(user.id_token, user.refresh_token);
      this.setAuthToken(user.id_token);

      const redirectUrl = getOidcRedirectUrl() || OIDC_CONFIG.PATHS.DASHBOARD;
      clearOidcRedirectUrl();

      return { user, redirectUrl };
    } catch (error) {
      logger.error('Error handling sign in callback:', error);
      await this.cleanupAuth();
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    if (this.signOutInFlight) {
      return;
    }

    this.setSignOutFlag();

    try {
      await authService.signOut();
    } catch (error) {
      logger.error('Backend logout failed:', error);
    }

    await this.cleanupAuth();
    const cognitoLogoutUrl = this.buildCognitoLogoutUrl();
    if (cognitoLogoutUrl) {
      window.location.replace(cognitoLogoutUrl);
    } else {
      window.location.replace(OIDC_CONFIG.PATHS.LOGIN);
    }
  }

  public getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  }

  public setAuthToken(idToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
  }

  public clearAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
  }

  public hasStoredToken(): boolean {
    return !!this.getAuthToken();
  }

  public isAuthenticated(): boolean {
    return this.hasStoredToken();
  }

  private createUserManager(): UserManager {
    const settings = this.buildSettings();
    const um = new UserManager(settings);

    um.clearStaleState().catch((err) => {
      logger.debug('Failed to clear stale OIDC state:', err);
    });

    return um;
  }

  private buildSettings(): UserManagerSettings {
    const cognitoIssuerUrl = import.meta.env.VITE_COGNITO_ISSUER_URL;
    const cognitoClientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;

    if (!cognitoIssuerUrl || !cognitoClientId) {
      throw new Error('Cognito configuration is missing from environment variables');
    }

    const authority = cognitoIssuerUrl.endsWith('/') ? cognitoIssuerUrl : `${cognitoIssuerUrl}/`;
    const origin = window.location.origin;

    return {
      authority,
      client_id: cognitoClientId,
      redirect_uri: `${origin}${OIDC_CONFIG.PATHS.CALLBACK}`,
      response_type: 'code',
      scope: OIDC_CONFIG.SCOPES,
      stateStore: new WebStorageStateStore({
        store: window.localStorage,
        prefix: 'oidc.',
      }),
      userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
      automaticSilentRenew: false,
      silent_redirect_uri: `${origin}${OIDC_CONFIG.PATHS.CALLBACK}`,
      post_logout_redirect_uri: `${origin}${OIDC_CONFIG.PATHS.LOGIN}`,
      loadUserInfo: false,
    };
  }

  private buildCognitoLogoutUrl(): string | null {
    const cognitoClientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;
    if (!cognitoClientId) return null;

    const logoutUri = `${window.location.origin}${OIDC_CONFIG.PATHS.LOGIN}`;
    const params = new URLSearchParams({
      client_id: cognitoClientId,
      logout_uri: logoutUri,
    });

    return `${OIDC_CONFIG.COGNITO_DOMAIN}/logout?${params.toString()}`;
  }

  private setSignOutFlag(): void {
    this.signOutInFlight = true;
    try {
      sessionStorage.setItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY, '1');
    } catch (error) {
      logger.warn('Failed to set signout flag in session storage:', error);
    }
  }

  private async cleanupAuth(): Promise<void> {
    try {
      const manager = this.getUserManager();
      await manager.removeUser();
      await manager.clearStaleState();
    } catch (error) {
      logger.warn('Error cleaning up user manager:', error);
    }

    this.clearAuthToken();
    clearOidcStorage();
  }
}

const oidcAuthService = new OidcAuthService();
export default oidcAuthService;


