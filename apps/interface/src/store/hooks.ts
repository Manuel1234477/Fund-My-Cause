import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Wallet selectors
export const selectWalletAddress = (state: RootState) => state.wallet.address;
export const selectXlmBalance = (state: RootState) => state.wallet.xlmBalance;
export const selectIsConnecting = (state: RootState) =>
  state.wallet.isConnecting;
export const selectIsAutoConnecting = (state: RootState) =>
  state.wallet.isAutoConnecting;
export const selectIsSigning = (state: RootState) => state.wallet.isSigning;
export const selectWalletError = (state: RootState) => state.wallet.error;
export const selectNetworkMismatch = (state: RootState) =>
  state.wallet.networkMismatch;
export const selectWalletNetwork = (state: RootState) =>
  state.wallet.walletNetwork;
export const selectWalletType = (state: RootState) => state.wallet.walletType;

// Theme selectors
export const selectTheme = (state: RootState) => state.theme.theme;

// Notification selectors
export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => !n.read).length;

// Modal selectors
export const selectModalStack = (state: RootState) => state.modals.stack;
