import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { Input } from './Input';
import { Textarea } from './Textarea';
import {
  fetchAllConversations,
  fetchMostRecentConversation,
  fetchConversationContent,
  patchConversationTitle,
} from './modules/api';
import { useSettings } from '../../storage/setting';
import { useChapters } from '../../storage/chapter';
import { useLog } from '../../storage/log';
import { getOrdinalNumberString } from '../../utils/string';

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

function getButtonWithClass(text, className) {
  const buttons = document.evaluate(
    `//button[contains(., '${text}') and contains(@class, '${className}')]`,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  const thisButton = buttons.iterateNext();
  return thisButton;
}

function getButtonWithoutClass(text, className) {
  const buttons = document.evaluate(
    `//button[contains(., '${text}') and not(contains(@class, '${className}'))]`,
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

function getShowMoreButton() {
  return getButton('Show more');
}

function getUseDefaultModelButton() {
  return getButton('Use default model');
}

function getTryAgainButton() {
  return getButton('Try again');
}

function getPrimaryRegenerateButton() {
  return getButtonWithClass('Regenerate response', 'btn-primary');
}

function getNormalRegenerateButton() {
  return getButtonWithoutClass('Regenerate response', 'btn-primary');
}

function getPendingButton() {
  return getButton('Stop generating');
}

function getGPT4Option() {
  return getListItem('GPT-4');
}

function parseEntries(conversationContent) {
  const { mapping } = conversationContent;
  const entries = Object.values(mapping);
  const rootEntry = entries.find((entry) => entry.parent == null);
  let officialEntries = [];
  function dfs(entry, currentPath) {
    currentPath.push(entry);
    if (entry.children.length === 0) {
      if (
        officialEntries.length < currentPath.length ||
        (officialEntries.length === currentPath.length &&
          entry.message &&
          entry.message.end_turn)
      ) {
        officialEntries = [...currentPath];
      }
    } else {
      for (const childEntryId of entry.children) {
        dfs(mapping[childEntryId], currentPath);
      }
    }
    currentPath.pop();
  }
  dfs(rootEntry, ['']);

  return officialEntries
    .filter(
      (entry) => entry.message && entry.message.author.role === 'assistant'
    )
    .map((entry) => entry.message.content.parts.join('\n\n\n'));
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

function waitUseDefaultModelButtonAppear() {
  return new Promise((resolve) => {
    if (getUseDefaultModelButton() != null) {
      resolve('Use default model');
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getUseDefaultModelButton() != null) {
        clearInterval(intervalId);
        resolve('Use default model');
      }
    }, 1000);
  });
}

function waitTryAgainButtonAppear() {
  return new Promise((resolve) => {
    if (getTryAgainButton() != null) {
      resolve('Try again');
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getTryAgainButton() != null) {
        clearInterval(intervalId);
        resolve('Try again');
      }
    }, 1000);
  });
}

function waitNormalRegenerateButtonAppear() {
  return new Promise((resolve) => {
    if (getNormalRegenerateButton() != null) {
      resolve('Normal Regenerate');
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getNormalRegenerateButton() != null) {
        clearInterval(intervalId);
        resolve('Normal Regenerate');
      }
    }, 1000);
  });
}

function waitPrimaryRegenerateButtonAppear() {
  return new Promise((resolve) => {
    if (getPrimaryRegenerateButton() != null) {
      resolve('Primary Regenerate');
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getPrimaryRegenerateButton() != null) {
        clearInterval(intervalId);
        resolve('Primary Regenerate');
      }
    }, 1000);
  });
}

function waitPendingButtonAppear() {
  return new Promise((resolve) => {
    if (getPendingButton() != null) {
      resolve('Pending');
      return;
    }
    let intervalId;
    intervalId = setInterval(() => {
      if (getPendingButton() != null) {
        clearInterval(intervalId);
        resolve('Pending');
      }
    }, 1000);
  });
}

