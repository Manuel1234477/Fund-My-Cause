// Custom hooks library
export { useLocalStorage } from "./useLocalStorage";
export { useDebounce } from "./useDebounce";
export { useAsync } from "./useAsync";
export type { AsyncStatus, AsyncState, UseAsyncReturn } from "./useAsync";

// Domain hooks
export {
  useCampaign,
  useContribute,
  useWithdraw,
  useRefund,
  useBatchRefund,
  usePause,
  useUnpause,
} from "./useCampaign";
export { useCampaignDraft } from "./useCampaignDraft";
export type { CampaignDraftData, DraftSaveStatus } from "./useCampaignDraft";
export { useXlmBalance } from "./useXlmBalance";
export { useAccountExists } from "./useAccountExists";
export { useRecommendations } from "./useRecommendations";
export { useComments } from "./useComments";
export { useBreakpoint } from "./useBreakpoint";
export { useFocusTrap } from "./useFocusTrap";
export { useSearchSuggestions } from "./useSearchSuggestions";
export type { SearchSuggestion } from "./useSearchSuggestions";
export { useBackButton } from "./useBackButton";
export type { UseBackButtonOptions, UseBackButtonReturn } from "./useBackButton";

// Redux hooks (state management)
export { useWallet } from "./useWallet";
export { useTheme } from "./useTheme";
export { useNotifications } from "./useNotifications";
export { useModal } from "./useModal";

// PWA hooks
export { useInstallPrompt } from "./useInstallPrompt";
