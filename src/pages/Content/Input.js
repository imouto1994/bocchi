import React, { useState, useCallback, useEffect } from 'react';

export function Input({ value, onChange, ...otherProps }) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue, setInputValue]);

  const handleInputChange = useCallback(
    (e) => {
      setInputValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    },
    [setInputValue, onChange]
  );

  return (
    <input {...otherProps} value={inputValue} onChange={handleInputChange} />
  );
}
