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
    // Prefer real Telegram initData if available
    const tgInitData = (window as any)?.Telegram?.WebApp?.initData as string | undefined;
    // Allow localhost testing via query params (__twaInitData or twaInitData)
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('__twaInitData') || urlParams.get('twaInitData') || undefined;
    const initData = tgInitData || fromUrl;

    if (!initData) return false;

    const res = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    });

    if (!res.ok) {
      return false;
    }

    const json = await res.json();
    if (json?.token) {
      localStorage.setItem('showpls-jwt', json.token);
      if (!prevToken) {
        // Ensure subsequent queries include Authorization header
        window.location.replace(window.location.pathname + window.location.search + window.location.hash);
      }
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}
