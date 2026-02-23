import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';

export type ClientFinanceInvoice = {
  id: string;
  code_client: string;
  montant: number;
  date: string;
  statut: string;
};

export type ClientFinancePayment = {
  id: string;
  code_client: string;
  montant: number;
  date: string;
};

export type ClientCommande = {
  id: string;
  code_client: string;
  statut: string;
  total: number;
  code_projet: string;
};

type InvoiceRecord = RecordModel & {
  code_client?: string;
  montant?: number;
  date?: string;
  statut?: string;
};

type PaymentRecord = RecordModel & {
  code_client?: string;
  montant?: number;
  date?: string;
};

type CommandeRecord = RecordModel & {
  code_client?: string;
  statut?: string;
  montant_total?: number;
  code_projet?: string;
};

const toInvoice = (record: InvoiceRecord): ClientFinanceInvoice => ({
  id: record.id,
  code_client: record.code_client ?? '',
  montant: record.montant ?? 0,
  date: record.date ?? '',
  statut: record.statut ?? '',
});

const toPayment = (record: PaymentRecord): ClientFinancePayment => ({
  id: record.id,
  code_client: record.code_client ?? '',
  montant: record.montant ?? 0,
  date: record.date ?? '',
});

const toCommande = (record: CommandeRecord): ClientCommande => ({
  id: record.id,
  code_client: record.code_client ?? '',
  statut: record.statut ?? '',
  total: record.montant_total ?? 0,
  code_projet: record.code_projet ?? '',
});

export function useClientFinance(codeClient?: string) {
  const [invoices, setInvoices] = useState<ClientFinanceInvoice[]>([]);
  const [payments, setPayments] = useState<ClientFinancePayment[]>([]);
  const [commandes, setCommandes] = useState<ClientCommande[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByCode = useCallback(async (code: string) => {
    if (!code) {
      setInvoices([]);
      setPayments([]);
      setCommandes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [inv, pay, cmd] = await Promise.all([
        pb.collection('client_finance_invoices').getFullList<InvoiceRecord>({
          filter: `code_client = \"${code}\"`,
          sort: '-created',
        }),
        pb.collection('client_finance_payments').getFullList<PaymentRecord>({
          filter: `code_client = \"${code}\"`,
          sort: '-created',
        }),
        pb.collection('commandes').getFullList<CommandeRecord>({
          filter: `code_client = \"${code}\"`,
          sort: '-created',
        }),
      ]);
      setInvoices(inv.map(toInvoice));
      setPayments(pay.map(toPayment));
      setCommandes(cmd.map(toCommande));
    } catch (err) {
      setError('Impossible de charger les données financières.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!codeClient) return;
    void fetchByCode(codeClient);
  }, [codeClient, fetchByCode]);

  return { invoices, payments, commandes, loading, error, fetchByCode };
}
