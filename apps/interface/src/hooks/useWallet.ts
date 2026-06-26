import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectWalletAddress,
  selectXlmBalance,
  selectIsConnecting,
  selectIsAutoConnecting,
  selectIsSigning,
  selectWalletError,
  selectNetworkMismatch,
  selectWalletNetwork,
  selectWalletType,
} from "@/store/hooks";
import {
  setAddress,
  setConnecting,
  setAutoConnecting,
  setSigning,
  setError,
  setNetworkMismatch,
  setWalletNetwork,
  setWalletType,
  reset,
} from "@/store/slices/walletSlice";
import { getNetworkDetails } from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "@/lib/constants";
import { freighterAdapter } from "@/lib/freighterAdapter";
import { lobstrAdapter } from "@/lib/lobstrAdapter";
import type { WalletAdapter } from "@/lib/walletAdapters";
import { useXlmBalance } from "@/hooks/useXlmBalance";
import {
  saveSession,
  loadSession,
  clearSession,
  isNetworkMatch,
  classifySignError,
  type WalletType,
} from "@/services/wallet.service";
import { useToast } from "@/components/ui/Toast";

const ADAPTERS: Record<WalletType, WalletAdapter> = {
  freighter: freighterAdapter,
  lobstr: lobstrAdapter,
};

export function useWallet() {
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const address = useAppSelector(selectWalletAddress);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const xlmBalance = useAppSelector(selectXlmBalance);
  const isConnecting = useAppSelector(selectIsConnecting);
  const isAutoConnecting = useAppSelector(selectIsAutoConnecting);
  const isSigning = useAppSelector(selectIsSigning);
  const error = useAppSelector(selectWalletError);
  const networkMismatch = useAppSelector(selectNetworkMismatch);
  const walletNetwork = useAppSelector(selectWalletNetwork);
  const walletType = useAppSelector(selectWalletType);

  const { balance, refresh: refreshBalance } = useXlmBalance(address);

  const checkNetwork = useCallback(async () => {
    const result = await getNetworkDetails();
    if (result.error) return;
    dispatch(setWalletNetwork(result.network));
    dispatch(setNetworkMismatch(!isNetworkMatch(result.networkPassphrase)));
  }, [dispatch]);

  // Auto-restore from session storage
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      dispatch(setAddress(saved.address));
      dispatch(setWalletType(saved.walletType));
      checkNetwork().finally(() => dispatch(setAutoConnecting(false)));
    } else {
      dispatch(setAutoConnecting(false));
    }
  }, [dispatch, checkNetwork]);

  const connectWith = useCallback(
    async (type: WalletType) => {
      dispatch(setConnecting(true));
      dispatch(setError(null));
      const adapter = ADAPTERS[type];
      try {
        const addr = await adapter.connect();
        saveSession(addr, type);
        dispatch(setAddress(addr));
        dispatch(setWalletType(type));
        await checkNetwork();
        addToast("Wallet connected successfully!", "success");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to connect wallet.";
        dispatch(setError(msg));
        addToast(msg, "error");
      } finally {
        dispatch(setConnecting(false));
      }
    },
    [dispatch, checkNetwork, addToast]
  );

  const connect = useCallback(async () => {
    return connectWith("freighter");
  }, [connectWith]);

  const disconnect = useCallback(async () => {
    if (walletType) {
      await ADAPTERS[walletType]?.disconnect?.();
    }
    clearSession();
    dispatch(reset());
    addToast("Wallet disconnected", "info");
  }, [walletType, dispatch, addToast]);

  const signTx = useCallback(
    async (xdr: string): Promise<string> => {
      if (!walletType) throw new Error("No wallet connected");
      dispatch(setSigning(true));
      try {
        return await ADAPTERS[walletType].signTransaction(xdr, NETWORK_PASSPHRASE);
      } catch (e) {
        const kind = classifySignError(e);
        if (kind === "cancelled") addToast("Transaction cancelled", "info");
        else if (kind === "network")
          addToast("Network error, please try again", "error");
        throw e;
      } finally {
        dispatch(setSigning(false));
      }
    },
    [walletType, dispatch, addToast]
  );

  return {
    address,
    xlmBalance: balance,
    refreshBalance,
    connect,
    connectWith,
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
