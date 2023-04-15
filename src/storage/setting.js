import { useCallback } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';

const SETTINGS_KEY = 'settings';
const INITIAL_VALUE = {
  initialPrompt: '',
  followUpPrompt: '',
  groupCharLimitStr: '600',
  isInQueue: null,
};

const useSettingsStore = createChromeStorageStateHookLocal(
  SETTINGS_KEY,
  INITIAL_VALUE
);

export function useSettings() {
  const [
    { initialPrompt, followUpPrompt, groupCharLimitStr, isInQueue },
    setStore,
  ] = useSettingsStore();
  const setInitialPrompt = useCallback(
    (newPrompt) => {
      setStore((prev) => ({
        ...prev,
        initialPrompt: newPrompt,
      }));
    },
    [setStore]
  );
  const setFollowUpPrompt = useCallback(
    (newPrompt) => {
      setStore((prev) => ({
        ...prev,
        followUpPrompt: newPrompt,
      }));
    },
    [setStore]
  );
  const setGroupCharLimitStr = useCallback(
    (newLimitStr) => {
      setStore((prev) => ({
        ...prev,
        groupCharLimitStr: newLimitStr,
      }));
    },
    [setStore]
  );
  const setIsInQueue = useCallback(
    (newFlag) => {
      setStore((prev) => ({
        ...prev,
        isInQueue: newFlag,
      }));
    },
    [setStore]
  );

  return {
    initialPrompt,
    followUpPrompt,
    groupCharLimitStr,
    isInQueue,
    setInitialPrompt,
    setFollowUpPrompt,
    setGroupCharLimitStr,
    setIsInQueue,
  };
}
