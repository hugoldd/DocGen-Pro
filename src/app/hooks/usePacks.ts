import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Pack = {
  id: string;
  label: string;
  description: string;
  lignes: unknown[];
};

type PackRecord = RecordModel & {
  label?: string;
  description?: string;
  lignes?: unknown[];
};

const toPack = (record: PackRecord): Pack => ({
  id: record.id,
  label: record.label ?? '',
  description: record.description ?? '',
  lignes: Array.isArray(record.lignes) ? record.lignes : [],
});

export function usePacks() {
  const [items, setItems] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('packs').getFullList<PackRecord>({
        sort: 'label',
      });
      setItems(records.map(toPack));
    } catch (err) {
      setError('Impossible de charger les packs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = (data: Omit<Pack, 'id'>) => {
    void (async () => {
      try {
        await pb.collection('packs').create(data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de créer le pack.');
      }
    })();
  };

  const update = (id: string, data: Partial<Pack>) => {
    void (async () => {
      try {
        await pb.collection('packs').update(id, data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de mettre à jour le pack.');
      }
    })();
  };

  const remove = (id: string) => {
    void (async () => {
      try {
        await pb.collection('packs').delete(id);
        await fetchItems();
      } catch (err) {
        setError('Impossible de supprimer le pack.');
      }
    })();
  };

  return { items, loading, error, add, update, remove };
}
