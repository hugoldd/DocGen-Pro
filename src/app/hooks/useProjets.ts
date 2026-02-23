import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';
import type { GenerationRecord } from '../types';

type ProjetRecord = RecordModel & {
  code_client?: string;
  code_projet?: string;
  client_name?: string;
  project_type_id?: string;
  status?: string;
  generation_status?: 'success' | 'error';
  deployment_date?: string;
  selected_option_ids?: string[];
  answers?: Record<string, string>;
  files_generated?: GenerationRecord['filesGenerated'];
  scheduled_emails?: GenerationRecord['scheduledEmails'];
  scheduled_documents?: GenerationRecord['scheduledDocuments'];
  scheduled_questions?: GenerationRecord['scheduledQuestions'];
  sent_email_ids?: string[];
  sent_document_ids?: string[];
  sent_question_ids?: string[];
  contacts?: GenerationRecord['contacts'];
};

type AddRecordPayload = Omit<GenerationRecord, 'id' | 'date'> & { codeProjet?: string };

type ProjetItem = GenerationRecord & { codeProjet?: string };

const toRecord = (record: ProjetRecord): ProjetItem => ({
  id: record.id,
  date: record.created ?? new Date().toISOString(),
  clientName: record.client_name ?? '',
  clientNumber: record.code_client ?? '',
  projectTypeId: record.project_type_id ?? '',
  filesGenerated: Array.isArray(record.files_generated) ? record.files_generated : [],
  deploymentDate: record.deployment_date ?? undefined,
  scheduledEmails: Array.isArray(record.scheduled_emails) ? record.scheduled_emails : undefined,
  scheduledDocuments: Array.isArray(record.scheduled_documents)
    ? record.scheduled_documents
    : undefined,
  scheduledQuestions: Array.isArray(record.scheduled_questions)
    ? record.scheduled_questions
    : undefined,
  sentEmailIds: Array.isArray(record.sent_email_ids) ? record.sent_email_ids : undefined,
  sentDocumentIds: Array.isArray(record.sent_document_ids)
    ? record.sent_document_ids
    : undefined,
  sentQuestionIds: Array.isArray(record.sent_question_ids)
    ? record.sent_question_ids
    : undefined,
  contacts: Array.isArray(record.contacts) ? record.contacts : undefined,
  answers: record.answers ?? undefined,
  selectedOptionIds: Array.isArray(record.selected_option_ids)
    ? record.selected_option_ids
    : undefined,
  status: record.generation_status === 'success' ? 'success' : 'error',
  codeProjet: record.code_projet ?? undefined,
});

const buildRecordPayload = (record: AddRecordPayload, codeProjet: string) => ({
  code_client: record.clientNumber,
  code_projet: codeProjet,
  client_name: record.clientName,
  project_type_id: record.projectTypeId,
  status: record.status,
  generation_status: record.status,
  deployment_date: record.deploymentDate ?? null,
  selected_option_ids: record.selectedOptionIds ?? [],
  answers: record.answers ?? {},
  files_generated: record.filesGenerated ?? [],
  scheduled_emails: record.scheduledEmails ?? [],
  scheduled_documents: record.scheduledDocuments ?? [],
  scheduled_questions: record.scheduledQuestions ?? [],
  sent_email_ids: record.sentEmailIds ?? [],
  sent_document_ids: record.sentDocumentIds ?? [],
  sent_question_ids: record.sentQuestionIds ?? [],
  contacts: record.contacts ?? [],
});

