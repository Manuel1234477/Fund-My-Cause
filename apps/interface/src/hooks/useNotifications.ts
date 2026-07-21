import { useEffect } from "react";
import { useNotificationStore } from "@/store/useNotificationStore";

let hydrated = false;

/**
 * Hydrates the notification store from localStorage exactly once per page
 * load, regardless of how many components call this hook.
 */
export function useNotifications() {
  const state = useNotificationStore();

  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      useNotificationStore.getState().hydrate();
    }
  }, []);

  return state;
}
