import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Wallet, CheckCircle } from "lucide-react";
import { getAuthToken } from '@/lib/auth';

export function WalletConnect() {
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();

  const { mutate: updateWallet, isPending: isUpdatingWallet } = useMutation({
    mutationFn: async (address: string) => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/me/wallet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!response.ok) {
        throw new Error('Failed to update wallet');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      console.log('[WALLET] Wallet address successfully updated on backend.');
    },
    onError: (error) => {
      console.error('[WALLET] Error updating wallet on backend:', error);
    },
  });

  useEffect(() => {
    if (wallet?.account?.address) {
      console.log('[WALLET] Detected connected wallet:', wallet.account.address);
      updateWallet(wallet.account.address);
    }
  }, [wallet?.account?.address]);


  const handleConnect = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
  };

  if (wallet) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
        onClick={handleDisconnect}
      >
        <Wallet className="w-4 h-4 mr-1" />
        {t("wallet.disconnect") || "Disconnect"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      size="sm"
      className="bg-brand-primary hover:bg-brand-primary/80 text-white text-sm font-medium"
    >
      <Wallet className="w-4 h-4 mr-1" />
      {t("wallet.connect") || "Connect Wallet"}
    </Button>
  );
}
