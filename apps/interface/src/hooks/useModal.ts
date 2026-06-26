import { useCallback } from "react";
import { useAppDispatch, useAppSelector, selectModalStack } from "@/store/hooks";
import {
  openModal as openModalAction,
  closeModal as closeModalAction,
  closeAll as closeAllAction,
} from "@/store/slices/modalSlice";
import { ReactNode } from "react";

interface ModalConfig {
  title?: string;
  content: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
}

export function useModal() {
  const dispatch = useAppDispatch();
  const stack = useAppSelector(selectModalStack);

  const openModal = useCallback(
    (config: ModalConfig): string => {
      // Generate ID and dispatch
      const id = `modal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      dispatch(openModalAction({ ...config }));
      return id;
    },
    [dispatch]
  );

  const closeModal = useCallback(
    (id: string) => {
      dispatch(closeModalAction(id));
    },
    [dispatch]
  );

  const closeAll = useCallback(() => {
    dispatch(closeAllAction());
  }, [dispatch]);

  return { openModal, closeModal, closeAll, stack };
}
