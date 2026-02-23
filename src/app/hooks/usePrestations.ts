import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Prestation = {
  id: string;
  label: string;
  type: string;
  tarif_presentiel: number;
  tarif_distanciel: number;
};

type PrestationRecord = RecordModel & {
  label?: string;
  type?: string;
  tarif_presentiel?: number;
  tarif_distanciel?: number;
};

const toPrestation = (record: PrestationRecord): Prestation => ({
  id: record.id,
  label: record.label ?? '',
  type: record.type ?? '',
  tarif_presentiel: record.tarif_presentiel ?? 0,
  tarif_distanciel: record.tarif_distanciel ?? 0,
});

export function usePrestations() {
  const [items, setItems] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('prestations').getFullList<PrestationRecord>({
        sort: 'label',
      });
      setItems(records.map(toPrestation));
    } catch (err) {
      setError('Impossible de charger les prestations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = (data: Omit<Prestation, 'id'>) => {
    void (async () => {
      try {
        await pb.collection('prestations').create(data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de créer la prestation.');
      }
    })();
  };

  const update = (id: string, data: Partial<Prestation>) => {
    void (async () => {
      try {
        await pb.collection('prestations').update(id, data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de mettre à jour la prestation.');
      }
    })();
  };

  const remove = (id: string) => {
    void (async () => {
      try {
        await pb.collection('prestations').delete(id);
        await fetchItems();
      } catch (err) {
        setError('Impossible de supprimer la prestation.');
      }
    })();
  };

  return { items, loading, error, add, update, remove };
}
