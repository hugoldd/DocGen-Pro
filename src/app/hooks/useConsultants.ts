import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Consultant = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  tjm: number;
  statut: string;
  type_contrat: string;
  adresse: string;
  ville: string;
  code_postal: string;
  jours_travailles: unknown[];
  competences: unknown[];
};

type ConsultantRecord = RecordModel & {
  nom?: string;
  prenom?: string;
  email?: string;
  tjm?: number;
  statut?: string;
  type_contrat?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  jours_travailles?: unknown[];
  competences?: unknown[];
};

const toConsultant = (record: ConsultantRecord): Consultant => ({
  id: record.id,
  nom: record.nom ?? '',
  prenom: record.prenom ?? '',
  email: record.email ?? '',
  tjm: record.tjm ?? 0,
  statut: record.statut ?? '',
  type_contrat: record.type_contrat ?? '',
  adresse: record.adresse ?? '',
  ville: record.ville ?? '',
  code_postal: record.code_postal ?? '',
  jours_travailles: Array.isArray(record.jours_travailles) ? record.jours_travailles : [],
  competences: Array.isArray(record.competences) ? record.competences : [],
});

export function useConsultants() {
  const [items, setItems] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('consultants').getFullList<ConsultantRecord>({
        sort: 'nom',
      });
      setItems(records.map(toConsultant));
    } catch (err) {
      setError('Impossible de charger les consultants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = (data: Omit<Consultant, 'id'>) => {
    void (async () => {
      try {
        await pb.collection('consultants').create(data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de créer le consultant.');
      }
    })();
  };

  const update = (id: string, data: Partial<Consultant>) => {
    void (async () => {
      try {
        await pb.collection('consultants').update(id, data);
        await fetchItems();
      } catch (err) {
        setError('Impossible de mettre à jour le consultant.');
      }
    })();
  };

  const remove = (id: string) => {
    void (async () => {
      try {
        await pb.collection('consultants').delete(id);
        await fetchItems();
      } catch (err) {
        setError('Impossible de supprimer le consultant.');
      }
    })();
  };

  return { items, loading, error, add, update, remove };
}
