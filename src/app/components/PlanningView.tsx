import React, { useMemo } from 'react';
import { Calendar, Mail } from 'lucide-react';
import type { GenerationRecord } from '../types';

interface PlanningViewProps {
  scheduledEmails: NonNullable<GenerationRecord['scheduledEmails']>;
  deploymentDate: string;
  sentEmailIds?: string[];
}

type PlanningItem =
  | (NonNullable<GenerationRecord['scheduledEmails']>[number] & { isDeployment?: false })
  | {
      id: 'deployment';
      date: string;
      label: string;
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

export default function PlanningView({ scheduledEmails, deploymentDate, sentEmailIds }: PlanningViewProps) {
  const items = useMemo<PlanningItem[]>(() => {
    const deploymentItem: PlanningItem = {
      id: 'deployment',
      date: deploymentDate,
      label: 'Date de déploiement',
      isDeployment: true,
    };

    const combined = [deploymentItem, ...scheduledEmails];
    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [scheduledEmails, deploymentDate]);

  return (
    <div className="border-l-2 border-slate-200 ml-4 space-y-6">
      {items.map((item) => {
        if (item.isDeployment) {
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
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
