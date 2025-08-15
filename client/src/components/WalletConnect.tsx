import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Wallet, CheckCircle } from "lucide-react";

export function WalletConnect() {
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

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
        <CheckCircle className="w-4 h-4 mr-1" />
        {wallet.account.address.slice(0, 4)}...{wallet.account.address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      size="sm"
      className="bg-brand-primary hover:bg-brand-primary/80 text-white"
    >
      <Wallet className="w-4 h-4 mr-1" />
      {t("wallet.connect") || "Connect Wallet"}
    </Button>
  );
}
