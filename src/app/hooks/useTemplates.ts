import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';
import type { Template, TemplateType } from '../types';

type TemplateRecord = RecordModel & {
  name?: string;
  type?: TemplateType;
  project_type_id?: string | null;
  content?: string;
  email_subject?: string;
  file_base64?: string;
  file_name?: string;
  variables?: string[];
  linked_template_ids?: string[];
  status?: 'draft' | 'published';
};

const toTemplate = (record: TemplateRecord): Template => ({
  id: record.id,
  name: record.name ?? '',
  type: record.type ?? 'DOCX',
  projectTypeId: record.project_type_id || null,
  content: record.content ?? '',
  emailSubject: record.email_subject ?? undefined,
  fileBase64: record.file_base64 ?? undefined,
  fileName: record.file_name ?? undefined,
  variables: Array.isArray(record.variables) ? record.variables : [],
  linkedTemplateIds: Array.isArray(record.linked_template_ids)
    ? record.linked_template_ids
    : [],
  status: record.status === 'published' ? 'published' : 'draft',
  updatedAt: record.updated ?? record.created ?? new Date().toISOString(),
});

const buildTemplatePayload = (template: Partial<Template>) => {
  const payload: Record<string, unknown> = {};

  if (template.name !== undefined) payload.name = template.name;
  if (template.type !== undefined) payload.type = template.type;
  if (template.projectTypeId !== undefined) payload.project_type_id = template.projectTypeId;
  if (template.content !== undefined) payload.content = template.content;
  if (template.emailSubject !== undefined) payload.email_subject = template.emailSubject;
  if (template.fileBase64 !== undefined) payload.file_base64 = template.fileBase64;
  if (template.fileName !== undefined) payload.file_name = template.fileName;
  if (template.variables !== undefined) payload.variables = template.variables;
  if (template.linkedTemplateIds !== undefined) {
    payload.linked_template_ids = template.linkedTemplateIds;
  }
  if (template.status !== undefined) payload.status = template.status;

  return payload;
};

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('templates').getFullList<TemplateRecord>({
        sort: '-updated',
      });
      setTemplates(records.map(toTemplate));
    } catch (err) {
      setError('Impossible de charger les templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = (template: Omit<Template, 'id' | 'updatedAt'>) => {
    const optimistic: Template = {
      ...template,
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [optimistic, ...prev]);

    void (async () => {
      try {
        const created = await pb
          .collection('templates')
          .create<TemplateRecord>(buildTemplatePayload(template));
        const mapped = toTemplate(created);
        setTemplates((prev) => prev.map((t) => (t.id === optimistic.id ? mapped : t)));
        await fetchTemplates();
      } catch (err) {
        setError('Impossible de créer le template.');
        setTemplates((prev) => prev.filter((t) => t.id !== optimistic.id));
      }
    })();
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    );

    void (async () => {
      try {
        await pb.collection('templates').update(id, buildTemplatePayload(updates));
      } catch (err) {
        setError('Impossible de mettre à jour le template.');
        void fetchTemplates();
      }
    })();
  };

  const deleteTemplate = (id: string) => {
    const snapshot = templates;
    setTemplates((prev) => prev.filter((t) => t.id !== id));

    void (async () => {
      try {
        await pb.collection('templates').delete(id);
      } catch (err) {
        setError('Impossible de supprimer le template.');
        setTemplates(snapshot);
      }
    })();
  };

  const duplicateTemplate = (id: string) => {
    const original = templates.find((t) => t.id === id);
    if (!original) return;

    const { id: _id, updatedAt: _updatedAt, ...payload } = original;
    addTemplate({
      ...payload,
      name: `${original.name} (copie)`,
      status: 'draft',
    });
  };

  const reset = () => {
    setTemplates([]);
    void (async () => {
      try {
        const records = await pb.collection('templates').getFullList<TemplateRecord>({
          fields: 'id',
        });
        await Promise.all(records.map((record) => pb.collection('templates').delete(record.id)));
      } catch (err) {
        setError('Impossible de réinitialiser les templates.');
      }
    })();
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    loading,
    error,
    refresh: fetchTemplates,
    reset,
  };
}
