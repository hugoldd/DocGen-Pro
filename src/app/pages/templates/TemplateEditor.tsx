import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, ChevronLeft, Eye, FileText, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import type { TemplateType } from '../../types';
import { resolveVariables } from '../../utils/engine';
import { Switch } from '../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const TEMPLATE_TYPES: TemplateType[] = ['DOCX', 'XLSX', 'PDF', 'EMAIL'];
const CLIENT_KEYS = ['nom_client', 'numero_client', 'contact_name', 'contact_email'];
const PROJECT_KEYS = ['type_projet'];

const extractVariables = (content: string): string[] => {
  const matches = content.match(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g) || [];
  const keys = matches
    .map((match) => match.replace(/\{\{|\}\}|\s/g, ''))
    .filter(Boolean);
  return Array.from(new Set(keys));
};

type FormState = {
  name: string;
  type: TemplateType | '';
  projectTypeId: string;
  content: string;
  emailSubject: string;
  fileBase64: string;
  fileName: string;
  status: 'draft' | 'published';
};

type FormErrors = {
  name?: string;
  type?: string;
};

const emptyForm: FormState = {
  name: '',
  type: '',
  projectTypeId: '',
  content: '',
  emailSubject: '',
  fileBase64: '',
  fileName: '',
  status: 'draft',
};

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    templates,
    projectTypes,
    variables,
    addTemplate,
    updateTemplate,
  } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeField, setActiveField] = useState<'subject' | 'content'>('content');

  const isEditMode = !!id;
  const template = useMemo(
    () => (id ? templates.find((t) => t.id === id) : undefined),
    [id, templates]
  );

  useEffect(() => {
    if (isEditMode) {
      if (template) {
        setForm({
          name: template.name,
          type: template.type,
          projectTypeId: template.projectTypeId || '',
          content: template.content || '',
          emailSubject: template.emailSubject || '',
          fileBase64: template.fileBase64 || '',
          fileName: template.fileName || '',
          status: template.status,
        });
      }
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [isEditMode, template]);

  const groupedVariables = useMemo(() => {
    const keys = Object.keys(variables);
    const client = keys.filter((key) => CLIENT_KEYS.includes(key));
    const project = keys.filter((key) => PROJECT_KEYS.includes(key));
    const other = keys.filter(
      (key) => !CLIENT_KEYS.includes(key) && !PROJECT_KEYS.includes(key)
    );

    return [
      { label: 'Infos client', keys: client },
      { label: 'Infos projet', keys: project },
      { label: 'Autres', keys: other },
    ];
  }, [variables]);

  const previewContent = resolveVariables(form.content || '', variables);

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setForm((prev) => ({
        ...prev,
        fileBase64: base64 || '',
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setForm((prev) => ({
      ...prev,
      fileBase64: '',
      fileName: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInsertVariable = (key: string) => {
    if (activeField === 'subject' && form.type === 'EMAIL') {
      const subjectInput = subjectRef.current;
      const insertion = `{{${key}}}`;
      if (!subjectInput) {
        setForm((prev) => ({
          ...prev,
          emailSubject: `${prev.emailSubject} ${insertion}`.trim(),
        }));
        return;
      }

      const start = subjectInput.selectionStart ?? form.emailSubject.length;
      const end = subjectInput.selectionEnd ?? form.emailSubject.length;
      const nextValue = `${form.emailSubject.slice(0, start)}${insertion}${form.emailSubject.slice(end)}`;
      setForm((prev) => ({ ...prev, emailSubject: nextValue }));

      window.requestAnimationFrame(() => {
        subjectInput.focus();
        const cursor = start + insertion.length;
        subjectInput.setSelectionRange(cursor, cursor);
      });
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: `${prev.content} {{${key}}}`.trim() }));
      return;
    }

    const insertion = `{{${key}}}`;
    const start = textarea.selectionStart ?? form.content.length;
    const end = textarea.selectionEnd ?? form.content.length;
    const nextContent = `${form.content.slice(0, start)}${insertion}${form.content.slice(end)}`;

    setForm((prev) => ({ ...prev, content: nextContent }));

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Le nom du template est obligatoire.';
    }
    if (!form.type) {
      nextErrors.type = 'Le type du template est obligatoire.';
    }
    return nextErrors;
  };

  const handleSave = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const variablesList = extractVariables(form.content || '');
    const payload = {
      name: form.name.trim(),
      type: form.type as TemplateType,
      projectTypeId: form.projectTypeId ? form.projectTypeId : null,
      content: form.content,
      emailSubject: form.emailSubject || undefined,
      fileBase64: form.fileBase64 || undefined,
      fileName: form.fileName || undefined,
      variables: variablesList,
      linkedTemplateIds: [],
      status: form.status,
    };

    if (isEditMode && template) {
      updateTemplate(template.id, payload);
    } else {
      addTemplate(payload);
    }

    navigate('/templates');
  };

  if (isEditMode && !template) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Template introuvable</h1>
        <p className="text-sm text-slate-500 mt-2">
          Le template demandé n'existe pas ou a été supprimé.
        </p>
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour aux templates
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEditMode ? 'Modifier le template' : 'Créer un template'}
            </h1>
            <p className="text-sm text-slate-500">
              {isEditMode
                ? 'Mettez à jour les informations du template.'
                : 'Définissez un nouveau modèle de document.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom du template <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Contrat de prestation"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as TemplateType | '',
                  }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">Sélectionner un type</option>
                {TEMPLATE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
            </div>
            {form.type === 'EMAIL' && (
              <div className="md:col-span-2 space-y-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Objet de l'email
                  </label>
                  <input
                    ref={subjectRef}
                    type="text"
                    value={form.emailSubject}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, emailSubject: e.target.value }))
                    }
                    onFocus={() => setActiveField('subject')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Bienvenue {{nom_client}}"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Utilisez {'{{variable}}'} pour insérer des valeurs dynamiques.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type de projet associé
              </label>
              <select
                value={form.projectTypeId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, projectTypeId: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">Aucun</option>
                {projectTypes.map((projectType) => (
                  <option key={projectType.id} value={projectType.id}>
                    {projectType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Statut
                </label>
                <p className="text-xs text-slate-500">Brouillon ou publié.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Brouillon</span>
                <Switch
                  checked={form.status === 'published'}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      status: checked ? 'published' : 'draft',
                    }))
                  }
                />
                <span className="text-xs text-slate-600">Publié</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fichier template (optionnel)
              </label>
              <p className="text-xs text-slate-500">
                Si un fichier est importé, il est prioritaire sur le contenu texte.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.xlsx,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFileImport(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                Importer un fichier template
              </button>
              {form.fileName ? (
                <div className="flex items-center justify-between gap-3 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm text-slate-700 truncate">{form.fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                    aria-label="Supprimer le fichier importé"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Formats acceptés : .docx, .xlsx, .pdf
                </p>
              )}
            </div>
            {form.type === 'PDF' && form.fileBase64 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Les PDF importés sont utilisés tels quels et ne sont pas modifiables.
              </div>
            )}
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                Pour DOCX : utilisez <span className="font-mono">{'{{nom_client}}'}</span>{' '}
                dans votre fichier Word.
              </p>
              <p>
                Pour XLSX : utilisez{' '}
                <span className="font-mono">{'{{nom_client}}'}</span> dans vos
                cellules.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              onFocus={() => setActiveField('content')}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[160px]"
              rows={6}
              placeholder="Rédigez le contenu du template..."
            />
            {form.type === 'EMAIL' && (
              <p className="text-xs text-slate-500 mt-2">
                Le contenu HTML est supporté. Utilisez {'{{variable}}'} pour les balises
                dynamiques.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Variables disponibles</h2>
            <p className="text-xs text-slate-500">Cliquez pour insérer</p>
          </div>

          <div className="space-y-4">
            {groupedVariables.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                  {group.label}
                </h3>
                {group.keys.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune variable.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {group.keys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleInsertVariable(key)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <span className="font-mono text-xs text-indigo-500">{`{{${key}}}`}</span>
                        <span className="flex-1 text-left truncate">{variables[key]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {Object.keys(variables).length === 0 && (
              <p className="text-sm text-slate-500 italic">
                Aucune variable disponible pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aperçu du template</DialogTitle>
            <DialogDescription>
              Les variables sont remplacées par leurs libellés.
            </DialogDescription>
          </DialogHeader>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">
            {previewContent || 'Aucun contenu à afficher.'}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
