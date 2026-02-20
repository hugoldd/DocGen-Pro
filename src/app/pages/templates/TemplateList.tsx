import React, { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit3,
  Eye,
  Copy,
  Trash2,
  Mail,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import type { Template, TemplateType } from '../../types';
import { resolveVariables } from '../../utils/engine';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const TEMPLATE_TYPES: TemplateType[] = ['DOCX', 'XLSX', 'PDF', 'EMAIL'];

type TypeFilter = TemplateType | 'ALL';

const getIcon = (type: TemplateType) => {
  switch (type) {
    case 'DOCX':
      return <FileText className="w-6 h-6 text-blue-600" />;
    case 'XLSX':
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    case 'EMAIL':
      return <Mail className="w-6 h-6 text-amber-600" />;
    case 'PDF':
      return <File className="w-6 h-6 text-red-600" />;
    default:
      return <FileText className="w-6 h-6 text-slate-400" />;
  }
};

const getBadgeColor = (type: TemplateType) => {
  switch (type) {
    case 'DOCX':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'XLSX':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EMAIL':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PDF':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getStatusBadge = (status: Template['status']) =>
  status === 'published'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

export default function TemplateList() {
  const navigate = useNavigate();
  const { templates, variables, duplicateTemplate, deleteTemplate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesType = typeFilter === 'ALL' || template.type === typeFilter;
      const matchesSearch = !lowered || template.name.toLowerCase().includes(lowered);
      return matchesType && matchesSearch;
    });
  }, [templates, searchTerm, typeFilter]);

  const previewContent = previewTemplate
    ? resolveVariables(previewTemplate.content || '', variables)
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bibliothèque de templates</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez vos modèles de documents et d'emails
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/templates/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          + Nouveau template
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un template par nom..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="ALL">Tous les types</option>
            {TEMPLATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
          <p className="text-slate-600 mb-4">
            Aucun template ne correspond à votre recherche pour le moment.
          </p>
          <button
            type="button"
            onClick={() => navigate('/templates/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer un template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-lg ${getBadgeColor(template.type).split(' ')[0]}`}>
                    {getIcon(template.type)}
                  </div>
                  <div className="relative">
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors" type="button">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">
                  {template.name}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(template.type)}`}
                  >
                    {template.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(template.status)}`}
                  >
                    {template.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Dernière mise à jour : {new Date(template.updatedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Modifier"
                    onClick={() => navigate(`/templates/${template.id}`)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Aperçu"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Dupliquer"
                    onClick={() => duplicateTemplate(template.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est définitive. Le template "{template.name}" sera supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aperçu du template</DialogTitle>
            <DialogDescription>{previewTemplate?.name}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewTemplate ? (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">
                {previewContent || 'Aucun contenu à afficher.'}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
