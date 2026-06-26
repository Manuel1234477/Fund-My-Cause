import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type NotificationType =
  | "contribution"
  | "goal_reached"
  | "deadline"
  | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  campaignId?: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<
        Omit<Notification, "id" | "timestamp" | "read">
      >
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        read: false,
      };
      state.notifications = [notification, ...state.notifications].slice(
        0,
        50
      );
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) notif.read = true;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
    },
    clearAll: (state) => {
      state.notifications = [];
    },
    loadNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  loadNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
