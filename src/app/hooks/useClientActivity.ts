import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type ClientActivityEvent = {
  id: string;
  code_client: string;
  type_event: string;
  description: string;
  created_by: string;
  created: string;
};

type ActivityRecord = RecordModel & {
  code_client?: string;
  type_event?: string;
  description?: string;
  created_by?: string;
};

const toEvent = (record: ActivityRecord): ClientActivityEvent => ({
  id: record.id,
  code_client: record.code_client ?? '',
  type_event: record.type_event ?? 'system',
  description: record.description ?? '',
  created_by: record.created_by ?? '',
  created: record.created ?? '',
});

export function useClientActivity(codeClient?: string) {
  const [items, setItems] = useState<ClientActivityEvent[]>([]);
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
      const records = await pb.collection('client_activity_events').getFullList<ActivityRecord>({
        filter: `code_client = "${code}"`,
        sort: '-created',
      });
      setItems(records.map(toEvent));
    } catch (err) {
      setError('Impossible de charger l’activité client.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!codeClient) return;
    void fetchByCode(codeClient);
  }, [codeClient, fetchByCode]);

  const add = useCallback(async (data: Omit<ClientActivityEvent, 'id' | 'created'>) => {
    setError(null);
    try {
      const created = await pb.collection('client_activity_events').create<ActivityRecord>(data);
      setItems((prev) => [toEvent(created), ...prev]);
    } catch (err) {
      setError('Impossible d’ajouter un événement.');
    }
  }, []);

  return { items, loading, error, add, fetchByCode };
}
