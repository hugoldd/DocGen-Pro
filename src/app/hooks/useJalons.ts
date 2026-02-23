import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Jalon = {
  id: string;
  code_projet: string;
  type: string;
  label: string;
  date_prevue: string;
  date_reelle: string;
  statut: string;
};

type JalonRecord = RecordModel & {
  code_projet?: string;
  type?: string;
  label?: string;
  date_prevue?: string;
  date_reelle?: string;
  statut?: string;
};

const toJalon = (record: JalonRecord): Jalon => ({
  id: record.id,
  code_projet: record.code_projet ?? '',
  type: record.type ?? 'jalon',
  label: record.label ?? '',
  date_prevue: record.date_prevue ?? '',
  date_reelle: record.date_reelle ?? '',
  statut: record.statut ?? 'en_attente',
});

export function useJalons() {
  const [items, setItems] = useState<Jalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('jalons').getFullList<JalonRecord>({
        sort: '-created',
      });
      setItems(records.map(toJalon));
    } catch (err) {
      setError('Impossible de charger les jalons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = useCallback(async (data: Omit<Jalon, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('jalons').create<JalonRecord>(data);
      setItems((prev) => [toJalon(created), ...prev]);
    } catch (err) {
      setError('Impossible de créer le jalon.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Jalon>) => {
    setError(null);
    try {
      const updated = await pb.collection('jalons').update<JalonRecord>(id, data);
      const mapped = toJalon(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour le jalon.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('jalons').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer le jalon.');
    }
  }, []);

  return { items, loading, error, add, update, remove, refresh: fetchItems };
}
