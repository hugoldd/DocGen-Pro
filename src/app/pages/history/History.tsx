import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import type { GenerationRecord, GeneratedFile, TemplateType } from '../../types';
import PlanningView from '../../components/PlanningView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

const PAGE_SIZE = 10;

const formatStatus = (status: GenerationRecord['status']) =>
  status === 'success' ? 'Réussi' : 'Erreur';

const statusBadgeClass = (status: GenerationRecord['status']) =>
  status === 'success'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-700 border-red-200';

const fileTypeBadgeClass = (type: TemplateType) => {
  if (type === 'PDF') return 'bg-red-100 text-red-700 border-red-200';
  if (type === 'EMAIL') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (type === 'XLSX') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR');

const escapeCsv = (value: string) => {
  const needsQuotes = /[";\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectTypes, templates, getRecords, deleteRecord } = useApp();
  const records = getRecords();

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<GenerationRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloadingByIndex, setDownloadingByIndex] = useState<Record<number, boolean>>({});
  const [deleteMode, setDeleteMode] = useState(false);

  const isFiltersActive =
    !!searchTerm.trim() || projectFilter !== '' || statusFilter !== 'all';

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    projectTypes.forEach((pt) => map.set(pt.id, pt.name));
    return map;
  }, [projectTypes]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return records
      .filter((record) => {
        if (!term) return true;
        return (
          record.clientName.toLowerCase().includes(term) ||
          record.clientNumber.toLowerCase().includes(term)
        );
      })
      .filter((record) => (projectFilter ? record.projectTypeId === projectFilter : true))
      .filter((record) =>
        statusFilter === 'all' ? true : record.status === statusFilter
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, projectFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, projectFilter, statusFilter]);

  useEffect(() => {
    const openRecordId = (location.state as { openRecordId?: string } | null)
      ?.openRecordId;
    if (!openRecordId) return;
    const record = records.find((item) => item.id === openRecordId);
    if (record) {
      setSelectedRecord(record);
    }
  }, [location.state, records]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.shiftKey && event.altKey && event.key === 'H') {
        setDeleteMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const totalResults = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
  const rangeStart = totalResults === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, totalResults);

  const handleExportCsv = () => {
    const rows = filteredRecords.map((record) => {
      const projectName = projectNameById.get(record.projectTypeId) || 'Type inconnu';
      return [
        formatDate(record.date),
        record.clientName,
        record.clientNumber,
        projectName,
        String(record.filesGenerated.length),
        formatStatus(record.status),
      ];
    });

    const header = ['Date', 'Nom client', 'Numéro client', 'Type de projet', 'Nb fichiers', 'Statut'];
    const lines = [header, ...rows].map((row) => row.map(escapeCsv).join(';'));
    const csvContent = `\uFEFF${lines.join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique_generations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setProjectFilter('');
    setStatusFilter('all');
  };

  const handleRedownload = async (
    doc: GeneratedFile,
    record: GenerationRecord,
    index: number
  ) => {
    const projectType = projectTypes.find((pt) => pt.id === record.projectTypeId);
    const template = templates.find((t) => t.id === doc.templateId);

    if (!template) {
      setToastMessage('Template introuvable');
      return;
    }

    setDownloadingByIndex((prev) => ({ ...prev, [index]: true }));
    try {
      const clientValues = {
        nom_client: record.clientName,
        numero_client: record.clientNumber,
        type_projet: projectType?.name ?? '',
        contact_name: record.contacts?.[0]?.name ?? '',
        contact_email: record.contacts?.[0]?.email ?? '',
        ...(record.answers || {}),
      };

      const { generateFile } = await import('../../utils/fileGenerator');
      const blob = await generateFile(template, clientValues);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setToastMessage('Erreur lors de la génération');
    } finally {
      setDownloadingByIndex((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
          {toastMessage}
        </div>
      )}
      {deleteMode && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Mode suppression actif — Shift+Alt+H pour quitter
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Historique des générations</h1>
          <p className="text-slate-500 text-sm mt-1">Consultez et gérez les fichiers produits précédemment.</p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium bg-white"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-50/50">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou numéro..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Tous les projets</option>
              {projectTypes.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'error')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Réussi</option>
              <option value="error">Erreur</option>
            </select>
            {isFiltersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Nom client</th>
                <th className="px-6 py-4">Numéro client</th>
                <th className="px-6 py-4">Type de projet</th>
                <th className="px-6 py-4 text-center">Nb fichiers</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Aucune génération pour le moment
                  </td>
                </tr>
              )}

              {records.length > 0 && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p>Aucun résultat avec ces filtres.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50"
                    >
                      Réinitialiser les filtres
                    </button>
                  </td>
                </tr>
              )}

              {paginatedRecords.map((record) => {
                const projectName = projectNameById.get(record.projectTypeId) || 'Type inconnu';
                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{record.clientName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                      {record.clientNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{projectName}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {record.filesGenerated.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(record.status)}`}
                      >
                        {formatStatus(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/workflow', { state: { prefill: record } })}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Regénérer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {deleteMode && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Supprimer cette entrée ?')) {
                                deleteRecord(record.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 text-sm text-slate-500">
            <span>{rangeStart} à {rangeEnd} sur {totalResults} résultats</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1 border border-slate-200 rounded bg-white disabled:opacity-50"
                disabled={safePage === 1}
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1 border rounded ${
                    pageNumber === safePage
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 border border-slate-200 rounded bg-white disabled:opacity-50"
                disabled={safePage === totalPages}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Détail de génération</DialogTitle>
            <DialogDescription>
              Informations client et fichiers générés.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 space-y-6">
            {selectedRecord && (
              <div className="space-y-6">
                {(() => {
                  const projectType = projectTypes.find(
                    (pt) => pt.id === selectedRecord.projectTypeId
                  );
                  const selectedOptions = (selectedRecord.selectedOptionIds || []).map((optId) => ({
                    id: optId,
                    label:
                      projectType?.options.find((opt) => opt.id === optId)?.label || optId,
                  }));
                  const prerequisiteAnswers = Object.entries(selectedRecord.answers || {}).map(
                    ([questionId, answer]) => ({
                      id: questionId,
                      label:
                        projectType?.questions.find((q) => q.id === questionId)?.label ||
                        questionId,
                      value: answer,
                    })
                  );

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase">Client</p>
                          <p className="text-sm font-semibold text-slate-900">{selectedRecord.clientName}</p>
                          <p className="text-xs text-slate-500 mt-1">{selectedRecord.clientNumber}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase">Type de projet</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {projectNameById.get(selectedRecord.projectTypeId) || 'Type inconnu'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(selectedRecord.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(selectedRecord.status)}`}>
                          {formatStatus(selectedRecord.status)}
                        </span>
                        <span className="text-xs text-slate-500">{selectedRecord.filesGenerated.length} fichier(s)</span>
                      </div>
                      {selectedRecord.contacts?.length ? (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                            Interlocuteurs
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-white text-slate-500 text-xs uppercase border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Nom</th>
                                  <th className="px-4 py-3">Rôle</th>
                                  <th className="px-4 py-3">Email</th>
                                  <th className="px-4 py-3">Téléphone</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedRecord.contacts.map((contact) => (
                                  <tr key={contact.id}>
                                    <td className="px-4 py-3 text-slate-900">{contact.name || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{contact.role || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{contact.email || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{contact.phone || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                      {selectedOptions.length > 0 ? (
                        <div className="border border-slate-200 rounded-lg p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-3">
                            Options sélectionnées
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedOptions.map((opt) => (
                              <span
                                key={opt.id}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {prerequisiteAnswers.length > 0 ? (
                        <div className="border border-slate-200 rounded-lg p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-3">
                            Réponses aux prérequis
                          </p>
                          <div className="space-y-3 text-sm">
                            {prerequisiteAnswers.map((answer) => (
                              <div key={answer.id}>
                                <p className="text-xs uppercase text-slate-500">{answer.label}</p>
                                <p className="text-slate-900">{answer.value || '-'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 text-xs font-semibold uppercase text-slate-500">Fichiers générés</div>
                  <div className="divide-y divide-slate-100">
                    {selectedRecord.filesGenerated.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">Aucun fichier généré.</div>
                    ) : (
                      selectedRecord.filesGenerated.map((file, idx) => (
                        <div key={`${file.templateId}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{file.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{file.destinationPath}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${fileTypeBadgeClass(file.type)}`}>
                              {file.type}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRedownload(file, selectedRecord, idx)}
                              className="text-slate-500 hover:text-slate-900"
                            >
                              {downloadingByIndex[idx] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {selectedRecord.scheduledEmails?.length && selectedRecord.deploymentDate && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      Planning des envois
                    </div>
                    <div className="p-4">
                    <PlanningView
                      scheduledEmails={selectedRecord.scheduledEmails}
                      deploymentDate={selectedRecord.deploymentDate}
                      sentEmailIds={selectedRecord.sentEmailIds}
                    />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
