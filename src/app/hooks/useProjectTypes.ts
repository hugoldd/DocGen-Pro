import { useCallback, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '../../lib/pb';
import type { ProjectType } from '../types';

type ProjectTypeRecord = RecordModel & {
  name?: string;
  code?: string;
  description?: string;
  tags?: string[];
  options?: ProjectType['options'];
  questions?: ProjectType['questions'];
  document_rules?: ProjectType['documentRules'];
  email_rules?: ProjectType['emailRules'];
  email_schedule?: ProjectType['emailSchedule'];
  document_schedule?: ProjectType['documentSchedule'];
  question_schedule?: ProjectType['questionSchedule'];
  pack_ids?: string[];
  status?: 'draft' | 'published';
};

const toProjectType = (record: ProjectTypeRecord): ProjectType => ({
  id: record.id,
  name: record.name ?? '',
  code: record.code ?? '',
  description: record.description ?? '',
  tags: Array.isArray(record.tags) ? record.tags : [],
  options: Array.isArray(record.options) ? record.options : [],
  questions: Array.isArray(record.questions) ? record.questions : [],
  documentRules: Array.isArray(record.document_rules) ? record.document_rules : [],
  emailRules: Array.isArray(record.email_rules) ? record.email_rules : [],
  emailSchedule: Array.isArray(record.email_schedule) ? record.email_schedule : [],
  documentSchedule: Array.isArray(record.document_schedule) ? record.document_schedule : [],
  questionSchedule: Array.isArray(record.question_schedule) ? record.question_schedule : [],
  pack_ids: Array.isArray(record.pack_ids) ? record.pack_ids : [],
  status: record.status === 'published' ? 'published' : 'draft',
});

const buildProjectTypePayload = (projectType: Partial<ProjectType>) => {
  const payload: Record<string, unknown> = {};

  if (projectType.name !== undefined) payload.name = projectType.name;
  if (projectType.code !== undefined) payload.code = projectType.code;
  if (projectType.description !== undefined) payload.description = projectType.description;
  if (projectType.tags !== undefined) payload.tags = projectType.tags;
  if (projectType.options !== undefined) payload.options = projectType.options;
  if (projectType.questions !== undefined) payload.questions = projectType.questions;
  if (projectType.documentRules !== undefined) payload.document_rules = projectType.documentRules;
  if (projectType.emailRules !== undefined) payload.email_rules = projectType.emailRules;
  if (projectType.emailSchedule !== undefined) payload.email_schedule = projectType.emailSchedule;
  if (projectType.documentSchedule !== undefined) {
    payload.document_schedule = projectType.documentSchedule;
  }
  if (projectType.questionSchedule !== undefined) {
    payload.question_schedule = projectType.questionSchedule;
  }
  if (projectType.pack_ids !== undefined) payload.pack_ids = projectType.pack_ids;
  if (projectType.status !== undefined) payload.status = projectType.status;

  return payload;
};

export function useProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('project_types').getFullList<ProjectTypeRecord>({
        sort: '-created',
      });
      setProjectTypes(records.map(toProjectType));
    } catch (err) {
      setError('Impossible de charger les types de projet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjectTypes();
  }, [fetchProjectTypes]);

  const addProjectType = (projectType: Omit<ProjectType, 'id'>) => {
    const optimistic: ProjectType = {
      ...projectType,
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setProjectTypes((prev) => [optimistic, ...prev]);

    void (async () => {
      try {
        const created = await pb
          .collection('project_types')
          .create<ProjectTypeRecord>(buildProjectTypePayload(projectType));
        const mapped = toProjectType(created);
        setProjectTypes((prev) => prev.map((p) => (p.id === optimistic.id ? mapped : p)));
        await fetchProjectTypes();
      } catch (err) {
        setError('Impossible de créer le type de projet.');
        setProjectTypes((prev) => prev.filter((p) => p.id !== optimistic.id));
      }
    })();
  };

  const updateProjectType = (id: string, updates: Partial<ProjectType>) => {
    setProjectTypes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    void (async () => {
      try {
        await pb.collection('project_types').update(id, buildProjectTypePayload(updates));
      } catch (err) {
        setError('Impossible de mettre à jour le type de projet.');
        void fetchProjectTypes();
      }
    })();
  };

  const deleteProjectType = (id: string) => {
    const snapshot = projectTypes;
    setProjectTypes((prev) => prev.filter((p) => p.id !== id));

    void (async () => {
      try {
        await pb.collection('project_types').delete(id);
      } catch (err) {
        setError('Impossible de supprimer le type de projet.');
        setProjectTypes(snapshot);
      }
    })();
  };

  const publishProjectType = (id: string) => {
    updateProjectType(id, { status: 'published' });
  };

  const reset = () => {
    setProjectTypes([]);
    void (async () => {
      try {
        const records = await pb.collection('project_types').getFullList<ProjectTypeRecord>({
          fields: 'id',
        });
        await Promise.all(
          records.map((record) => pb.collection('project_types').delete(record.id))
        );
      } catch (err) {
        setError('Impossible de réinitialiser les types de projet.');
      }
    })();
  };

  return {
    projectTypes,
    addProjectType,
    updateProjectType,
    deleteProjectType,
    publishProjectType,
    loading,
    error,
    refresh: fetchProjectTypes,
    reset,
  };
}
