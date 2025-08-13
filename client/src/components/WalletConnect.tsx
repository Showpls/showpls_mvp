import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Wallet, CheckCircle } from "lucide-react";
import { tonConnectService } from "@/lib/ton-connect";

export function WalletConnect() {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const ok = await tonConnectService.initialize();
      if (!ok || !isMounted) return;
      // TonConnectService will update backend on status change; we only need to reflect UI
      // Try to infer current state by attempting a no-op connect list
      try {
        // no-op; TonConnect manages session internally; if already connected, status change will have fired
      } catch (_) { }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const wallet = await tonConnectService.connectWallet();
      const addr = (wallet as any)?.account?.address || (tonConnectService.getWallet() as any)?.account?.address;
      if (addr) {
        setIsConnected(true);
        setAddress(addr);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await tonConnectService.disconnectWallet();
      setIsConnected(false);
      setAddress("");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
        onClick={disconnectWallet}
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        {address.slice(0, 4)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      size="sm"
      className="bg-brand-primary hover:bg-brand-primary/80 text-white"
    >
      <Wallet className="w-4 h-4 mr-1" />
      {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
    </Button>
  );
}
