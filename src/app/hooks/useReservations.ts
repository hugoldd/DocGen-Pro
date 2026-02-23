import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type Reservation = {
  id: string;
  code_projet: string;
  prestation_projet_id: string;
  consultant_id: string;
  date_debut: string;
  nb_jours: number;
  mode: string;
  avec_trajet_aller: boolean;
  avec_trajet_retour: boolean;
  commentaire: string;
};

type ReservationRecord = RecordModel & {
  code_projet?: string;
  prestation_projet_id?: string;
  consultant_id?: string;
  date_debut?: string;
  nb_jours?: number;
  mode?: string;
  avec_trajet_aller?: boolean;
  avec_trajet_retour?: boolean;
  commentaire?: string;
};

const toReservation = (record: ReservationRecord): Reservation => ({
  id: record.id,
  code_projet: record.code_projet ?? '',
  prestation_projet_id: record.prestation_projet_id ?? '',
  consultant_id: record.consultant_id ?? '',
  date_debut: record.date_debut ?? '',
  nb_jours: record.nb_jours ?? 0,
  mode: record.mode ?? 'sur_site',
  avec_trajet_aller: record.avec_trajet_aller ?? false,
  avec_trajet_retour: record.avec_trajet_retour ?? false,
  commentaire: record.commentaire ?? '',
});

export function useReservations() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('reservations').getFullList<ReservationRecord>({
        sort: '-created',
      });
      setItems(records.map(toReservation));
    } catch (err) {
      setError('Impossible de charger les réservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const add = useCallback(async (data: Omit<Reservation, 'id'>) => {
    setError(null);
    try {
      const created = await pb.collection('reservations').create<ReservationRecord>(data);
      setItems((prev) => [toReservation(created), ...prev]);
    } catch (err) {
      setError('Impossible de créer la réservation.');
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Reservation>) => {
    setError(null);
    try {
      const updated = await pb.collection('reservations').update<ReservationRecord>(id, data);
      const mapped = toReservation(updated);
      setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)));
    } catch (err) {
      setError('Impossible de mettre à jour la réservation.');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await pb.collection('reservations').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Impossible de supprimer la réservation.');
    }
  }, []);

  return { items, loading, error, add, update, remove, refresh: fetchItems };
}
