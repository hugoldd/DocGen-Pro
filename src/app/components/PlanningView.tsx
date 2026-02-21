import React, { useMemo } from 'react';
import { Calendar, Mail, FileText, HelpCircle } from 'lucide-react';
import type { GenerationRecord } from '../types';

interface PlanningViewProps {
  scheduledEmails: NonNullable<GenerationRecord['scheduledEmails']>;
  scheduledDocuments?: NonNullable<GenerationRecord['scheduledDocuments']>;
  scheduledQuestions?: NonNullable<GenerationRecord['scheduledQuestions']>;
  deploymentDate: string;
  sentEmailIds?: string[];
}

type PlanningItem =
  | (NonNullable<GenerationRecord['scheduledEmails']>[number] & {
      type: 'email';
      isDeployment?: false;
    })
  | {
      id: string;
      date: string;
      label: string;
      type: 'document';
      requiresAction?: boolean;
    }
  | {
      id: string;
      date: string;
      label: string;
      type: 'question';
      requiresAction?: boolean;
    }
  | {
      id: 'deployment';
      date: string;
      label: string;
      type: 'deployment';
      isDeployment: true;
    };

const formatDate = (value: string) => new Date(value).toLocaleDateString('fr-FR');

const getEmailBadge = (date: string, isSent: boolean) => {
  if (isSent) {
    return { label: 'Envoyé', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  const diffDays = (new Date(date).getTime() - Date.now()) / 86400000;
  if (diffDays < 0) {
    return { label: 'Passé', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  if (diffDays < 7) {
    return { label: 'Imminent', className: 'bg-red-100 text-red-700 border-red-200' };
  }
  if (diffDays < 14) {
    return { label: 'Proche', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  return { label: 'Planifié', className: 'bg-blue-100 text-blue-700 border-blue-200' };
};

export default function PlanningView({
  scheduledEmails,
  scheduledDocuments = [],
  scheduledQuestions = [],
  deploymentDate,
  sentEmailIds,
}: PlanningViewProps) {
  const items = useMemo<PlanningItem[]>(() => {
    const deploymentItem: PlanningItem = {
      id: 'deployment',
      date: deploymentDate,
      label: 'Date de déploiement',
      isDeployment: true,
      type: 'deployment',
    };

    const combined: PlanningItem[] = [
      deploymentItem,
      ...scheduledEmails.map((email) => ({ ...email, type: 'email' as const })),
      ...scheduledDocuments.map((doc) => ({
        id: doc.id,
        date: doc.date,
        label: doc.label,
        type: 'document' as const,
        requiresAction: doc.requiresAction,
      })),
      ...scheduledQuestions.map((q) => ({
        id: q.id,
        date: q.date,
        label: q.label,
        type: 'question' as const,
        requiresAction: q.requiresAction,
      })),
    ];
    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [scheduledEmails, scheduledDocuments, scheduledQuestions, deploymentDate]);

  return (
    <div className="border-l-2 border-slate-200 ml-4 space-y-6">
      {items.map((item) => {
        if (item.type === 'deployment') {
          return (
            <div key={item.id} className="relative pl-8">
              <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-slate-200" />
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-indigo-100 text-indigo-700 border-indigo-200">
                  Déploiement
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <p className="font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                </div>
              </div>
            </div>
          );
        }

        if (item.type === 'email') {
          const badge = getEmailBadge(item.date, sentEmailIds?.includes(item.id) || false);

          return (
            <div key={item.id} className="relative pl-8">
              <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-slate-200" />
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                >
                  {badge.label}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <p className="font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500">{item.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600">
                      {item.templateName}
                    </span>
                    <span className="text-xs text-slate-400">{item.recipient}</span>
                    {item.requiresAction && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
                        Rappel utilisateur
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (item.type === 'document') {
          return (
            <div key={item.id} className="relative pl-8">
              <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-slate-200" />
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-200">
                  Document
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <p className="font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                  {item.requiresAction && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
                      Rappel utilisateur
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={item.id} className="relative pl-8">
            <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-slate-200" />
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-violet-100 text-violet-700 border-violet-200">
                Question
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <p className="font-semibold text-slate-900">{item.label}</p>
                </div>
                <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                {item.requiresAction && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
                    Rappel utilisateur
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
