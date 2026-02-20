import React, { useMemo, useState } from 'react';
import { CalendarDays, CalendarOff, FileText, HelpCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';

type PlanningItemType = 'email' | 'document' | 'question';

type PlanningItem = {
  id: string;
  recordId: string;
  refId: string;
  type: PlanningItemType;
  date: string;
  label: string;
  description: string;
  projectTypeId: string;
  projectTypeName: string;
  clientName: string;
  clientNumber: string;
  templateName?: string;
  recipient?: string;
  outputPattern?: string;
  questionLabel?: string;
  requiresAction?: boolean;
  isSent: boolean;
};

type WeekGroup = {
  key: string;
  start: Date;
  end: Date;
  items: PlanningItem[];
};

type PeriodFilter = 'all' | 'month' | 'next30' | 'past';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const formatWeekRange = (start: Date, end: Date) =>
  `Semaine du ${start.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })} au ${end.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getPeriodLabel = (filter: PeriodFilter) => {
  if (filter === 'all') return 'Tous';
  if (filter === 'month') return 'Ce mois-ci';
  if (filter === 'next30') return '30 prochains jours';
  return 'Passés';
};

export default function PlanningPage() {
  const navigate = useNavigate();
  const {
    projectTypes,
    getRecords,
    markEmailAsSent,
    unmarkEmailAsSent,
    markDocumentAsSent,
    unmarkDocumentAsSent,
    markQuestionAsSent,
    unmarkQuestionAsSent,
  } = useApp();
  const records = getRecords();
  const [projectFilter, setProjectFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');

  const planningItems = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const next30End = new Date(startToday);
    next30End.setDate(startToday.getDate() + 30);

    const inPeriod = (date: Date) => {
      if (periodFilter === 'all') return true;
      if (periodFilter === 'past') return date < startToday;
      if (periodFilter === 'next30') return date >= startToday && date <= next30End;
      return date >= monthStart && date <= monthEnd;
    };

    return records
      .filter((record) => (projectFilter ? record.projectTypeId === projectFilter : true))
      .flatMap((record) => {
        const projectTypeName =
          projectTypes.find((pt) => pt.id === record.projectTypeId)?.name || 'Type inconnu';

        const emails = (record.scheduledEmails || []).map((email) => ({
          id: `${record.id}-email-${email.id}`,
          recordId: record.id,
          refId: email.id,
          type: 'email' as const,
          date: email.date,
          label: email.label,
          description: email.description,
          templateName: email.templateName,
          recipient: email.recipient,
          projectTypeId: record.projectTypeId,
          projectTypeName,
          clientName: record.clientName,
          clientNumber: record.clientNumber,
          requiresAction: false,
          isSent: record.sentEmailIds?.includes(email.id) || false,
        }));

        const documents = (record.scheduledDocuments || []).map((doc) => ({
          id: `${record.id}-document-${doc.id}`,
          recordId: record.id,
          refId: doc.id,
          type: 'document' as const,
          date: doc.date,
          label: doc.label,
          description: doc.description,
          outputPattern: doc.outputPattern,
          projectTypeId: record.projectTypeId,
          projectTypeName,
          clientName: record.clientName,
          clientNumber: record.clientNumber,
          requiresAction: doc.requiresAction,
          isSent: record.sentDocumentIds?.includes(doc.id) || false,
        }));

        const questions = (record.scheduledQuestions || []).map((question) => ({
          id: `${record.id}-question-${question.id}`,
          recordId: record.id,
          refId: question.id,
          type: 'question' as const,
          date: question.date,
          label: question.label,
          description: question.description,
          questionLabel: question.questionLabel,
          projectTypeId: record.projectTypeId,
          projectTypeName,
          clientName: record.clientName,
          clientNumber: record.clientNumber,
          requiresAction: question.requiresAction,
          isSent: record.sentQuestionIds?.includes(question.id) || false,
        }));

        return [...emails, ...documents, ...questions];
      })
      .filter((item) => inPeriod(new Date(item.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, projectFilter, projectTypes, periodFilter]);

  const groupedByWeek = useMemo<WeekGroup[]>(() => {
    const groups = new Map<string, WeekGroup>();

    planningItems.forEach((item) => {
      const itemDate = new Date(item.date);
      const start = getWeekStart(itemDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const key = start.toISOString().slice(0, 10);
      if (!groups.has(key)) {
        groups.set(key, { key, start, end, items: [] });
      }
      groups.get(key)?.items.push(item);
    });

    return Array.from(groups.values()).sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
  }, [planningItems]);

  const totalItems = planningItems.length;

  const getBadge = (item: PlanningItem) => {
    if (item.isSent) {
      return { label: 'Envoyé', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const startDayAfterTomorrow = new Date(startToday);
    startDayAfterTomorrow.setDate(startToday.getDate() + 2);
    const startNextWeek = new Date(startToday);
    startNextWeek.setDate(startToday.getDate() + 7);

    const date = new Date(item.date);

    if (date < startToday) {
      return { label: 'Passé', className: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (date < startDayAfterTomorrow) {
      return { label: 'Imminent', className: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (date < startNextWeek) {
      return { label: 'Cette semaine', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { label: 'Planifié', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  const isPast = (item: PlanningItem) => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    return new Date(item.date) < startToday;
  };

  const toggleSent = (item: PlanningItem, checked: boolean) => {
    if (item.type === 'email') {
      if (checked) {
        markEmailAsSent(item.recordId, item.refId);
      } else {
        unmarkEmailAsSent(item.recordId, item.refId);
      }
      return;
    }
    if (item.type === 'document') {
      if (checked) {
        markDocumentAsSent(item.recordId, item.refId);
      } else {
        unmarkDocumentAsSent(item.recordId, item.refId);
      }
      return;
    }
    if (checked) {
      markQuestionAsSent(item.recordId, item.refId);
    } else {
      unmarkQuestionAsSent(item.recordId, item.refId);
    }
  };

  const getTypeIcon = (item: PlanningItem) => {
    if (item.type === 'document') return FileText;
    if (item.type === 'question') return HelpCircle;
    return Mail;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Planning des envois</h1>
          <p className="text-sm text-slate-500 mt-1">
            Emails, documents et questions planifiés, regroupés par semaine.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="text-sm text-slate-500">
            Total planifiés : <span className="font-semibold text-slate-900">{totalItems}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-slate-500">Période</label>
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {(['all', 'month', 'next30', 'past'] as PeriodFilter[]).map((option) => (
                <option key={option} value={option}>
                  {getPeriodLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Tous les projets</option>
            {projectTypes.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groupedByWeek.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <CalendarOff className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aucun élément planifié</h2>
            <p className="text-sm text-slate-500 mt-1">
              Aucun envoi ou rappel prévu pour la période sélectionnée.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voir le dossier
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByWeek.map((group) => (
            <div key={group.key} className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-slate-900">{formatWeekRange(group.start, group.end)}</p>
                    <p className="text-xs text-slate-500">{group.items.length} élément(s)</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {group.items.map((item) => {
                  const Icon = getTypeIcon(item);
                  const badge = getBadge(item);
                  const muted = !item.isSent && isPast(item);

                  return (
                    <div
                      key={item.id}
                      className={`px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                        muted ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {item.requiresAction && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-100 text-amber-700 border-amber-200">
                              Action requise
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-500">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          {item.type === 'email' && (
                            <>
                              <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-slate-600">
                                {item.templateName}
                              </span>
                              <span>{item.recipient}</span>
                            </>
                          )}
                          {item.type === 'document' && (
                            <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-slate-600">
                              {item.outputPattern || 'Document'}
                            </span>
                          )}
                          {item.type === 'question' && (
                            <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-slate-600">
                              {item.questionLabel || 'Question'}
                            </span>
                          )}
                          <span>•</span>
                          <span>{item.projectTypeName}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="text-sm text-slate-600 text-right">
                          <p className="font-medium text-slate-900">{formatDate(item.date)}</p>
                          <p className="text-xs text-slate-500">{item.clientName} · {item.clientNumber}</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={item.isSent}
                            onChange={(event) => toggleSent(item, event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                          Envoyé
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
