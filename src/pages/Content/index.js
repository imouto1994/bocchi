import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { useSettings } from '../../storage/setting';
import { useChapters } from '../../storage/chapter';
import { useLog } from '../../storage/log';

const TRANSLATE_QUOTA = 25;

function getTextInputElement() {
  const textInputElement = document.querySelector(
    'textarea[placeholder="Send a message..."]'
  );
  if (textInputElement == null) {
    console.error('Text input element not found!');
  }
  return textInputElement;
}

function getSubmitButtonElement() {
  return getTextInputElement().nextElementSibling;
}

function getButton(text) {
  const buttons = document.evaluate(
    `//button[contains(., '${text}')]`,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  const thisButton = buttons.iterateNext();
  return thisButton;
}

function getLink(text) {
  const buttons = document.evaluate(
    `//a[contains(., '${text}')]`,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  const thisButton = buttons.iterateNext();
  return thisButton;
}

function getListItem(text) {
  const buttons = document.evaluate(
    `//li[contains(., '${text}')]`,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  const thisButton = buttons.iterateNext();
  return thisButton;
}

function getModelDropdownButton() {
  return getButton('Model');
}

function getNewChatButton() {
  return getLink('New chat');
}

function getPendingButton() {
  return getButton('Stop generating');
}

function getGPT4Option() {
  return getListItem('GPT-4');
}

function setNativeValue(element, value) {
  const { set: valueSetter } =
    Object.getOwnPropertyDescriptor(element, 'value') || {};
  const prototype = Object.getPrototypeOf(element);
  const { set: prototypeValueSetter } =
    Object.getOwnPropertyDescriptor(prototype, 'value') || {};

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    throw new Error('The given element does not have a value setter');
  }
}

function setText(inputElement, text) {
  setNativeValue(inputElement, text);
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
}

function waitFor(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function waitPendingButtonDisappear() {
  return new Promise((resolve) => {
    if (getPendingButton() == null) {
      resolve();
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getPendingButton() == null) {
        clearInterval(intervalId);
        resolve();
      }
    }, 1000);
  });
}

function waitPendingButtonAppear() {
  return new Promise((resolve) => {
    if (getPendingButton() != null) {
      resolve();
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getPendingButton() != null) {
        clearInterval(intervalId);
        resolve();
      }
    }, 1000);
  });
}

async function translateGroup(groupText) {
  await waitPendingButtonDisappear();
  console.log('SETTING TEXT...');
  setText(getTextInputElement(), groupText);
  await waitFor(3000);
  console.log('SUBMITTING...');
  getSubmitButtonElement().click();
  await waitPendingButtonAppear();
  await waitPendingButtonDisappear();
}

function useTranslate({
  initialPrompt,
  followUpPrompt,
  groupCharLimit,
  chapter,
  translateCount,
  addTranslateTimestamp,
  setChapterTranslated,
}) {
  const segmentedGroups = useMemo(() => {
    const lines = (chapter?.content || '')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const groups = [];
    let currentGroupLines = [];
    let currentLength = 0;
    for (const line of lines) {
      if (currentLength === 0 || currentLength + line.length < groupCharLimit) {
        currentGroupLines.push(line);
        currentLength += line.length;
        continue;
      }

      groups.push(currentGroupLines);
      currentGroupLines = [line];
      currentLength = line.length;
    }
    if (currentGroupLines.length > 0) {
      groups.push(currentGroupLines);
    }

    return groups.map((lines) => lines.join('\n'));
  }, [chapter, groupCharLimit]);

  const isTranslateEligible = useMemo(
    () => segmentedGroups.length + translateCount <= TRANSLATE_QUOTA,
    [translateCount, segmentedGroups.length]
  );

  const translate = useCallback(async () => {
    console.log(getNewChatButton());
    getNewChatButton().click();
    await waitFor(3000);
    getModelDropdownButton().click();
    await waitFor(1000);
    getGPT4Option().click();
    await waitFor(1000);
    for (let i = 0; i < segmentedGroups.length; i++) {
      const prompt = i === 0 ? initialPrompt : followUpPrompt;
      const groupText = `${prompt}\n${segmentedGroups[i]}`;
      await translateGroup(groupText);
      addTranslateTimestamp();
      await waitFor(3000);
    }
    setChapterTranslated(chapter?.id, true);
  }, [
    initialPrompt,
    followUpPrompt,
    segmentedGroups,
    chapter,
    addTranslateTimestamp,
    setChapterTranslated,
  ]);

  return {
    translate,
    minimumAttempts: segmentedGroups.length,
    isTranslateEligible,
  };
}

