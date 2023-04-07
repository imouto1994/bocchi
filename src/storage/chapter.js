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

  const addNewChapter = useCallback(() => {
    const id = getRandomString(12);
    const newChapter = {
      id,
      title: 'New Chapter',
      content: '',
      translated: false,
      updatedAt: Date.now(),
    };
    const newChapterById = {
      ...chapterById,
      [id]: newChapter,
    };
    setStore((prev) => ({
      ...prev,
      chaptersJSON: JSON.stringify(newChapterById),
    }));
  }, [chapterById, setStore]);

  const deleteChapter = useCallback(
    (chapterId) => {
      const newChapterById = { ...chapterById };
      delete newChapterById[chapterId];
      setStore((prev) => ({
        ...prev,
        chaptersJSON: JSON.stringify(newChapterById),
      }));
    },
    [chapterById, setStore]
  );
  const setChapterTitle = useCallback(
    (chapterId, newTitle) => {
      const chapter = chapterById[chapterId];
      if (chapter == null) {
        return;
      }
      const newChapter = {
        ...chapter,
        title: newTitle,
        updatedAt: Date.now(),
      };
      const newChapterById = {
        ...chapterById,
        [newChapter.id]: newChapter,
      };
      setStore((prev) => ({
        ...prev,
        chaptersJSON: JSON.stringify(newChapterById),
      }));
    },
    [chapterById, setStore]
  );
  const setChapterContent = useCallback(
    (chapterId, newContent) => {
      const chapter = chapterById[chapterId];
      if (chapter == null) {
        return;
      }
      const newChapter = {
        ...chapter,
        content: newContent,
        updatedAt: Date.now(),
      };
      const newChapterById = {
        ...chapterById,
        [newChapter.id]: newChapter,
      };
      setStore((prev) => ({
        ...prev,
        chaptersJSON: JSON.stringify(newChapterById),
      }));
    },
    [chapterById, setStore]
  );
  const setChapterTranslated = useCallback(
    (chapterId, newTranslatedFlag) => {
      const chapter = chapterById[chapterId];
      if (chapter == null) {
        return;
      }
      const newChapter = {
        ...chapter,
        translated: newTranslatedFlag,
      };
      const newChapterById = {
        ...chapterById,
        [newChapter.id]: newChapter,
      };
      setStore((prev) => ({
        ...prev,
        chaptersJSON: JSON.stringify(newChapterById),
      }));
    },
    [chapterById, setStore]
  );

  return {
    chapterById,
    sortedChapterIds,
    mostRecentlyUpdatedChapterId,
    addNewChapter,
    deleteChapter,
    setChapterTitle,
    setChapterContent,
    setChapterTranslated,
  };
}
