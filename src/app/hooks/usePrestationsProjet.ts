import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type PrestationProjet = {
  id: string;
  code_projet: string;
  prestation_id: string;
  label: string;
  jours_prevus: number;
  jours_supplementaires: number;
  annule: boolean;
  forfait: boolean;
  mode_defaut: string;
};

type PrestationProjetRecord = RecordModel & {
  code_projet?: string;
  prestation_id?: string;
  label?: string;
  jours_prevus?: number;
  jours_supplementaires?: number;
  annule?: boolean;
  forfait?: boolean;
  mode_defaut?: string;
};

const toPrestationProjet = (record: PrestationProjetRecord): PrestationProjet => ({
  id: record.id,
  code_projet: record.code_projet ?? '',
  prestation_id: record.prestation_id ?? '',
  label: record.label ?? '',
  jours_prevus: record.jours_prevus ?? 0,
  jours_supplementaires: record.jours_supplementaires ?? 0,
  annule: record.annule ?? false,
  forfait: record.forfait ?? false,
  mode_defaut: record.mode_defaut ?? 'sur_site',
});

export function usePrestationsProjet() {
  const [items, setItems] = useState<PrestationProjet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('prestations_projet').getFullList<PrestationProjetRecord>({
        sort: 'code_projet',
      });
      setItems(records.map(toPrestationProjet));
    } catch (err) {
      setError('Impossible de charger les prestations projet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = useCallback(async (data: Omit<PrestationProjet, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('prestations_projet').create<PrestationProjetRecord>(data);
      setItems((prev) => [...prev, toPrestationProjet(created)]);
    } catch (err) {
      setError('Impossible de créer la prestation projet.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<PrestationProjet>) => {
    setError(null);
    try {
      const updated = await pb.collection('prestations_projet').update<PrestationProjetRecord>(id, data);
      const mapped = toPrestationProjet(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour la prestation projet.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('prestations_projet').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer la prestation projet.');
    }
  }, []);

  return { items, loading, error, add, update, remove, refresh: fetchItems };
}
