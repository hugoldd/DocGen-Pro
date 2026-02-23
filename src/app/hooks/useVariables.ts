import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

type VariableRecord = RecordModel & {
  key?: string;
  label?: string;
};

type VariableEntry = {
  id: string;
  key: string;
  label: string;
};

const toEntry = (record: VariableRecord): VariableEntry => ({
  id: record.id,
  key: record.key ?? '',
  label: record.label ?? '',
});

export function useVariables() {
  const [entries, setEntries] = useState<VariableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVariables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('variables').getFullList<VariableRecord>({
        sort: 'key',
      });
      setEntries(records.map(toEntry));
    } catch (err) {
      setError('Impossible de charger les variables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVariables();
  }, [fetchVariables]);

  const variables = useMemo(() => {
    return entries.reduce<Record<string, string>>((acc, entry) => {
      if (entry.key) acc[entry.key] = entry.label ?? '';
      return acc;
    }, {});
  }, [entries]);

  const addVariable = (key: string, label: string) => {
    const existing = entries.find((entry) => entry.key === key);
    if (existing) {
      updateVariable(key, label);
      return;
    }

    const optimistic: VariableEntry = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key,
      label,
    };
    setEntries((prev) => [...prev, optimistic]);

    void (async () => {
      try {
        const created = await pb.collection('variables').create<VariableRecord>({ key, label });
        const mapped = toEntry(created);
        setEntries((prev) => prev.map((v) => (v.id === optimistic.id ? mapped : v)));
      } catch (err) {
        setError('Impossible de créer la variable.');
        setEntries((prev) => prev.filter((v) => v.id !== optimistic.id));
      }
    })();
  };

  const updateVariable = (key: string, label: string) => {
    const existing = entries.find((entry) => entry.key === key);
    if (!existing) {
      addVariable(key, label);
      return;
    }

    setEntries((prev) => prev.map((entry) => (entry.key === key ? { ...entry, label } : entry)));

    void (async () => {
      try {
        await pb.collection('variables').update(existing.id, { label });
      } catch (err) {
        setError('Impossible de mettre à jour la variable.');
        void fetchVariables();
      }
    })();
  };

  const deleteVariable = (key: string) => {
    const existing = entries.find((entry) => entry.key === key);
    if (!existing) return;

    const snapshot = entries;
    setEntries((prev) => prev.filter((entry) => entry.key !== key));

    void (async () => {
      try {
        await pb.collection('variables').delete(existing.id);
      } catch (err) {
        setError('Impossible de supprimer la variable.');
        setEntries(snapshot);
      }
    })();
  };

  const reset = () => {
    setEntries([]);
    void (async () => {
      try {
        const records = await pb.collection('variables').getFullList<VariableRecord>({
          fields: 'id',
        });
        await Promise.all(records.map((record) => pb.collection('variables').delete(record.id)));
      } catch (err) {
        setError('Impossible de réinitialiser les variables.');
      }
    })();
  };

  return {
    variables,
    addVariable,
    updateVariable,
    deleteVariable,
    loading,
    error,
    refresh: fetchVariables,
    reset,
  };
}
