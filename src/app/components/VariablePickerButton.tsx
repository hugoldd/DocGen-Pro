import React, { useMemo, useState } from 'react';
import { Braces, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type VariableEntry = { key: string; label: string };

export default function VariablePickerButton({
  insertAtCursor,
  className = '',
}: {
  insertAtCursor: (variable: string) => void;
  className?: string;
}) {
  const { variables } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const entries = useMemo<VariableEntry[]>(() => {
    return Object.entries(variables)
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [variables]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(
      (entry) =>
        entry.key.toLowerCase().includes(term) ||
        entry.label.toLowerCase().includes(term)
    );
  }, [entries, search]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors ${className}`}
        >
          <Braces className="w-4 h-4" />
          {'{ }'} Variable
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une variable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            autoFocus
          />
        </div>
        <div className="mt-3 max-h-64 overflow-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">
              Aucune variable trouvée.
            </div>
          ) : (
            filtered.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => {
                  insertAtCursor(entry.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <span className="font-mono text-xs text-indigo-500">{`{{${entry.key}}}`}</span>
                <span className="text-sm text-slate-700 truncate">{entry.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
