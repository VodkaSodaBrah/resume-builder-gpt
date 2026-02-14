import React, { useState, useRef, useEffect, createElement } from 'react';

interface EditableFieldProps {
  tag: 'h1' | 'p' | 'span' | 'li';
  value: string;
  className?: string;
  multiline?: boolean;
  onSave: (newValue: string) => void;
  disabled?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  tag,
  value,
  className = '',
  multiline = false,
  onSave,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
      return;
    }
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    }
  };

  if (isEditing) {
    const inputClassName = `${className} bg-white border border-blue-400 rounded px-1 outline-none focus:ring-1 focus:ring-blue-400`;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${inputClassName} w-full min-h-[60px] resize-y`}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />
    );
  }

  const readClassName = `${className} cursor-text hover:outline-dashed hover:outline-1 hover:outline-blue-300 rounded`;

  return createElement(
    tag,
    {
      className: readClassName,
      onClick: handleClick,
    },
    value || '\u00A0' // Non-breaking space for empty values so element remains clickable
  );
};
