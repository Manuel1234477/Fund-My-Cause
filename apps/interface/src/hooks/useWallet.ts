import { useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { useXlmBalance } from "@/hooks/useXlmBalance";
import { useWalletStore } from "@/store/useWalletStore";

export function useWallet() {
  const address = useWalletStore((s) => s.address);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const isAutoConnecting = useWalletStore((s) => s.isAutoConnecting);
  const isSigning = useWalletStore((s) => s.isSigning);
  const error = useWalletStore((s) => s.error);
  const networkMismatch = useWalletStore((s) => s.networkMismatch);
  const walletNetwork = useWalletStore((s) => s.walletNetwork);
  const setShowWalletSelect = useWalletStore((s) => s.setShowWalletSelect);
  const disconnectAction = useWalletStore((s) => s.disconnect);
  const signTxAction = useWalletStore((s) => s.signTx);
  const autoRestore = useWalletStore((s) => s.autoRestore);

  const { addToast } = useToast();
  const { balance: xlmBalance, refresh: refreshBalance } =
    useXlmBalance(address);

  // Auto-restore from sessionStorage on mount
  useEffect(() => {
    autoRestore();
  }, [autoRestore]);

  const connect = useCallback(async () => {
    setShowWalletSelect(true);
  }, [setShowWalletSelect]);

  const disconnect = useCallback(
    () => disconnectAction((msg, type) => addToast(msg, type)),
    [disconnectAction, addToast],
  );

  const signTx = useCallback(
    (xdr: string) => signTxAction(xdr, (msg, type) => addToast(msg, type)),
    [signTxAction, addToast],
  );

  return {
    address,
    xlmBalance,
    refreshBalance,
    connect,
    disconnect,
    signTx,
    isConnecting,
    isAutoConnecting,
    isSigning,
    error,
    networkMismatch,
    walletNetwork,
  };
}
