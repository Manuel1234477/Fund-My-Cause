import { useAppDispatch, useAppSelector, selectNotifications, selectUnreadCount } from "@/store/hooks";
import {
  addNotification as addNotificationAction,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
  clearAll as clearAllAction,
  loadNotifications,
  type Notification,
} from "@/store/slices/notificationSlice";
import { useEffect } from "react";

const STORAGE_KEY = "fmc:notifications";

export function useNotifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : [];
      dispatch(loadNotifications(saved));
    } catch {
      // Ignore parse errors
    }
  }, [dispatch]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore storage errors
    }
  }, [notifications]);

  const addNotification = (
    n: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    dispatch(addNotificationAction(n));
  };

  const markAsRead = (id: string) => {
    dispatch(markAsReadAction(id));
  };

  const markAllAsRead = () => {
    dispatch(markAllAsReadAction());
  };

  const clearAll = () => {
    dispatch(clearAllAction());
  };

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
