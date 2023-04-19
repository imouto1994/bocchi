import React, { useState, useCallback, useEffect } from 'react';

export function Textarea({ value, onChange, ...otherProps }) {
  const [textareaValue, setTextareaValue] = useState(value);

  useEffect(() => {
    if (value !== textareaValue) {
      setTextareaValue(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextareaChange = useCallback(
    (e) => {
      setTextareaValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    },
    [onChange]
  );

  return (
    <textarea
      {...otherProps}
      value={textareaValue}
      onChange={handleTextareaChange}
    />
  );
}