function Main() {
  const [trayEnabled, setTrayEnabled] = useState(false);
  const { translateCount, refreshTimestamps, addTranslateTimestamp } = useLog();
  const {
    initialPrompt,
    followUpPrompt,
    groupCharLimitStr,
    setInitialPrompt,
    setFollowUpPrompt,
    setGroupCharLimitStr,
  } = useSettings();
  const {
    chapterById,
    sortedChapterIds,
    mostRecentlyUpdatedChapterId,
    addNewChapter,
    deleteChapter,
    setChapterTitle,
    setChapterContent,
    setChapterTranslated,
  } = useChapters();
  const [selectedChapterId, setSelectedChapterId] = useState(
    mostRecentlyUpdatedChapterId
  );
  const groupCharLimit = useMemo(
    () => parseInt(groupCharLimitStr, 10),
    [groupCharLimitStr]
  );
  const selectedChapter = useMemo(
    () => chapterById[selectedChapterId],
    [chapterById, selectedChapterId]
  );

  const { translate, isTranslateEligible, minimumAttempts } = useTranslate({
    initialPrompt,
    followUpPrompt,
    groupCharLimit,
    chapter: selectedChapter,
    translateCount,
    addTranslateTimestamp,
    setChapterTranslated,
  });

  useEffect(() => {
    setSelectedChapterId(mostRecentlyUpdatedChapterId);
  }, [setSelectedChapterId, mostRecentlyUpdatedChapterId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshTimestamps();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshTimestamps]);

  const handleBocchiButtonClick = useCallback(() => {
    setTrayEnabled((flag) => !flag);
  }, [setTrayEnabled]);

  const handleInitialPromptInputChange = useCallback(
    (e) => {
      setInitialPrompt(e.target.value);
    },
    [setInitialPrompt]
  );
  const handleFollowUpPromptInputChange = useCallback(
    (e) => {
      setFollowUpPrompt(e.target.value);
    },
    [setFollowUpPrompt]
  );
  const handleGroupCharLimitInputChange = useCallback(
    (e) => {
      setGroupCharLimitStr(e.target.value);
    },
    [setGroupCharLimitStr]
  );
  const handleAddNewChapterButtonClick = useCallback(() => {
    addNewChapter();
  }, [addNewChapter]);
  const handleDeleteChapterButtonClick = useCallback(() => {
    deleteChapter(selectedChapterId);
  }, [deleteChapter, selectedChapterId]);
  const handleTranslateChapterButtonClick = useCallback(() => {
    translate();
  }, [translate]);
  const handleChapterSelectChange = useCallback(
    (e) => {
      setSelectedChapterId(e.target.value);
    },
    [setSelectedChapterId]
  );
  const handleChapterTitleInputChange = useCallback(
    (e) => {
      setChapterTitle(selectedChapterId, e.target.value);
    },
    [selectedChapterId, setChapterTitle]
  );
  const handleChapterContentInputChange = useCallback(
    (e) => {
      setChapterContent(selectedChapterId, e.target.value);
    },
    [selectedChapterId, setChapterContent]
  );

  return (
    <div className="bocchi">
      <button
        className="bocchi-floating-action-button"
        onClick={handleBocchiButtonClick}
      >
        T
      </button>
      {trayEnabled ? (
        <div className="bocchi-tray">
          <p>
            <strong>{`Translate Count: ${translateCount}`}</strong>
          </p>
          <p>Initial Prompt</p>
          <input
            className="bocchi-input"
            value={initialPrompt}
            onChange={handleInitialPromptInputChange}
          />
          <p>Follow-up Prompt</p>
          <input
            className="bocchi-input"
            value={followUpPrompt}
            onChange={handleFollowUpPromptInputChange}
          />
          <p>Group Char Limit</p>
          <input
            className="bocchi-input"
            type="number"
            value={groupCharLimitStr}
            onChange={handleGroupCharLimitInputChange}
          />
          <button
            className="bocchi-button bocchi-button-add"
            onClick={handleAddNewChapterButtonClick}
          >
            Add new chapter
          </button>
          {sortedChapterIds.length > 0 && selectedChapter != null ? (
            <>
              <p>Currently Selected</p>
              <select
                className="bocchi-select"
                value={selectedChapterId}
                onChange={handleChapterSelectChange}
              >
                {sortedChapterIds.map((id) => {
                  return (
                    <option value={id} key={id}>
                      {chapterById[id].title}
                    </option>
                  );
                })}
              </select>
              <p>{`Minimum Attempts: ${minimumAttempts}`}</p>
              <p>Title</p>
              <input
                className="bocchi-input"
                value={selectedChapter.title}
                onChange={handleChapterTitleInputChange}
              />
              <p>Content</p>
              <textarea
                className="bocchi-textarea"
                value={selectedChapter.content}
                onChange={handleChapterContentInputChange}
              />
              {!selectedChapter.translated && isTranslateEligible ? (
                <button
                  className="bocchi-button bocchi-button-translate"
                  onClick={handleTranslateChapterButtonClick}
                >
                  Translate Chapter
                </button>
              ) : !isTranslateEligible ? (
                <button className="bocchi-button bocchi-button-disabled">
                  Not enough quota
                </button>
              ) : (
                <button className="bocchi-button bocchi-button-disabled">
                  Translated
                </button>
              )}
              <button
                className="bocchi-button bocchi-button-remove"
                onClick={handleDeleteChapterButtonClick}
              >
                Delete chapter
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const app = document.createElement('div');
app.id = 'bocchi-root';
document.body.appendChild(app);
ReactDOM.render(<Main />, app);
