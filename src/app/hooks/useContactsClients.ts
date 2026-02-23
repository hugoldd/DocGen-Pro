import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type ContactClient = {
  id: string;
  code_client: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
};

type ContactRecord = RecordModel & {
  code_client?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
};

const toContact = (record: ContactRecord): ContactClient => ({
  id: record.id,
  code_client: record.code_client ?? '',
  nom: record.nom ?? '',
  prenom: record.prenom ?? '',
  email: record.email ?? '',
  telephone: record.telephone ?? '',
  poste: record.poste ?? '',
});

export function useContactsClients(codeClient?: string) {
  const [items, setItems] = useState<ContactClient[]>([]);
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
      const records = await pb.collection('contacts_clients').getFullList<ContactRecord>({
        filter: `code_client = "${code}"`,
        sort: 'nom',
      });
      setItems(records.map(toContact));
    } catch (err) {
      setError('Impossible de charger les contacts clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!codeClient) return;
    void fetchByCode(codeClient);
  }, [codeClient, fetchByCode]);

  const add = useCallback(async (data: Omit<ContactClient, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('contacts_clients').create<ContactRecord>(data);
      setItems((prev) => [...prev, toContact(created)]);
    } catch (err) {
      setError('Impossible de créer le contact client.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<ContactClient>) => {
    setError(null);
    try {
      const updated = await pb.collection('contacts_clients').update<ContactRecord>(id, data);
      const mapped = toContact(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour le contact client.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('contacts_clients').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer le contact client.');
    }
  }, []);

  const replaceForCode = useCallback(async (code: string, contacts: Omit<ContactClient, 'id'>[]) => {
    if (!code) return;
    setError(null);
    setLoading(true);
    try {
      const existing = await pb.collection('contacts_clients').getFullList<ContactRecord>({
        filter: `code_client = "${code}"`,
        fields: 'id',
      });
      await Promise.all(existing.map((row) => pb.collection('contacts_clients').delete(row.id)));
      if (contacts.length > 0) {
        await Promise.all(
          contacts.map((contact) => pb.collection('contacts_clients').create(contact))
        );
      }
      await fetchByCode(code);
    } catch (err) {
      setError('Impossible de synchroniser les contacts clients.');
    } finally {
      setLoading(false);
    }
  }, [fetchByCode]);

  return { items, loading, error, add, update, remove, fetchByCode, replaceForCode };
}
