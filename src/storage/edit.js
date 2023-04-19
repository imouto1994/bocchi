import { useMemo, useCallback } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';

const EDIT_KEY = 'edit';
const INITIAL_VALUE = {
  entriesJSON: JSON.stringify({}),
};

const useEditStore = createChromeStorageStateHookLocal(EDIT_KEY, INITIAL_VALUE);

export function useEdit() {
  const [{ entriesJSON }, setStore] = useEditStore();

  const entryById = useMemo(() => JSON.parse(entriesJSON), [entriesJSON]);
  const sortedEntryIds = useMemo(() => {
    const ids = Object.keys(entryById);
    const sortedIds = ids.sort((s1, s2) => (s1 > s2) - (s1 < s2));
    return sortedIds;
  }, [entryById]);
  const mostRecentlyUpdatedEntryId = useMemo(() => {
    const entries = Object.values(entryById);

    if (entries.length === 0) {
      return null;
    }

    const sortedEntries = entries.sort(
      (c1, c2) => (c1.updatedAt < c2.updatedAt) - (c1.updatedAt > c2.updatedAt)
    );
    return sortedEntries[0].id;
  }, [entryById]);

  const addNewEntry = useCallback(
    (id, { originalLines = [] } = {}) => {
      setStore((prev) => {
        const prevEntryById = JSON.parse(prev.entriesJSON);
        const newEntry = {
          id,
          originalLines,
          translatedLines: [],
          editLines: [],
          updatedAt: Date.now(),
        };
        const nextEntryById = {
          ...prevEntryById,
          [id]: newEntry,
        };

        return {
          ...prev,
          entriesJSON: JSON.stringify(nextEntryById),
        };
      });
    },
    [setStore]
  );
  const deleteAllEntries = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      entriesJSON: JSON.stringify({}),
    }));
  }, [setStore]);
  const deleteEntry = useCallback(
    (entryId) => {
      setStore((prev) => {
        const prevEntryById = JSON.parse(prev.entriesJSON);
        const newEntryById = { ...prevEntryById };
        delete newEntryById[entryId];

        return {
          ...prev,
          entriesJSON: JSON.stringify(newEntryById),
        };
      });
    },
    [setStore]
  );
  const setEntryTranslatedLines = useCallback(
    (id, translatedLines) => {
      setStore((prev) => {
        const prevEntryById = JSON.parse(prev.entriesJSON);
        const entry = prevEntryById[id];
        if (entry == null) {
          return prev;
        }
        const newEntry = {
          ...entry,
          translatedLines,
          editLines: [...translatedLines],
          updatedAt: Date.now(),
        };
        const newEntryById = {
          ...prevEntryById,
          [newEntry.id]: newEntry,
        };

        return {
          ...prev,
          entriesJSON: JSON.stringify(newEntryById),
        };
      });
    },
    [setStore]
  );
  const setEntryEditLine = useCallback(
    (id, index, content) => {
      setStore((prev) => {
        const prevEntryById = JSON.parse(prev.entriesJSON);
        const entry = prevEntryById[id];
        if (entry == null) {
          return prev;
        }
        if (index >= entry.editLines.length) {
          return prev;
        }
        const newEditLines = [...entry.editLines];
        newEditLines[index] = content;
        const newEntry = {
          ...entry,
          editLines: newEditLines,
          updatedAt: Date.now(),
        };
        const newEntryById = {
          ...prevEntryById,
          [newEntry.id]: newEntry,
        };

        return {
          ...prev,
          entriesJSON: JSON.stringify(newEntryById),
        };
      });
    },
    [setStore]
  );

  return {
    entryById,
    sortedEntryIds,
    mostRecentlyUpdatedEntryId,
    addNewEntry,
    deleteEntry,
    deleteAllEntries,
    setEntryTranslatedLines,
    setEntryEditLine,
  };
}
