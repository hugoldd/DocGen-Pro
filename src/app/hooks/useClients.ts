import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Client = {
  id: string;
  code_client: string;
  nom: string;
  type_structure: string;
  ville: string;
  statut: string;
  data_salesforce: unknown;
};

type ClientRecord = RecordModel & {
  code_client?: string;
  nom?: string;
  type_structure?: string;
  ville?: string;
  statut?: string;
  data_salesforce?: unknown;
};

const toClient = (record: ClientRecord): Client => ({
  id: record.id,
  code_client: record.code_client ?? '',
  nom: record.nom ?? '',
  type_structure: record.type_structure ?? '',
  ville: record.ville ?? '',
  statut: record.statut ?? '',
  data_salesforce: record.data_salesforce ?? null,
});

export function useClients() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const existsByCode = useCallback(async (codeClient: string) => {
    if (!codeClient.trim()) return false;
    try {
      const records = await pb.collection('clients').getFullList<ClientRecord>({
        filter: `code_client = "${codeClient.trim()}"`,
        fields: 'id',
      });
      return records.length > 0;
    } catch (err) {
      return false;
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('clients').getFullList<ClientRecord>({
        sort: 'nom',
      });
      setItems(records.map(toClient));
    } catch (err) {
      setError('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = useCallback(async (data: Omit<Client, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('clients').create<ClientRecord>(data);
      setItems((prev) => [...prev, toClient(created)]);
      return created.id;
    } catch (err) {
      setError('Impossible de créer le client.');
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Client>) => {
    setError(null);
    try {
      const updated = await pb.collection('clients').update<ClientRecord>(id, data);
      const mapped = toClient(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour le client.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('clients').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer le client.');
    }
  }, []);

  return { items, loading, error, add, update, remove, refresh: fetchItems, existsByCode };
}