export function useProjets() {
  const [records, setRecords] = useState<ProjetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await pb.collection('projets').getFullList<ProjetRecord>({
        sort: '-created',
      });
      setRecords(items.map(toRecord));
    } catch (err) {
      setError('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const generateCodeProjet = useCallback(async (codeClient: string) => {
    const trimmed = codeClient.trim();
    if (!trimmed) return `P-${Date.now()}`;
    const list = await pb.collection('projets').getList(1, 1, {
      filter: `code_client = "${trimmed}"`,
      fields: 'id',
    });
    const seq = list.totalItems + 1;
    return `${trimmed}-P${String(seq).padStart(3, '0')}`;
  }, []);

  const dedupeByCodeProjet = useCallback((items: ProjetItem[]) => {
    const map = new Map<string, ProjetItem>();
    items.forEach((item) => {
      const key = item.codeProjet || item.id;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, item);
        return;
      }
      if (new Date(item.date).getTime() > new Date(prev.date).getTime()) {
        map.set(key, item);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  const getByClient = useCallback(
    (codeClient: string) => {
      if (!codeClient) return [];
      return dedupeByCodeProjet(records.filter((record) => record.clientNumber === codeClient));
    },
    [records, dedupeByCodeProjet]
  );

  const getDeduped = useCallback(() => dedupeByCodeProjet(records), [records, dedupeByCodeProjet]);

  const upsert = useCallback(async (codeClient: string, codeProjet: string | undefined, data: AddRecordPayload) => {
    try {
      const resolvedCodeProjet = codeProjet || await generateCodeProjet(codeClient);
      const existing = codeProjet
        ? await pb.collection('projets').getFullList<ProjetRecord>({
            filter: `code_client = "${codeClient}" && code_projet = "${resolvedCodeProjet}"`,
            fields: 'id',
          })
        : [];

      if (existing.length > 0) {
        const updated = await pb
          .collection('projets')
          .update<ProjetRecord>(existing[0].id, buildRecordPayload(data, resolvedCodeProjet));
        const mapped = toRecord(updated);
        setRecords((prev) => {
          const has = prev.some((r) => r.id === mapped.id);
          if (has) return prev.map((r) => (r.id === mapped.id ? mapped : r));
          return [mapped, ...prev];
        });
        return mapped.id;
      }

      const created = await pb
        .collection('projets')
        .create<ProjetRecord>(buildRecordPayload(data, resolvedCodeProjet));
      const mapped = toRecord(created);
      setRecords((prev) => [mapped, ...prev]);
      return mapped.id;
    } catch (err) {
      setError('Impossible de créer le projet.');
      return null;
    }
  }, []);

  const addRecord = (record: AddRecordPayload) => {
    void (async () => {
      try {
        await upsert(record.clientNumber, undefined, record);
      } catch (err) {
        setError('Impossible de créer le projet.');
      }
    })();
  };

  const deleteRecord = (id: string) => {
    const snapshot = records;
    setRecords((prev) => prev.filter((record) => record.id !== id));

    void (async () => {
      try {
        await pb.collection('projets').delete(id);
      } catch (err) {
        setError('Impossible de supprimer le projet.');
        setRecords(snapshot);
      }
    })();
  };

  const updateRecordLocal = useCallback(
    (recordId: string, updater: (record: GenerationRecord) => GenerationRecord) => {
      setRecords((prev) => prev.map((record) => (record.id === recordId ? updater(record) : record)));
    },
    []
  );

  const updateRecordRemote = useCallback(async (recordId: string, payload: Record<string, unknown>) => {
    try {
      await pb.collection('projets').update(recordId, payload);
    } catch (err) {
      setError('Impossible de mettre à jour le projet.');
      void fetchRecords();
    }
  }, [fetchRecords]);

  const markEmailAsSent = (recordId: string, emailId: string) => {
    const current = recordsById.get(recordId)?.sentEmailIds || [];
    if (current.includes(emailId)) return;
    const updated = [...current, emailId];

    updateRecordLocal(recordId, (record) => ({
      ...record,
      sentEmailIds: updated,
    }));
    void updateRecordRemote(recordId, { sent_email_ids: updated });
  };

  const unmarkEmailAsSent = (recordId: string, emailId: string) => {
    const current = recordsById.get(recordId)?.sentEmailIds || [];
    const updated = current.filter((id) => id !== emailId);

    updateRecordLocal(recordId, (record) => ({
      ...record,
      sentEmailIds: updated,
    }));
    void updateRecordRemote(recordId, { sent_email_ids: updated });
  };

  const markDocumentAsSent = (recordId: string, documentId: string) => {
    const current = recordsById.get(recordId)?.sentDocumentIds || [];
    if (current.includes(documentId)) return;
    const updated = [...current, documentId];

    updateRecordLocal(recordId, (record) => ({
      ...record,
      sentDocumentIds: updated,
    }));
    void updateRecordRemote(recordId, { sent_document_ids: updated });
  };

  const unmarkDocumentAsSent = (recordId: string, documentId: string) => {
    const current = recordsById.get(recordId)?.sentDocumentIds || [];
    const updated = current.filter((id) => id !== documentId);

    updateRecordLocal(recordId, (record) => ({
      ...record,
      sentDocumentIds: updated,
    }));
    void updateRecordRemote(recordId, { sent_document_ids: updated });
  };

  const markQuestionAsSent = (recordId: string, questionId: string) => {
    const current = recordsById.get(recordId)?.sentQuestionIds || [];
    if (current.includes(questionId)) return;
    const updated = [...current, questionId];

    updateRecordLocal(recordId, (record) => ({
      ...record,
      sentQuestionIds: updated,
    }));
    void updateRecordRemote(recordId, { sent_question_ids: updated });
  };

  const unmarkQuestionAsSent = (recordId: string, questionId: string) => {
    const current = recordsById.get(recordId)?.sentQuestionIds || [];
    const updated = current.filter((id) => id !== questionId);

    updateRecordLocal(recordId, (record) => ({
      ...record,
      sentQuestionIds: updated,
    }));
    void updateRecordRemote(recordId, { sent_question_ids: updated });
  };

  const reset = () => {
    setRecords([]);
    void (async () => {
      try {
        const items = await pb.collection('projets').getFullList<ProjetRecord>({
          fields: 'id',
        });
        await Promise.all(items.map((record) => pb.collection('projets').delete(record.id)));
      } catch (err) {
        setError('Impossible de réinitialiser les projets.');
      }
    })();
  };

  const recordsById = useMemo(() => {
    return new Map(records.map((record) => [record.id, record]));
  }, [records]);

  return {
    records,
    addRecord,
    deleteRecord,
    markEmailAsSent,
    unmarkEmailAsSent,
    markDocumentAsSent,
    unmarkDocumentAsSent,
    markQuestionAsSent,
    unmarkQuestionAsSent,
    loading,
    error,
    refresh: fetchRecords,
    reset,
    recordsById,
    upsert,
    getByClient,
    getDeduped,
    generateCodeProjet,
  };
}
