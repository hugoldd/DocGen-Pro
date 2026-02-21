import type React from 'react';

export function useInsertAtCursor(
  ref: React.RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (val: string) => void,
  variable: string
) {
  return (override?: string) => {
    const token = (override ?? variable).trim();
    const el = ref.current;
    if (!el || !token) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newVal = value.slice(0, start) + `{{${token}}}` + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length + 4;
      el.setSelectionRange(pos, pos);
    });
  };
}
