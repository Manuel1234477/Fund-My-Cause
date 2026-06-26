import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WalletState {
  address: string | null;
  xlmBalance: string | null;
  isConnecting: boolean;
  isAutoConnecting: boolean;
  isSigning: boolean;
  error: string | null;
  networkMismatch: boolean;
  walletNetwork: string | null;
  walletType: "freighter" | "lobstr" | null;
}

const initialState: WalletState = {
  address: null,
  xlmBalance: null,
  isConnecting: false,
  isAutoConnecting: false,
  isSigning: false,
  error: null,
  networkMismatch: false,
  walletNetwork: null,
  walletType: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload;
    },
    setXlmBalance: (state, action: PayloadAction<string | null>) => {
      state.xlmBalance = action.payload;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setAutoConnecting: (state, action: PayloadAction<boolean>) => {
      state.isAutoConnecting = action.payload;
    },
    setSigning: (state, action: PayloadAction<boolean>) => {
      state.isSigning = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setNetworkMismatch: (state, action: PayloadAction<boolean>) => {
      state.networkMismatch = action.payload;
    },
    setWalletNetwork: (state, action: PayloadAction<string | null>) => {
      state.walletNetwork = action.payload;
    },
    setWalletType: (
      state,
      action: PayloadAction<"freighter" | "lobstr" | null>
    ) => {
      state.walletType = action.payload;
    },
    reset: () => initialState,
  },
});

export const {
  setAddress,
  setXlmBalance,
  setConnecting,
  setAutoConnecting,
  setSigning,
  setError,
  setNetworkMismatch,
  setWalletNetwork,
  setWalletType,
  reset,
} = walletSlice.actions;

export default walletSlice.reducer;
