import { TonConnect } from '@tonconnect/sdk';
import { TonConnectUI } from '@tonconnect/ui-react';
import { getAuthToken } from "./auth";

// TonConnect configuration
export const TONCONNECT_CONFIG = {
  manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
  uiPreferences: {
    theme: 'dark' as const,
    colorsSet: {
      dark: {
        connectButton: {
          background: "#7c5cff",
          foreground: "#ffffff",
        },
        accent: "#7c5cff",
        telegramButton: "#29e3e3",
        icon: {
          primary: "#7c5cff",
          secondary: "#29e3e3",
          tertiary: "#96a0b5",
          success: "#4ade80",
          error: "#ef4444",
        },
        background: {
          primary: "#0b0f14",
          secondary: "#121826",
          segment: "#121826",
        },
        text: {
          primary: "#e8eefc",
          secondary: "#96a0b5",
        },
      },
    },
  },
};

// Create TonConnect UI instance
export const tonConnectUI = new TonConnectUI({
  manifestUrl: TONCONNECT_CONFIG.manifestUrl,
  uiPreferences: TONCONNECT_CONFIG.uiPreferences,
});

// TonConnect service class
export class TonConnectReactService {
  private tonConnect: TonConnect | null = null;

  constructor() {
    this.tonConnect = tonConnectUI.connector;
  }

  async initialize() {
    try {
      console.log('[TONCONNECT] Initializing TonConnect React service...');
      
      // Set up event listeners
      this.tonConnect?.onStatusChange((wallet) => {
        console.log("[TONCONNECT] Wallet connection status changed:", wallet);

        // Update user wallet address in backend
        if (wallet) {
          this.updateUserWallet(wallet.account.address);
        }
      });

      return true;
    } catch (error) {
      console.error("[TONCONNECT] Failed to initialize:", error);
      return false;
    }
  }

  async connectWallet() {
    if (!this.tonConnect) {
      throw new Error("TonConnect not initialized");
    }

    try {
      const walletsList = await this.tonConnect.getWallets();
      const wallet = await this.tonConnect.connect(walletsList[0]);
      return wallet;
    } catch (error) {
      console.error("[TONCONNECT] Failed to connect wallet:", error);
      throw error;
    }
  }

  async disconnectWallet() {
    if (!this.tonConnect) {
      throw new Error("TonConnect not initialized");
    }

    try {
      await this.tonConnect.disconnect();
    } catch (error) {
      console.error("[TONCONNECT] Failed to disconnect wallet:", error);
      throw error;
    }
  }

  async sendTransaction(transaction: any) {
    if (!this.tonConnect) {
      throw new Error("TonConnect not initialized");
    }

    try {
      const result = await this.tonConnect.sendTransaction(transaction);
      return result;
    } catch (error) {
      console.error("[TONCONNECT] Failed to send transaction:", error);
      throw error;
    }
  }

  getWallet() {
    return this.tonConnect?.wallet || null;
  }

  isConnected() {
    return this.tonConnect?.connected || false;
  }

  private async updateUserWallet(walletAddress: string) {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("[TONCONNECT] No auth token available for wallet update");
        return;
      }

      const response = await fetch('/api/user/wallet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        console.error("[TONCONNECT] Failed to update user wallet:", response.statusText);
      } else {
        console.log("[TONCONNECT] User wallet updated successfully");
      }
    } catch (error) {
      console.error("[TONCONNECT] Error updating user wallet:", error);
    }
  }
}

// Create singleton instance
export const tonConnectReactService = new TonConnectReactService();
