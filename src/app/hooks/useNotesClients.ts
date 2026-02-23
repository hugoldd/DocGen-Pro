import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type NoteClient = {
  id: string;
  code_client: string;
  contenu: string;
  tags: string[];
};

type NoteRecord = RecordModel & {
  code_client?: string;
  contenu?: string;
  tags?: string[];
};

const toNote = (record: NoteRecord): NoteClient => ({
  id: record.id,
  code_client: record.code_client ?? '',
  contenu: record.contenu ?? '',
  tags: Array.isArray(record.tags) ? record.tags : [],
});

export function useNotesClients(codeClient?: string) {
  const [items, setItems] = useState<NoteClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByCode = useCallback(async (code: string) => {
    if (!code) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('notes_clients').getFullList<NoteRecord>({
        filter: `code_client = "${code}"`,
        sort: '-created',
      });
      setItems(records.map(toNote));
    } catch (err) {
      setError('Impossible de charger les notes clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!codeClient) return;
    void fetchByCode(codeClient);
  }, [codeClient, fetchByCode]);

  const add = useCallback(async (data: Omit<NoteClient, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('notes_clients').create<NoteRecord>(data);
      setItems((prev) => [toNote(created), ...prev]);
    } catch (err) {
      setError('Impossible de créer la note client.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<NoteClient>) => {
    setError(null);
    try {
      const updated = await pb.collection('notes_clients').update<NoteRecord>(id, data);
      const mapped = toNote(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour la note client.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('notes_clients').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer la note client.');
    }
  }, []);

  return { items, loading, error, add, update, remove, fetchByCode };
}
