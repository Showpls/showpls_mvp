import { TonConnect, TonConnectUI, THEME } from '@tonconnect/ui';
import { getAuthToken } from './auth';

class TonConnectService {
  private tonConnect: TonConnect | null = null;
  private tonConnectUI: TonConnectUI | null = null;

  async initialize() {
    try {
      // Initialize TonConnect
      this.tonConnect = new TonConnect({
        manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
      });

      // Initialize TonConnect UI
      this.tonConnectUI = new TonConnectUI({
        manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
        uiPreferences: {
          theme: THEME.DARK,
          colorsSet: {
            [THEME.DARK]: {
              connectButton: {
                background: '#7c5cff',
                foreground: '#ffffff',
              },
              accent: '#7c5cff',
              telegramButton: '#29e3e3',
              icon: {
                primary: '#7c5cff',
                secondary: '#29e3e3',
                tertiary: '#96a0b5',
                success: '#4ade80',
                error: '#ef4444',
              },
              background: {
                primary: '#0b0f14',
                secondary: '#121826',
                segment: '#121826',
              },
              text: {
                primary: '#e8eefc',
                secondary: '#96a0b5',
              },
            },
          },
        },
      });

      // Set up event listeners
      this.tonConnect.onStatusChange((wallet) => {
        console.log('Wallet connection status changed:', wallet);
        
        // Update user wallet address in backend
        if (wallet) {
          this.updateUserWallet(wallet.account.address);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize TON Connect:', error);
      return false;
    }
  }

  async connectWallet() {
    if (!this.tonConnect) {
      throw new Error('TonConnect not initialized');
    }

    try {
      const walletsList = await this.tonConnect.getWallets();
      const wallet = await this.tonConnect.connect(walletsList[0]);
      return wallet;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet() {
    if (!this.tonConnect) {
      throw new Error('TonConnect not initialized');
    }

    try {
      await this.tonConnect.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: any) {
    if (!this.tonConnect) {
      throw new Error('TonConnect not initialized');
    }

    try {
      const result = await this.tonConnect.sendTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  getWallet() {
    return this.tonConnect?.wallet;
  }

  isConnected() {
    return !!this.tonConnect?.wallet;
  }

  getUI() {
    return this.tonConnectUI;
  }

  private async updateUserWallet(address: string) {
    try {
      const token = getAuthToken();
      if (!token) return;

      await fetch('/api/me/wallet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ walletAddress: address }),
      });
    } catch (error) {
      console.error('Failed to update user wallet:', error);
    }
  }

  private getTelegramAuthData() {
    try {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        return window.Telegram.WebApp.initDataUnsafe.user;
      }
      
      if (process.env.NODE_ENV === 'development') {
        return {
          id: 'demo_user_123',
          username: 'demo_user',
          first_name: 'Demo',
          language_code: 'en'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting Telegram auth data:', error);
      return null;
    }
  }
}

// Create singleton instance
export const tonConnectService = new TonConnectService();

// Helper functions for transactions
export const createEscrowTransaction = (
  escrowAddress: string,
  amount: string,
  orderId: string
) => ({
  validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
  messages: [
    {
      address: escrowAddress,
      amount: (parseFloat(amount) * 1e9).toString(), // Convert TON to nanoTON
      payload: orderId, // Order ID as payload
    },
  ],
});

export const createApprovalTransaction = (escrowAddress: string) => ({
  validUntil: Math.floor(Date.now() / 1000) + 300,
  messages: [
    {
      address: escrowAddress,
      amount: '0',
      payload: 'approve', // Approval command
    },
  ],
});

export const createDisputeTransaction = (escrowAddress: string) => ({
  validUntil: Math.floor(Date.now() / 1000) + 300,
  messages: [
    {
      address: escrowAddress,
      amount: '0',
      payload: 'dispute', // Dispute command
    },
  ],
});

// Extend Window interface for Telegram WebApp in a compatible way
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            language_code?: string;
          };
        };
      };
    };
  }
}
