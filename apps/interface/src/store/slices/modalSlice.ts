import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReactNode } from "react";

interface ModalConfig {
  id: string;
  title?: string;
  content: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
}

interface ModalState {
  stack: ModalConfig[];
  counter: number;
}

const initialState: ModalState = {
  stack: [],
  counter: 0,
};

const modalSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<Omit<ModalConfig, "id">>
    ) => {
      const id = `modal-${++state.counter}`;
      state.stack.push({ ...action.payload, id });
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.stack = state.stack.filter((m) => m.id !== action.payload);
    },
    closeAll: (state) => {
      state.stack = [];
    },
  },
});

export const { openModal, closeModal, closeAll } = modalSlice.actions;

export default modalSlice.reducer;
