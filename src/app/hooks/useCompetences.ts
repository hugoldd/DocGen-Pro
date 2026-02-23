import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Competence = {
  id: string;
  label: string;
  categorie: string;
};

type CompetenceRecord = RecordModel & {
  label?: string;
  categorie?: string;
};

const toCompetence = (record: CompetenceRecord): Competence => ({
  id: record.id,
  label: record.label ?? '',
  categorie: record.categorie ?? '',
});

export function useCompetences() {
  const [items, setItems] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('competences').getFullList<CompetenceRecord>({
        sort: 'label',
      });
      setItems(records.map(toCompetence));
    } catch (err) {
      setError('Impossible de charger les compétences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = (data: Omit<Competence, 'id'>) => {
    void (async () => {
      try {
        await pb.collection('competences').create(data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de créer la compétence.');
      }
    })();
  };

  const update = (id: string, data: Partial<Competence>) => {
    void (async () => {
      try {
        await pb.collection('competences').update(id, data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de mettre à jour la compétence.');
      }
    })();
  };

  const remove = (id: string) => {
    void (async () => {
      try {
        await pb.collection('competences').delete(id);
        await fetchItems();
      } catch (err) {
        setError('Impossible de supprimer la compétence.');
      }
    })();
  };

  return { items, loading, error, add, update, remove };
}