async function translateGroup(groupText) {
  await waitPendingButtonDisappear();
  setText(getTextInputElement(), groupText);
  await waitFor(3000);
  getSubmitButtonElement().click();
  while (true) {
    await waitFor(5000);
    const raceResult = await Promise.race([
      waitNormalRegenerateButtonAppear(),
      waitUseDefaultModelButtonAppear(),
      waitPrimaryRegenerateButtonAppear(),
    ]);
    // Generated message is being sent
    if (raceResult === 'Normal Regenerate') {
      break;
    }
    // Message could not be generated
    else if (raceResult === 'Primary Regenerate') {
      // Wait for 3 mins before trying again
      await waitFor(180000);
      getPrimaryRegenerateButton().click();
    }
    // Quota limit is met. We will need to wait for cooldown
    else {
      await waitTryAgainButtonAppear();
      // Wait for 5 mins after cooldown finishes before trying again
      await waitFor(300000);
      getTryAgainButton().click();
    }
  }
}

function useTranslate({
  initialPrompt,
  followUpPrompt,
  groupCharLimit,
  addTranslateTimestamp,
  setChapterTranslated,
  setChapterUuid,
  setStatus,
}) {
  const segment = useCallback(
    (chapter) => {
      if (chapter == null) {
        return [];
      }
      const lines = (chapter.content || '')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const groups = [];
      let currentGroupLines = [];
      let currentLength = 0;
      for (const line of lines) {
        if (
          currentLength === 0 ||
          currentLength + line.length < groupCharLimit
        ) {
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
    },
    [groupCharLimit]
  );

  const translate = useCallback(
    async (chapter) => {
      if (chapter == null) {
        return;
      }
      if (chapter.translated) {
        return;
      }

      const segmentedGroups = segment(chapter);
      let segmentStartIndex = 0;
      if (!chapter.uuid) {
        setStatus(`Opening new chat session for chapter '${chapter.title}'...`);
        getNewChatButton().click();
        await waitFor(3000);
        getModelDropdownButton().click();
        await waitFor(1000);
        getGPT4Option().click();
        await waitFor(1000);
      } else {
        setStatus(
          `Finding existing chat session for chapter '${chapter.title}'...`
        );
        while (getShowMoreButton() != null) {
          getShowMoreButton().click();
          await waitFor(5000);
        }
        const chapterLinkButton = getLink(chapter.title);
        chapterLinkButton.click();
        await waitFor(3000);
        const conversationContent = await fetchConversationContent(
          chapter.uuid
        );
        const parsedConversationEntries = parseEntries(conversationContent);
        segmentStartIndex = parsedConversationEntries.length;
      }

      for (let i = segmentStartIndex; i < segmentedGroups.length; i++) {
        setStatus(
          `Translating segment (${i + 1} / ${
            segmentedGroups.length
          }) for chapter '${chapter.title}'...`
        );
        const isInitial = i === 0;
        const prompt = isInitial ? initialPrompt : followUpPrompt;
        const groupText = `${prompt.replace(
          '{segmentNumber}',
          getOrdinalNumberString(i + 1)
        )}\n${segmentedGroups[i]}`;
        await translateGroup(groupText);
        if (isInitial && chapter.uuid == null) {
          const mostRecentConversation = await fetchMostRecentConversation();
          setChapterUuid(chapter.id, mostRecentConversation.id);
          await patchConversationTitle(
            mostRecentConversation.id,
            chapter.title
          );
        }
        addTranslateTimestamp();
        await waitFor(3000);
      }
      setChapterTranslated(chapter.id, true);
      setStatus(null);
    },
    [
      initialPrompt,
      followUpPrompt,
      addTranslateTimestamp,
      setChapterTranslated,
      segment,
      setChapterUuid,
      setStatus,
    ]
  );

  return {
    translate,
    segment,
  };
}

function Main() {
  const [trayEnabled, setTrayEnabled] = useState(false);
  const [status, setStatus] = useState(null);
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
    deleteAllChapters,
    setChapterTitle,
    setChapterContent,
    setChapterTranslated,
    setChapterUuid,
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

  const { translate, segment } = useTranslate({
    initialPrompt,
    followUpPrompt,
    groupCharLimit,
    addTranslateTimestamp,
    setChapterTranslated,
    setChapterUuid,
    setStatus,
  });

  const selectedChapterSegmentedGroups = useMemo(() => {
    return segment(selectedChapter);
  }, [segment, selectedChapter]);

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

  // Handler for clicking floating action button to toggle tray
  const handleBocchiButtonClick = useCallback(() => {
    setTrayEnabled((flag) => !flag);
  }, [setTrayEnabled]);

  // Handler for text change of 'Initial Prompt' input
  const handleInitialPromptInputChange = useCallback(
    (e) => {
      setInitialPrompt(e.target.value);
    },
    [setInitialPrompt]
  );

  // Handler for text change of 'Follow-up Prompt' input
  const handleFollowUpPromptInputChange = useCallback(
    (e) => {
      setFollowUpPrompt(e.target.value);
    },
    [setFollowUpPrompt]
  );

  // Handler for number change of the character limit of each segment group
  const handleGroupCharLimitInputChange = useCallback(
    (e) => {
      setGroupCharLimitStr(e.target.value);
    },
    [setGroupCharLimitStr]
  );

  // Handler for clicking button to start translation queue
  const handleTranslateQueueButtonClick = useCallback(async () => {
    setTrayEnabled(false);
    try {
      for (const chapterId of sortedChapterIds) {
        const chapter = chapterById[chapterId];
        await translate(chapter);
      }
    } catch (err) {
      console.log('[bocchi] UNEXPECTED ERROR', err);
      alert('Something went wrong! :(');
      setStatus(null);
    }
  }, [sortedChapterIds, chapterById, translate]);

  // Handler for clicking button to add a new chapter
  const handleAddNewChapterButtonClick = useCallback(() => {
    addNewChapter();
  }, [addNewChapter]);

  // Handler for clicking button to export all existing conversations
  const handleExportAllButtonClick = useCallback(async () => {
    const conversations = await fetchAllConversations();
    for (const conversation of conversations) {
      const conversationContent = await fetchConversationContent(
        conversation.id
      );
      const parsedConversationEntries = parseEntries(conversationContent);
      const parsedConversationContent =
        parsedConversationEntries.join('\n\n\n');
      // Create element with <a> tag
      const link = document.createElement('a');

      // Create a blog object with the file content which you want to add to the file
      const file = new Blob([parsedConversationContent], {
        type: 'text/plain',
      });

      // Add file content in the object URL
      link.href = URL.createObjectURL(file);

      // Add file name
      link.download = `${conversation.title} - ${conversation.id}.txt`;

      // Add click event to <a> tag to save file.
      link.click();
      URL.revokeObjectURL(link.href);
      await waitFor(2000);
    }
  }, []);

  // Handler for clicking button to import chapters from local TXT files
  const handleImportButtonClick = useCallback(async () => {
    const fileHandles = await window.showOpenFilePicker({
      multiple: true,
      types: [
        {
          description: 'Text',
          accept: {
            'text/plain': ['.txt'],
          },
        },
      ],
      excludeAcceptAllOption: true,
    });
    for (const fileHandle of fileHandles) {
      const file = await fileHandle.getFile();
      const content = await file.text();
      addNewChapter({
        title: file.name,
        content,
      });
      await waitFor(1000);
    }
  }, [addNewChapter]);

  // Handler for clicking button to delete all chapters
  const handleDeleteAllButtonClick = useCallback(() => {
    deleteAllChapters();
  }, [deleteAllChapters]);

  // Handler for clicking button to delete currently selected chapter
  const handleDeleteChapterButtonClick = useCallback(() => {
    deleteChapter(selectedChapterId);
  }, [deleteChapter, selectedChapterId]);

  // Handler for clicking button to translate currently selected chapter
  const handleTranslateChapterButtonClick = useCallback(async () => {
    setTrayEnabled(false);
    try {
      await translate(selectedChapter);
    } catch (err) {
      console.log('[bocchi] UNEXPECTED ERROR', err);
      alert('Something went wrong! :(');
      setStatus(null);
    }
  }, [translate, selectedChapter]);

  // Handler for changing the currently selected chapter
  const handleChapterSelectChange = useCallback(
    (e) => {
      setSelectedChapterId(e.target.value);
    },
    [setSelectedChapterId]
  );

  // Handler for changing the title of currently selected chapter
  const handleChapterTitleInputChange = useCallback(
    (e) => {
      setChapterTitle(selectedChapterId, e.target.value);
    },
    [selectedChapterId, setChapterTitle]
  );

  // Handler for changing the uuid of currently selected chapter
  const handleChapterUuidInputChange = useCallback(
    (e) => {
      setChapterUuid(selectedChapterId, e.target.value);
    },
    [selectedChapterId, setChapterUuid]
  );

  // Handler for changing the content of currently selected chapter
  const handleChapterContentInputChange = useCallback(
    (e) => {
      setChapterContent(selectedChapterId, e.target.value);
    },
    [selectedChapterId, setChapterContent]
  );

  return (
    <div className="bocchi">
      <button
        className={
          status == null
            ? 'bocchi-floating-action-button-circular'
            : 'bocchi-floating-action-button-status'
        }
        onClick={handleBocchiButtonClick}
      >
        {status == null ? 'T' : status}
      </button>
      {trayEnabled ? (
        <div className="bocchi-tray">
          <div className="bocchi-tray-column">
            <p>
              <strong>{`Translate Count: ${translateCount}`}</strong>
            </p>
            <p>Initial Prompt</p>
            <Textarea
              className="bocchi-textarea"
              value={initialPrompt}
              onChange={handleInitialPromptInputChange}
              rows={5}
            />
            <p>Follow-up Prompt</p>
            <Textarea
              className="bocchi-textarea"
              value={followUpPrompt}
              onChange={handleFollowUpPromptInputChange}
              rows={5}
            />
            <p>Group Char Limit</p>
            <Input
              className="bocchi-input"
              type="number"
              value={groupCharLimitStr}
              onChange={handleGroupCharLimitInputChange}
            />
            <button
              className="bocchi-button bocchi-button-primary"
              onClick={handleTranslateQueueButtonClick}
            >
              Start translate queue
            </button>
            <button
              className="bocchi-button bocchi-button-secondary"
              onClick={handleAddNewChapterButtonClick}
            >
              Add new chapter
            </button>
            <button
              className="bocchi-button bocchi-button-secondary"
              onClick={handleExportAllButtonClick}
            >
              Export All
            </button>
            <button
              className="bocchi-button bocchi-button-secondary"
              onClick={handleImportButtonClick}
            >
              Import
            </button>
            <button
              className="bocchi-button bocchi-button-error"
              onClick={handleDeleteAllButtonClick}
            >
              Delete All
            </button>
          </div>
          <div className="bocchi-tray-column">
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
                <p>{`Minimum Attempts: ${selectedChapterSegmentedGroups.length}`}</p>
                <br />
                <p>UUID</p>
                <Input
                  className="bocchi-input"
                  value={selectedChapter.uuid}
                  onChange={handleChapterUuidInputChange}
                />
                <p>Title</p>
                <Input
                  className="bocchi-input"
                  value={selectedChapter.title}
                  onChange={handleChapterTitleInputChange}
                />
                <p>Content</p>
                <Textarea
                  className="bocchi-textarea"
                  value={selectedChapter.content}
                  onChange={handleChapterContentInputChange}
                  rows={10}
                />
                {!selectedChapter.translated ? (
                  <button
                    className="bocchi-button bocchi-button-primary"
                    onClick={handleTranslateChapterButtonClick}
                  >
                    Translate Chapter
                  </button>
                ) : (
                  <button className="bocchi-button bocchi-button-disabled">
                    Translated
                  </button>
                )}
                <button
                  className="bocchi-button bocchi-button-error"
                  onClick={handleDeleteChapterButtonClick}
                >
                  Delete chapter
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const app = document.createElement('div');
app.id = 'bocchi-root';
document.body.appendChild(app);
ReactDOM.render(<Main />, app);
