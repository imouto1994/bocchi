import { useCallback } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';

const SETTINGS_KEY = 'settings';
const INITIAL_VALUE = {
  initialPrompt: '',
  followUpPrompt: '',
  groupCharLimitStr: '600',
};

const useSettingsStore = createChromeStorageStateHookLocal(
  SETTINGS_KEY,
  INITIAL_VALUE
);

export function useSettings() {
  const [{ initialPrompt, followUpPrompt, groupCharLimitStr }, setStore] =
    useSettingsStore();
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

  return {
    initialPrompt,
    followUpPrompt,
    groupCharLimitStr,
    setInitialPrompt,
    setFollowUpPrompt,
    setGroupCharLimitStr,
  };
}
