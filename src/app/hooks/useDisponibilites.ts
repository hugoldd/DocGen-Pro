import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Disponibilite = {
  id: string;
  consultant_id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  commentaire: string;
};

type DisponibiliteRecord = RecordModel & {
  consultant_id?: string;
  type?: string;
  date_debut?: string;
  date_fin?: string;
  commentaire?: string;
};

const toDisponibilite = (record: DisponibiliteRecord): Disponibilite => ({
  id: record.id,
  consultant_id: record.consultant_id ?? '',
  type: record.type ?? 'intercontrat',
  date_debut: record.date_debut ?? '',
  date_fin: record.date_fin ?? '',
  commentaire: record.commentaire ?? '',
});

export function useDisponibilites() {
  const [items, setItems] = useState<Disponibilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('disponibilites').getFullList<DisponibiliteRecord>({
        sort: '-created',
      });
      setItems(records.map(toDisponibilite));
    } catch (err) {
      setError('Impossible de charger les disponibilités.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = useCallback(async (data: Omit<Disponibilite, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('disponibilites').create<DisponibiliteRecord>(data);
      setItems((prev) => [toDisponibilite(created), ...prev]);
    } catch (err) {
      setError('Impossible de créer la disponibilité.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Disponibilite>) => {
    setError(null);
    try {
      const updated = await pb.collection('disponibilites').update<DisponibiliteRecord>(id, data);
      const mapped = toDisponibilite(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour la disponibilité.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('disponibilites').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer la disponibilité.');
    }
  }, []);

  return { items, loading, error, add, update, remove, refresh: fetchItems };
}
