import { useMemo, useCallback } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';

import { getRandomString } from '../utils/string';

const CHAPTERS_KEY = 'chapters';
const INITIAL_VALUE = {
  chaptersJSON: JSON.stringify({}),
};

const useChaptersStore = createChromeStorageStateHookLocal(
  CHAPTERS_KEY,
  INITIAL_VALUE
);

export function useChapters() {
  const [{ chaptersJSON }, setStore] = useChaptersStore();

  const chapterById = useMemo(() => JSON.parse(chaptersJSON), [chaptersJSON]);
  const sortedChapterIds = useMemo(() => {
    const chapters = Object.values(chapterById);
    const sortedChapters = chapters.sort((c1, c2) => {
      const titleDiff = (c1.title > c2.title) - (c1.title < c2.title);
      if (titleDiff === 0) {
        return (c1.updatedAt > c2.updatedAt) - (c1.updatedAt < c2.updatedAt);
      }
      return titleDiff;
    });
    return sortedChapters.map((c) => c.id);
  }, [chapterById]);
  const mostRecentlyUpdatedChapterId = useMemo(() => {
    const chapters = Object.values(chapterById);

    if (chapters.length === 0) {
      return null;
    }

    const sortedChapters = chapters.sort(
      (c1, c2) => (c1.updatedAt < c2.updatedAt) - (c1.updatedAt > c2.updatedAt)
    );
    return sortedChapters[0].id;
  }, [chapterById]);

  const addNewChapter = useCallback(
    ({ title, content } = {}) => {
      setStore((prev) => {
        const prevChapterById = JSON.parse(prev.chaptersJSON);
        const id = getRandomString(12);
        const newChapter = {
          id,
          uuid: null,
          title: `${title || 'New Chapter'} [${id}]`,
          content: content || '',
          translated: false,
          updatedAt: Date.now(),
        };
        const newChapterById = {
          ...prevChapterById,
          [id]: newChapter,
        };

        return {
          ...prev,
          chaptersJSON: JSON.stringify(newChapterById),
        };
      });
    },
    [setStore]
  );
  const deleteAllChapters = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      chaptersJSON: JSON.stringify({}),
    }));
  }, [setStore]);
  const deleteChapter = useCallback(
    (chapterId) => {
      setStore((prev) => {
        const prevChapterById = JSON.parse(prev.chaptersJSON);
        const newChapterById = { ...prevChapterById };
        delete newChapterById[chapterId];

        return {
          ...prev,
          chaptersJSON: JSON.stringify(newChapterById),
        };
      });
    },
    [setStore]
  );
  const setChapterTitle = useCallback(
    (chapterId, newTitle) => {
      setStore((prev) => {
        const prevChapterById = JSON.parse(prev.chaptersJSON);
        const chapter = prevChapterById[chapterId];
        if (chapter == null) {
          return prev;
        }
        const newChapter = {
          ...chapter,
          title: newTitle,
          updatedAt: Date.now(),
        };
        const newChapterById = {
          ...prevChapterById,
          [newChapter.id]: newChapter,
        };

        return {
          ...prev,
          chaptersJSON: JSON.stringify(newChapterById),
        };
      });
    },
    [setStore]
  );
  const setChapterContent = useCallback(
    (chapterId, newContent) => {
      setStore((prev) => {
        const prevChapterById = JSON.parse(prev.chaptersJSON);
        const chapter = prevChapterById[chapterId];
        if (chapter == null) {
          return prev;
        }
        const newChapter = {
          ...chapter,
          content: newContent,
          updatedAt: Date.now(),
        };
        const newChapterById = {
          ...prevChapterById,
          [newChapter.id]: newChapter,
        };

        return {
          ...prev,
          chaptersJSON: JSON.stringify(newChapterById),
        };
      });
    },
    [setStore]
  );
  const setChapterTranslated = useCallback(
    (chapterId, newTranslatedFlag) => {
      setStore((prev) => {
        const prevChapterById = JSON.parse(prev.chaptersJSON);
        const chapter = prevChapterById[chapterId];
        if (chapter == null) {
          return prev;
        }
        const newChapter = {
          ...chapter,
          translated: newTranslatedFlag,
        };
        const newChapterById = {
          ...prevChapterById,
          [newChapter.id]: newChapter,
        };

        return {
          ...prev,
          chaptersJSON: JSON.stringify(newChapterById),
        };
      });
    },
    [setStore]
  );
  const setChapterUuid = useCallback(
    (chapterId, newUuid) => {
      setStore((prev) => {
        const prevChapterById = JSON.parse(prev.chaptersJSON);
        const chapter = prevChapterById[chapterId];
        if (chapter == null) {
          return prev;
        }
        const newChapter = {
          ...chapter,
          uuid: newUuid,
        };
        const newChapterById = {
          ...prevChapterById,
          [newChapter.id]: newChapter,
        };

        return {
          ...prev,
          chaptersJSON: JSON.stringify(newChapterById),
        };
      });
    },
    [setStore]
  );

  return {
    chapterById,
    sortedChapterIds,
    mostRecentlyUpdatedChapterId,
    addNewChapter,
    deleteChapter,
    deleteAllChapters,
    setChapterTitle,
    setChapterContent,
    setChapterTranslated,
    setChapterUuid,
  };
}
