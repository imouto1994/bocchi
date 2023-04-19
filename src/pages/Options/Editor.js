import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Fragment,
} from 'react';

import { Input } from './Input';
import { Textarea } from './Textarea';
import { useEdit } from '../../storage/edit';

function waitFor(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function Editor() {
  const [status, setStatus] = useState(null);
  const [focusIndex, setFocusIndex] = useState(null);
  const {
    entryById,
    sortedEntryIds,
    mostRecentlyUpdatedEntryId,
    addNewEntry,
    setEntryTranslatedLines,
    setEntryEditLine,
    deleteAllEntries,
    deleteEntry,
  } = useEdit();
  const [selectedEntryId, setSelectedEntryId] = useState(
    mostRecentlyUpdatedEntryId
  );
  const selectedEntry = useMemo(
    () => entryById[selectedEntryId],
    [entryById, selectedEntryId]
  );

  useEffect(() => {
    setSelectedEntryId(mostRecentlyUpdatedEntryId);
    setFocusIndex(null);
  }, [setSelectedEntryId, mostRecentlyUpdatedEntryId]);

  // Handler for clicking button to import original lines of entries from local TXT files
  const handleImportOriginalButtonClick = useCallback(async () => {
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
      addNewEntry(file.name, {
        originalLines: content
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      });
      await waitFor(1000);
    }
  }, [addNewEntry]);

  // Handler for clicking button to import translated lines for existing entries from local TXT files
  const handleImportTranslatedButtonClick = useCallback(async () => {
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

      if (entryById[file.name] != null) {
        setEntryTranslatedLines(
          file.name,
          content
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        );
      }
      await waitFor(1000);
    }
  }, [setEntryTranslatedLines, entryById]);

  // Handler for clicking button to delete all entries
  const handleDeleteAllButtonClick = useCallback(() => {
    deleteAllEntries();
  }, [deleteAllEntries]);

  // Handler for clicking button to save currently selected entry
  const handleDeleteEntryButtonClick = useCallback(() => {
    deleteEntry(selectedEntryId);
  }, [deleteEntry, selectedEntryId]);

  // Handler for clicking button to delete currently selected entry
  const handleSaveEntryButtonClick = useCallback(() => {
    const content = selectedEntry.editLines.join('\n');
    // Create element with <a> tag
    const link = document.createElement('a');

    // Create a blog object with the file content which you want to add to the file
    const file = new Blob([content], {
      type: 'text/plain',
    });

    // Add file content in the object URL
    link.href = URL.createObjectURL(file);

    // Add file name
    link.download = selectedEntry.id;

    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
  }, [selectedEntry]);

  // Handler for changing the currently selected entry
  const handleEntrySelectChange = useCallback(
    (e) => {
      setSelectedEntryId(e.target.value);
      setFocusIndex(null);
    },
    [setSelectedEntryId]
  );

  return (
    <div className="bocchi">
      <div className="bocchi-nav">
        {sortedEntryIds.length > 0 && selectedEntry != null ? (
          <>
            <select
              className="bocchi-select"
              value={selectedEntryId}
              onChange={handleEntrySelectChange}
            >
              {sortedEntryIds.map((id) => {
                return (
                  <option value={id} key={id}>
                    {id}
                  </option>
                );
              })}
            </select>
            <button
              className="bocchi-button bocchi-button-primary"
              onClick={handleSaveEntryButtonClick}
            >
              Save
            </button>
          </>
        ) : null}
        <button
          className="bocchi-button bocchi-button-secondary"
          onClick={handleImportOriginalButtonClick}
        >
          Import Original
        </button>
        <button
          className="bocchi-button bocchi-button-secondary"
          onClick={handleImportTranslatedButtonClick}
        >
          Import Translated
        </button>
        {sortedEntryIds.length > 0 && selectedEntry != null ? (
          <button
            className="bocchi-button bocchi-button-error"
            onClick={handleDeleteEntryButtonClick}
          >
            Delete
          </button>
        ) : null}
        <button
          className="bocchi-button bocchi-button-error"
          onClick={handleDeleteAllButtonClick}
        >
          Delete All
        </button>
      </div>
      <div className="bocchi-body">
        {selectedEntry != null
          ? selectedEntry.editLines.map((_, index) => {
              const { translatedLines, editLines, originalLines } =
                selectedEntry;

              return (
                <div className="bocchi-row" key={`${selectedEntryId}_${index}`}>
                  <div
                    className={`bocchi-row-index ${
                      editLines[index] !== translatedLines[index]
                        ? 'bocchi-row-index-edited'
                        : ''
                    }`}
                  >
                    {index}
                  </div>
                  <div className="bocchi-row-content">
                    <div className="bocchi-column">
                      <Textarea
                        className={`bocchi-textarea ${
                          index === focusIndex ? 'bocchi-textarea-focused' : ''
                        }`}
                        value={editLines[index]}
                        onFocus={() => setFocusIndex(index)}
                        rows={index === focusIndex ? 5 : undefined}
                        onChange={(e) =>
                          setEntryEditLine(
                            selectedEntryId,
                            index,
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="bocchi-column">
                      <Textarea
                        className={`bocchi-textarea ${
                          index === focusIndex
                            ? 'bocchi-textarea-alt-focused'
                            : ''
                        }`}
                        value={originalLines[index]}
                        rows={index === focusIndex ? 5 : undefined}
                        disabled
                        tabIndex="-1"
                      />
                    </div>
                    <div className="bocchi-column">
                      <Textarea
                        className={`bocchi-textarea ${
                          index === focusIndex
                            ? 'bocchi-textarea-alt-focused'
                            : ''
                        }`}
                        value={translatedLines[index]}
                        rows={index === focusIndex ? 5 : undefined}
                        disabled
                        tabIndex="-1"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}

export default Editor;
