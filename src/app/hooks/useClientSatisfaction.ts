import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type ClientSatisfactionEvaluation = {
  id: string;
  code_client: string;
  score: number;
  periode: string;
  commentaire: string;
};

type SatisfactionRecord = RecordModel & {
  code_client?: string;
  score?: number;
  periode?: string;
  commentaire?: string;
};

const toEvaluation = (record: SatisfactionRecord): ClientSatisfactionEvaluation => ({
  id: record.id,
  code_client: record.code_client ?? '',
  score: record.score ?? 0,
  periode: record.periode ?? '',
  commentaire: record.commentaire ?? '',
});

export function useClientSatisfaction(codeClient?: string) {
  const [items, setItems] = useState<ClientSatisfactionEvaluation[]>([]);
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
      const records = await pb.collection('client_satisfaction_evaluations').getFullList<SatisfactionRecord>({
        filter: `code_client = "${code}"`,
        sort: '-created',
      });
      setItems(records.map(toEvaluation));
    } catch (err) {
      setError('Impossible de charger la satisfaction client.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!codeClient) return;
    void fetchByCode(codeClient);
  }, [codeClient, fetchByCode]);

  const add = useCallback(async (data: Omit<ClientSatisfactionEvaluation, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('client_satisfaction_evaluations').create<SatisfactionRecord>(data);
      setItems((prev) => [toEvaluation(created), ...prev]);
    } catch (err) {
      setError('Impossible d’ajouter l’évaluation.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<ClientSatisfactionEvaluation>) => {
    setError(null);
    try {
      const updated = await pb.collection('client_satisfaction_evaluations').update<SatisfactionRecord>(id, data);
      const mapped = toEvaluation(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour l’évaluation.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('client_satisfaction_evaluations').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer l’évaluation.');
    }
  }, []);

  return { items, loading, error, add, update, remove, fetchByCode };
}
