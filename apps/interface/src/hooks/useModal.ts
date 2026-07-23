import { useModalStore } from "@/store/useModalStore";

export function useModal() {
  const openModal = useModalStore((s) => s.openModal);
  const closeModal = useModalStore((s) => s.closeModal);
  const closeAll = useModalStore((s) => s.closeAll);
  return { openModal, closeModal, closeAll };
}
