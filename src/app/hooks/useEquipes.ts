import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Equipe = {
  id: string;
  label: string;
  responsable_id: string;
  membres: unknown[];
};

type EquipeRecord = RecordModel & {
  label?: string;
  responsable_id?: string;
  membres?: unknown[];
};

const toEquipe = (record: EquipeRecord): Equipe => ({
  id: record.id,
  label: record.label ?? '',
  responsable_id: record.responsable_id ?? '',
  membres: Array.isArray(record.membres) ? record.membres : [],
});

export function useEquipes() {
  const [items, setItems] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('equipes').getFullList<EquipeRecord>({
        sort: 'label',
      });
      setItems(records.map(toEquipe));
    } catch (err) {
      setError('Impossible de charger les équipes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = (data: Omit<Equipe, 'id'>) => {
    void (async () => {
      try {
        await pb.collection('equipes').create(data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de créer l’équipe.');
      }
    })();
  };

  const update = (id: string, data: Partial<Equipe>) => {
    void (async () => {
      try {
        await pb.collection('equipes').update(id, data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de mettre à jour l’équipe.');
      }
    })();
  };

  const remove = (id: string) => {
    void (async () => {
      try {
        await pb.collection('equipes').delete(id);
        await fetchItems();
      } catch (err) {
        setError('Impossible de supprimer l’équipe.');
      }
    })();
  };

  return { items, loading, error, add, update, remove };
}
