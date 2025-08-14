export function getAuthToken(): string {
  try {
    return localStorage.getItem('showpls-jwt') || '';
  } catch {
    return '';
  }
}

export async function bootstrapTelegramAuth(): Promise<boolean> {
  try {
    const prevToken = getAuthToken();
    
    // Check if Telegram WebApp is available
    const telegramWebApp = (window as any)?.Telegram?.WebApp;
    
    if (!telegramWebApp) {
      console.warn('[AUTH] Telegram WebApp not available - make sure you\'re opening this in Telegram');
      return false;
    }

    // Prefer real Telegram initData if available
    const tgInitData = telegramWebApp.initData as string | undefined;
    
    // Allow localhost testing via query params (__twaInitData or twaInitData)
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('__twaInitData') || urlParams.get('twaInitData') || undefined;
    const initData = tgInitData || fromUrl;

    console.log('[AUTH] Telegram WebApp available:', {
      initData: !!tgInitData,
      fromUrl: !!fromUrl,
      hasInitData: !!initData,
      user: telegramWebApp.initDataUnsafe?.user
    });

    if (!initData) {
      console.warn('[AUTH] No initData available - authentication cannot proceed');
      return false;
    }

    console.log('[AUTH] Attempting to authenticate with Telegram...');

    const res = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    });

    if (!res.ok) {
      console.error('[AUTH] Authentication failed:', res.status, res.statusText);
      return false;
    }

    const json = await res.json();
    if (json?.token) {
      localStorage.setItem('showpls-jwt', json.token);
      console.log('[AUTH] Successfully authenticated with Telegram');
      
      if (!prevToken) {
        // Ensure subsequent queries include Authorization header
        window.location.replace(window.location.pathname + window.location.search + window.location.hash);
      }
      return true;
    }

    console.warn('[AUTH] No token received from authentication');
    return false;
  } catch (e) {
    console.error('[AUTH] Authentication error:', e);
    return false;
  }
}

// TypeScript declarations for Telegram Web App
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          chat_instance?: string;
          chat_type?: string;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        MainButton?: {
          text?: string;
          color?: string;
          textColor?: string;
          isVisible?: boolean;
          isActive?: boolean;
          show?: () => void;
          hide?: () => void;
          enable?: () => void;
          disable?: () => void;
          showProgress?: (leaveActive?: boolean) => void;
          hideProgress?: () => void;
          setText?: (text: string) => void;
          onClick?: (callback: () => void) => void;
          offClick?: (callback: () => void) => void;
        };
        BackButton?: {
          isVisible?: boolean;
          show?: () => void;
          hide?: () => void;
          onClick?: (callback: () => void) => void;
          offClick?: (callback: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged?: () => void;
        };
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme?: 'light' | 'dark';
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        headerColor?: string;
        backgroundColor?: string;
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        offEvent?: (eventType: string, eventHandler: () => void) => void;
        sendData?: (data: string) => void;
        switchInlineQuery?: (query: string, choose_chat_types?: string[]) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink?: (url: string) => void;
        openInvoice?: (url: string, callback?: (status: string) => void) => void;
        showPopup?: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (buttonId: string) => void) => void;
        showAlert?: (message: string, callback?: () => void) => void;
        showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup?: (params: { text?: string }, callback?: (data: string) => void) => void;
        closeScanQrPopup?: () => void;
        readTextFromClipboard?: (callback?: (data: string) => void) => void;
        requestWriteAccess?: (callback?: (access: boolean) => void) => void;
        requestContact?: (callback?: (contact: { phone_number: string; first_name: string; last_name?: string; user_id?: number }) => void) => void;
        requestLocation?: () => Promise<{ lat: number; lng: number }>;
        invokeCustomMethod?: (method: string, params?: any, callback?: (result: any) => void) => void;
        version?: string;
        platform?: string;
        isVersionAtLeast?: (version: string) => boolean;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
      };
    };
  }
}
