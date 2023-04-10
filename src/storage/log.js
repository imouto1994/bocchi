import { useCallback, useMemo } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';

const LOG_KEY = 'log';
const COOLDOWN_DURATION_MS = 3 * 60 * 60 * 1000;
const INITIAL_VALUE = {
  translateTimestamps: [],
};

const useLogStore = createChromeStorageStateHookLocal(LOG_KEY, INITIAL_VALUE);

export function useLog() {
  const [{ translateTimestamps }, setStore] = useLogStore();

  const translateCount = useMemo(
    () => translateTimestamps.length,
    [translateTimestamps]
  );

  const addTranslateTimestamp = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      translateTimestamps: [...prev.translateTimestamps, Date.now()],
    }));
  }, [setStore]);

  const refreshTimestamps = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      translateTimestamps: prev.translateTimestamps.filter(
        (timestamp) => Date.now() - timestamp < COOLDOWN_DURATION_MS
      ),
    }));
  }, [setStore]);

  return {
    translateCount,
    addTranslateTimestamp,
    refreshTimestamps,
  };
}
