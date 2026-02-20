import React, { useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { templates, projectTypes, getRecords } = useApp();
  const records = getRecords();

  const publishedCount = useMemo(
    () => projectTypes.filter((pt) => pt.status === 'published').length,
    [projectTypes]
  );

  const thisMonthEmailsCount = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return records
      .filter((record) => record.scheduledEmails?.length)
      .flatMap((record) => (record.scheduledEmails || []).map((email) => ({
        ...email,
        isSent: record.sentEmailIds?.includes(email.id) || false,
      })))
      .filter((email) => {
        const date = new Date(email.date);
        return date >= start && date <= end && !email.isSent;
      }).length;
  }, [records]);

  const recentRecords = useMemo(() => records.slice(0, 5), [records]);

  const stats = [
    {
      name: 'Templates',
      value: templates.length,
      icon: FileText,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      route: '/templates',
    },
    {
      name: 'Types de projets publiés',
      value: publishedCount,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      route: '/configuration',
    },
    {
      name: 'Générations totales',
      value: records.length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      route: '/history',
    },
    {
      name: 'Emails à envoyer ce mois',
      value: thisMonthEmailsCount,
      icon: Mail,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      route: '/planning',
      badge: thisMonthEmailsCount === 0
        ? { label: 'À jour', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
        : { label: String(thisMonthEmailsCount), className: 'bg-amber-100 text-amber-700 border-amber-200' },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
        <button
          type="button"
          onClick={() => navigate('/workflow')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Nouvelle prise en charge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <button
            key={stat.name}
            type="button"
            onClick={() => navigate(stat.route)}
            className="w-full text-left"
          >
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.badge && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stat.badge.className}`}>
                    {stat.badge.label}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{stat.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Activité récente</h2>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
            >
              Voir tout l'historique <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Aucune génération pour le moment</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Client</th>
                    <th className="px-4 py-3">Numéro client</th>
                    <th className="px-4 py-3">Type de projet</th>
                    <th className="px-4 py-3">Projet</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Fichiers</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRecords.map((record) => {
                    const projectName =
                      projectTypes.find((pt) => pt.id === record.projectTypeId)?.name ||
                      'Type inconnu';
                    return (
                      <tr
                        key={record.id}
                        onClick={() => navigate('/history', { state: { openRecordId: record.id } })}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">{record.clientName}</td>
                        <td className="px-4 py-3 text-slate-600">{record.clientNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{projectName}</td>
                        <td className="px-4 py-3">
                          <span className="text-indigo-600 text-sm font-medium">Voir le projet</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              record.status === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {record.status === 'success' ? 'Réussi' : 'Erreur'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{record.filesGenerated.length}</td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {new Date(record.date).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
            <p className="text-sm text-slate-500">Accédez rapidement aux principaux écrans.</p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/workflow')}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Nouvelle prise en charge
            </button>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Voir tout l'historique
            </button>
            <button
              type="button"
              onClick={() => navigate('/planning')}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Voir le planning
            </button>
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Gérer les templates
            </button>
            <button
              type="button"
              onClick={() => navigate('/configuration')}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Configurer les projets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
