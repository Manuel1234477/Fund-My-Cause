import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import walletReducer from "./slices/walletSlice";
import themeReducer from "./slices/themeSlice";
import notificationReducer from "./slices/notificationSlice";
import modalReducer from "./slices/modalSlice";

const persistConfig = {
  key: "fmc-root",
  storage,
  whitelist: ["wallet", "theme", "notifications"],
};

const persistedWalletReducer = persistReducer(
  { ...persistConfig, key: "wallet" },
  walletReducer
);
const persistedThemeReducer = persistReducer(
  { ...persistConfig, key: "theme" },
  themeReducer
);
const persistedNotificationReducer = persistReducer(
  { ...persistConfig, key: "notifications" },
  notificationReducer
);

export const store = configureStore({
  reducer: {
    wallet: persistedWalletReducer,
    theme: persistedThemeReducer,
    notifications: persistedNotificationReducer,
    modals: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredPaths: ["modals.stack"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
