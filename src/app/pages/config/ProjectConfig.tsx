import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Settings,
  Pencil,
  Trash2,
  Mail,
  Eye,
  Tag,
  HelpCircle,
  FileText,
  Calendar,
  X,
  Play,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type {
  ProjectOption,
  PrerequisiteQuestion,
  DocumentRule,
  EmailRule,
  EmailScheduleRule,
  DocumentScheduleRule,
  QuestionScheduleRule,
} from '../../types';
import {
  getActiveQuestions,
  getActiveDocumentRules,
  getActiveEmailRules,
} from '../../utils/engine';
import { Textarea } from '../../components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Button } from '../../components/ui/button';
import { exportSingleProjectType } from '../../utils/settingsExport';

const genId = () => Math.random().toString(36).slice(2, 10);

const NO_CONDITION = '__none__';

const SECTIONS = [
  { id: 'identity',  label: 'Identité & Options',       icon: Tag },
  { id: 'questions', label: 'Questions prérequis',       icon: HelpCircle },
  { id: 'rules',     label: 'Règles documents & Emails', icon: FileText },
  { id: 'planning',  label: 'Planning',                  icon: Calendar },
];

type EditorMode = 'create' | 'edit';

type ProjectForm = {
  name: string;
  code: string;
  description: string;
  tags: string[];
  status: 'draft' | 'published';
  options: ProjectOption[];
  questions: PrerequisiteQuestion[];
  documentRules: DocumentRule[];
  emailRules: EmailRule[];
  emailSchedule: EmailScheduleRule[];
  documentSchedule: DocumentScheduleRule[];
  questionSchedule: QuestionScheduleRule[];
};

const getDefaults = (): ProjectForm => ({
  name: '',
  code: '',
  description: '',
  tags: [],
  status: 'draft',
  options: [],
  questions: [],
  documentRules: [],
  emailRules: [],
  emailSchedule: [],
  documentSchedule: [],
  questionSchedule: [],
});

const inputCls =
  'w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';

const ProjectConfig = () => {
  const navigate = useNavigate();
  const {
    projectTypes,
    templates,
    addProjectType,
    updateProjectType,
    deleteProjectType,
    publishProjectType,
  } = useApp();

  const [search, setSearch]                     = useState('');
  const [isEditing, setIsEditing]               = useState(false);
  const [editorMode, setEditorMode]             = useState<EditorMode>('create');
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId]             = useState<string | null>(null);
  const [form, setForm]                         = useState<ProjectForm>(getDefaults());
  const [newTag, setNewTag]                     = useState('');
  const [activeSection, setActiveSection]       = useState('identity');
  const [showSimulate, setShowSimulate]         = useState(false);
  const [simulateOptionIds, setSimulateOptionIds] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing) setActiveSection('identity');
  }, [isEditing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projectTypes;
    return projectTypes.filter((p) =>
      [p.name, p.code, p.description].some((v) => v?.toLowerCase().includes(q))
    );
  }, [projectTypes, search]);

  const hasFormErrors = !form.name.trim() || !form.code.trim();

  const updateForm = (patch: Partial<ProjectForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  /* ── Simulation computed values ── */
  const simActiveQuestions = useMemo(
    () => getActiveQuestions(form.questions, simulateOptionIds),
    [form.questions, simulateOptionIds]
  );
  const simActiveDocRules = useMemo(
    () => getActiveDocumentRules(form.documentRules, simulateOptionIds),
    [form.documentRules, simulateOptionIds]
  );
  const simActiveEmailRules = useMemo(
    () => getActiveEmailRules(form.emailRules, simulateOptionIds),
    [form.emailRules, simulateOptionIds]
  );

  /* ── Editor open/close ── */
  const handleCreate = () => {
    setEditorMode('create');
    setEditingId(null);
    setForm(getDefaults());
    setIsEditing(true);
  };

  const handleEdit = (id: string) => {
    const item = projectTypes.find((p) => p.id === id);
    if (!item) return;
    setEditorMode('edit');
    setEditingId(id);
    setForm({
      name:             item.name,
      code:             item.code,
      description:      item.description,
      tags:             item.tags,
      status:           item.status,
      options:          item.options,
      questions:        item.questions,
      documentRules:    item.documentRules,
      emailRules:       item.emailRules,
      emailSchedule:    item.emailSchedule    ?? [],
      documentSchedule: item.documentSchedule ?? [],
      questionSchedule: item.questionSchedule ?? [],
    });
    setIsEditing(true);
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(getDefaults());
  };

  const saveProject = (status: 'draft' | 'published') => {
    if (hasFormErrors) return;
    const payload = { ...form, status };
    if (editorMode === 'create') {
      addProjectType(payload);
    } else if (editingId) {
      updateProjectType(editingId, payload);
    }
    handleCloseEditor();
  };

  /* ── Delete ── */
  const handleDelete = (id: string) => { setDeletingId(id); setShowDeleteDialog(true); };
  const confirmDelete = () => {
    if (!deletingId) return;
    deleteProjectType(deletingId);
    setShowDeleteDialog(false);
    setDeletingId(null);
  };

  /* ── Tags ── */
  const addTag = () => {
    const t = newTag.trim();
    if (!t || form.tags.includes(t)) { setNewTag(''); return; }
    updateForm({ tags: [...form.tags, t] });
    setNewTag('');
  };
  const removeTag = (tag: string) =>
    updateForm({ tags: form.tags.filter((t) => t !== tag) });

  /* ── Options ── */
  const addOption = () =>
    updateForm({ options: [...form.options, { id: genId(), label: '' }] });
  const updateOption = (id: string, label: string) =>
    updateForm({ options: form.options.map((o) => o.id === id ? { ...o, label } : o) });
  const removeOption = (id: string) =>
    updateForm({ options: form.options.filter((o) => o.id !== id) });

  /* ── Questions ── */
  const addQuestion = () =>
    updateForm({
      questions: [...form.questions, { id: genId(), label: '', answerType: 'text', required: false, condition: null }],
    });
  const updateQuestion = (id: string, patch: Partial<PrerequisiteQuestion>) =>
    updateForm({ questions: form.questions.map((q) => q.id === id ? { ...q, ...patch } : q) });
  const removeQuestion = (id: string) =>
    updateForm({ questions: form.questions.filter((q) => q.id !== id) });

  /* ── Document rules ── */
  const addDocumentRule = () =>
    updateForm({
      documentRules: [...form.documentRules, { id: genId(), condition: null, templateId: '', outputPattern: '', destinationPath: '', active: true }],
    });
  const updateDocumentRule = (id: string, patch: Partial<DocumentRule>) =>
    updateForm({ documentRules: form.documentRules.map((r) => r.id === id ? { ...r, ...patch } : r) });
  const removeDocumentRule = (id: string) =>
    updateForm({ documentRules: form.documentRules.filter((r) => r.id !== id) });

  /* ── Email rules ── */
  const addEmailRule = () =>
    updateForm({
      emailRules: [...form.emailRules, { id: genId(), condition: null, templateId: '', outputPattern: '', destinationPath: '', active: true, recipient: '' }],
    });
  const updateEmailRule = (id: string, patch: Partial<EmailRule>) =>
    updateForm({ emailRules: form.emailRules.map((r) => r.id === id ? { ...r, ...patch } : r) });
  const removeEmailRule = (id: string) =>
    updateForm({ emailRules: form.emailRules.filter((r) => r.id !== id) });

  /* ── Email schedule ── */
  const addEmailSchedule = () =>
    updateForm({
      emailSchedule: [...form.emailSchedule, { id: genId(), emailRuleId: '', daysBeforeDeployment: 0, label: '', description: '' }],
    });
  const updateEmailSchedule = (id: string, patch: Partial<EmailScheduleRule>) =>
    updateForm({ emailSchedule: form.emailSchedule.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const removeEmailSchedule = (id: string) =>
    updateForm({ emailSchedule: form.emailSchedule.filter((s) => s.id !== id) });

  /* ── Document schedule ── */
  const addDocumentSchedule = () =>
    updateForm({
      documentSchedule: [...form.documentSchedule, { id: genId(), documentRuleId: '', daysBeforeDeployment: 0, label: '', description: '', requiresAction: false }],
    });
  const updateDocumentSchedule = (id: string, patch: Partial<DocumentScheduleRule>) =>
    updateForm({ documentSchedule: form.documentSchedule.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const removeDocumentSchedule = (id: string) =>
    updateForm({ documentSchedule: form.documentSchedule.filter((s) => s.id !== id) });

  /* ── Question schedule ── */
  const addQuestionSchedule = () =>
    updateForm({
      questionSchedule: [...form.questionSchedule, { id: genId(), questionId: '', daysBeforeDeployment: 0, label: '', description: '', requiresAction: false }],
    });
  const updateQuestionSchedule = (id: string, patch: Partial<QuestionScheduleRule>) =>
    updateForm({ questionSchedule: form.questionSchedule.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const removeQuestionSchedule = (id: string) =>
    updateForm({ questionSchedule: form.questionSchedule.filter((s) => s.id !== id) });

  const getSectionCount = (id: string): number => {
    switch (id) {
      case 'identity':  return form.tags.length + form.options.length;
      case 'questions': return form.questions.length;
      case 'rules':     return form.documentRules.length + form.emailRules.length;
      case 'planning':  return form.emailSchedule.length + form.documentSchedule.length + form.questionSchedule.length;
      default:          return 0;
    }
  };

  const emailTemplates = templates.filter((t) => t.type === 'EMAIL');
  const docTemplates   = templates.filter((t) => t.type !== 'EMAIL');

  /* Helper: label lisible d'une option */
  const optionLabel = (optionId: string | undefined) =>
    form.options.find((o) => o.id === optionId)?.label || optionId || '';

  /* Helper: select condition — Select commun aux 3 entités */
  const ConditionSelect = ({
    value,
    onChange,
  }: {
    value: string | undefined;
    onChange: (v: string | null) => void;
  }) => (
    <Select
      value={value ?? NO_CONDITION}
      onValueChange={(v) => onChange(v !== NO_CONDITION ? v : null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Aucune condition" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CONDITION}>Aucune condition</SelectItem>
        {form.options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label || opt.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  /* ────────────────── RENDER ────────────────── */
  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Types de projets</h1>
          <p className="text-sm text-slate-500">
            Centralisez les paramètres des projets, règles et plannings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/configuration')}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuration
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau type de projet
          </button>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Liste des types de projets</CardTitle>
              <CardDescription>Filtrez et gérez les configurations actives.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un type..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              Aucun type de projet trouvé.
            </div>
          )}
          {filtered.map((project) => (
            <div
              key={project.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                  <Badge variant={project.status === 'published' ? 'default' : 'outline'}>
                    {project.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">{project.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Code {project.code}</Badge>
                  <Badge variant="outline">
                    {project.documentRules.length + project.emailRules.length} règles
                  </Badge>
                  <Badge variant="outline">{project.questions.length} questions</Badge>
                  <Badge variant="outline">
                    {(project.emailSchedule?.length ?? 0) +
                      (project.documentSchedule?.length ?? 0) +
                      (project.questionSchedule?.length ?? 0)}{' '}
                    planifications
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {project.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => publishProjectType(project.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" />
                    Publier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleEdit(project.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                >
                  <Pencil className="h-3 w-3" />
                  Modifier
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => exportSingleProjectType(project)}
                  className="inline-flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Exporter
                </Button>
                <button
                  type="button"
                  onClick={() => handleDelete(project.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ═══════════════════ EDITOR DIALOG ═══════════════════ */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent
          className="max-w-[60vw] w-[60vw] sm:max-w-[60vw] h-[78vh] max-h-[78vh] p-0 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col h-full min-h-0">

            {/* Dialog header */}
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {editorMode === 'create' ? 'Nouveau type de projet' : form.name || 'Éditer'}
              </h2>
              <p className="text-sm text-slate-500">
                Configurez les règles, questions et planning associés.
              </p>
            </div>

            {/* 2-column body */}
            <div className="grid grid-cols-[200px_3fr] overflow-hidden min-h-0 flex-1">

              {/* Left nav */}
              <div className="flex flex-col border-r border-slate-200 bg-slate-50">
                <div className="px-4 py-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Navigation
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const count = getSectionCount(section.id);
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                          activeSection === section.id
                            ? 'border-l-2 border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-transparent text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {section.label}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 shadow-sm">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right content */}
              <div className="overflow-y-auto h-full">
                <div className="px-8 py-10">

                  {/* ── IDENTITY ── */}
                  {activeSection === 'identity' && (
                    <div className="space-y-6">
                      <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-700">Nom *</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => updateForm({ name: e.target.value })}
                            placeholder="Nom du type"
                            className={inputCls}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-700">Code *</label>
                          <input
                            type="text"
                            value={form.code}
                            onChange={(e) => updateForm({ code: e.target.value })}
                            placeholder="Ex : PROD_A_PREM"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <Textarea
                          value={form.description}
                          onChange={(e) => updateForm({ description: e.target.value })}
                          placeholder="Décrivez le contexte"
                        />
                      </div>

                      {/* Tags */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {form.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Nouveau tag"
                            className="w-44 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-700">Options du projet</label>
                          <button
                            type="button"
                            onClick={addOption}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {form.options.length === 0 && (
                          <p className="text-sm text-slate-400 italic">Aucune option configurée.</p>
                        )}
                        <div className="space-y-2">
                          {form.options.map((opt) => (
                            <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                              <span className="font-mono text-xs text-slate-400 w-20 shrink-0 truncate">{opt.id}</span>
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => updateOption(opt.id, e.target.value)}
                                placeholder="Libellé de l'option"
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(opt.id)}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── QUESTIONS ── */}
                  {activeSection === 'questions' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">Questions prérequis</h3>
                          <p className="text-xs text-slate-500">Posées lors du lancement d'un projet.</p>
                        </div>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Ajouter
                        </button>
                      </div>
                      {form.questions.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-400">
                          Aucune question configurée.
                        </div>
                      )}
                      <div className="space-y-3">
                        {form.questions.map((q, idx) => (
                          <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeQuestion(q.id)}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={q.label}
                              onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                              placeholder="Intitulé de la question..."
                              className={inputCls}
                            />
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Type de réponse</label>
                                <Select
                                  value={q.answerType}
                                  onValueChange={(v) =>
                                    updateQuestion(q.id, { answerType: v as PrerequisiteQuestion['answerType'] })
                                  }
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Texte</SelectItem>
                                    <SelectItem value="yes-no">Oui / Non</SelectItem>
                                    <SelectItem value="dropdown">Liste</SelectItem>
                                    <SelectItem value="number">Nombre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Condition (option requise)</label>
                                <ConditionSelect
                                  value={q.condition?.optionId}
                                  onChange={(v) =>
                                    updateQuestion(q.id, { condition: v ? { optionId: v } : null })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={q.required}
                                onCheckedChange={(v) => updateQuestion(q.id, { required: v })}
                              />
                              <span className="text-sm text-slate-600">Obligatoire</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── RULES ── */}
                  {activeSection === 'rules' && (
                    <div className="space-y-8">

                      {/* Document rules */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-slate-400" /> Règles documents
                            </h3>
                            <p className="text-xs text-slate-500">Documents générés pour ce type de projet.</p>
                          </div>
                          <button
                            type="button"
                            onClick={addDocumentRule}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {form.documentRules.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
                            Aucune règle document.
                          </div>
                        )}
                        <div className="space-y-3">
                          {form.documentRules.map((rule) => (
                            <div key={rule.id} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">{rule.id}</span>
                                <button
                                  type="button"
                                  onClick={() => removeDocumentRule(rule.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Template</label>
                                <Select
                                  value={rule.templateId}
                                  onValueChange={(v) => updateDocumentRule(rule.id, { templateId: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choisir un template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {docTemplates.map((t) => (
                                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Nom de sortie</label>
                                  <input
                                    type="text"
                                    value={rule.outputPattern}
                                    onChange={(e) => updateDocumentRule(rule.id, { outputPattern: e.target.value })}
                                    placeholder="{{nom_client}}_contrat"
                                    className={inputCls}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Dossier destination</label>
                                  <input
                                    type="text"
                                    value={rule.destinationPath}
                                    onChange={(e) => updateDocumentRule(rule.id, { destinationPath: e.target.value })}
                                    placeholder="/Projets/2026"
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Condition (option requise)</label>
                                  <ConditionSelect
                                    value={rule.condition?.optionId}
                                    onChange={(v) =>
                                      updateDocumentRule(rule.id, { condition: v ? { optionId: v } : null })
                                    }
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                  <Switch
                                    checked={rule.active}
                                    onCheckedChange={(v) => updateDocumentRule(rule.id, { active: v })}
                                  />
                                  <span className="text-sm text-slate-600">Actif</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Email rules */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" /> Règles emails
                            </h3>
                            <p className="text-xs text-slate-500">Emails générés pour ce type de projet.</p>
                          </div>
                          <button
                            type="button"
                            onClick={addEmailRule}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {form.emailRules.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
                            Aucune règle email.
                          </div>
                        )}
                        <div className="space-y-3">
                          {form.emailRules.map((rule) => (
                            <div key={rule.id} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">{rule.id}</span>
                                <button
                                  type="button"
                                  onClick={() => removeEmailRule(rule.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Template email</label>
                                <Select
                                  value={rule.templateId}
                                  onValueChange={(v) => updateEmailRule(rule.id, { templateId: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choisir un template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {emailTemplates.map((t) => (
                                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Destinataire</label>
                                <input
                                  type="text"
                                  value={rule.recipient}
                                  onChange={(e) => updateEmailRule(rule.id, { recipient: e.target.value })}
                                  placeholder="{{contact_email}}"
                                  className={inputCls}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Nom de sortie</label>
                                  <input
                                    type="text"
                                    value={rule.outputPattern}
                                    onChange={(e) => updateEmailRule(rule.id, { outputPattern: e.target.value })}
                                    placeholder="Email_{{nom_client}}"
                                    className={inputCls}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Dossier destination</label>
                                  <input
                                    type="text"
                                    value={rule.destinationPath}
                                    onChange={(e) => updateEmailRule(rule.id, { destinationPath: e.target.value })}
                                    placeholder="/Emails/2026"
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Condition (option requise)</label>
                                  <ConditionSelect
                                    value={rule.condition?.optionId}
                                    onChange={(v) =>
                                      updateEmailRule(rule.id, { condition: v ? { optionId: v } : null })
                                    }
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                  <Switch
                                    checked={rule.active}
                                    onCheckedChange={(v) => updateEmailRule(rule.id, { active: v })}
                                  />
                                  <span className="text-sm text-slate-600">Actif</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── PLANNING ── */}
                  {activeSection === 'planning' && (
                    <div className="space-y-8">

                      {/* Email schedule */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" /> Planning emails
                          </h3>
                          <button
                            type="button"
                            onClick={addEmailSchedule}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {form.emailSchedule.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
                            Aucun envoi planifié.
                          </div>
                        )}
                        <div className="space-y-3">
                          {form.emailSchedule.map((s) => (
                            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">{s.id}</span>
                                <button type="button" onClick={() => removeEmailSchedule(s.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Règle email liée</label>
                                <Select value={s.emailRuleId} onValueChange={(v) => updateEmailSchedule(s.id, { emailRuleId: v })}>
                                  <SelectTrigger><SelectValue placeholder="Choisir une règle email" /></SelectTrigger>
                                  <SelectContent>
                                    {form.emailRules.map((r) => {
                                      const tmpl = emailTemplates.find((t) => t.id === r.templateId);
                                      const label = tmpl?.name || r.outputPattern || r.id;
                                      return <SelectItem key={r.id} value={r.id}>{label}</SelectItem>;
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Jours avant déploiement</label>
                                  <input
                                    type="number"
                                    value={s.daysBeforeDeployment}
                                    onChange={(e) => updateEmailSchedule(s.id, { daysBeforeDeployment: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Libellé</label>
                                  <input
                                    type="text"
                                    value={s.label}
                                    onChange={(e) => updateEmailSchedule(s.id, { label: e.target.value })}
                                    placeholder="Ex : Envoi dossier bienvenue"
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Description</label>
                                <input
                                  type="text"
                                  value={s.description}
                                  onChange={(e) => updateEmailSchedule(s.id, { description: e.target.value })}
                                  placeholder="Détails de l'envoi"
                                  className={inputCls}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Document schedule */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" /> Planning documents
                          </h3>
                          <button
                            type="button"
                            onClick={addDocumentSchedule}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {form.documentSchedule.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
                            Aucun document planifié.
                          </div>
                        )}
                        <div className="space-y-3">
                          {form.documentSchedule.map((s) => (
                            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">{s.id}</span>
                                <button type="button" onClick={() => removeDocumentSchedule(s.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Règle document liée</label>
                                <Select value={s.documentRuleId} onValueChange={(v) => updateDocumentSchedule(s.id, { documentRuleId: v })}>
                                  <SelectTrigger><SelectValue placeholder="Choisir une règle document" /></SelectTrigger>
                                  <SelectContent>
                                    {form.documentRules.map((r) => {
                                      const tmpl = docTemplates.find((t) => t.id === r.templateId);
                                      const label = tmpl?.name || r.outputPattern || r.id;
                                      return <SelectItem key={r.id} value={r.id}>{label}</SelectItem>;
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Jours avant déploiement</label>
                                  <input
                                    type="number"
                                    value={s.daysBeforeDeployment}
                                    onChange={(e) => updateDocumentSchedule(s.id, { daysBeforeDeployment: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Libellé</label>
                                  <input
                                    type="text"
                                    value={s.label}
                                    onChange={(e) => updateDocumentSchedule(s.id, { label: e.target.value })}
                                    placeholder="Ex : Envoi compte-rendu"
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Description</label>
                                <input
                                  type="text"
                                  value={s.description}
                                  onChange={(e) => updateDocumentSchedule(s.id, { description: e.target.value })}
                                  placeholder="Détails"
                                  className={inputCls}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={s.requiresAction}
                                  onCheckedChange={(v) => updateDocumentSchedule(s.id, { requiresAction: v })}
                                />
                                <span className="text-sm text-slate-600">Nécessite une action</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Question schedule */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-slate-400" /> Planning questions
                          </h3>
                          <button
                            type="button"
                            onClick={addQuestionSchedule}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {form.questionSchedule.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
                            Aucune question planifiée.
                          </div>
                        )}
                        <div className="space-y-3">
                          {form.questionSchedule.map((s) => (
                            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">{s.id}</span>
                                <button type="button" onClick={() => removeQuestionSchedule(s.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Question liée</label>
                                <Select value={s.questionId} onValueChange={(v) => updateQuestionSchedule(s.id, { questionId: v })}>
                                  <SelectTrigger><SelectValue placeholder="Choisir une question" /></SelectTrigger>
                                  <SelectContent>
                                    {form.questions.map((q) => (
                                      <SelectItem key={q.id} value={q.id}>{q.label || q.id}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Jours avant déploiement</label>
                                  <input
                                    type="number"
                                    value={s.daysBeforeDeployment}
                                    onChange={(e) => updateQuestionSchedule(s.id, { daysBeforeDeployment: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-500">Libellé</label>
                                  <input
                                    type="text"
                                    value={s.label}
                                    onChange={(e) => updateQuestionSchedule(s.id, { label: e.target.value })}
                                    placeholder="Ex : Relance question"
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-500">Description</label>
                                <input
                                  type="text"
                                  value={s.description}
                                  onChange={(e) => updateQuestionSchedule(s.id, { description: e.target.value })}
                                  placeholder="Détails"
                                  className={inputCls}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={s.requiresAction}
                                  onCheckedChange={(v) => updateQuestionSchedule(s.id, { requiresAction: v })}
                                />
                                <span className="text-sm text-slate-600">Nécessite une action</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Dialog footer */}
                <div className="border-t border-slate-200 bg-white px-6 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseEditor}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSimulateOptionIds([]); setShowSimulate(true); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors inline-flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Simuler
                    </button>
                    <button
                      type="button"
                      onClick={() => saveProject('draft')}
                      disabled={hasFormErrors}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enregistrer brouillon
                    </button>
                    <button
                      type="button"
                      onClick={() => saveProject('published')}
                      disabled={hasFormErrors}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ SIMULATE DIALOG ═══════════════════ */}
      <Dialog open={showSimulate} onOpenChange={setShowSimulate}>
        <DialogContent className="max-w-[52vw] w-[52vw] sm:max-w-[52vw] max-h-[82vh] overflow-y-auto">
          <div className="space-y-8 py-2">

            <div>
              <h2 className="text-xl font-semibold text-slate-900">Simulation de déclenchement</h2>
              <p className="text-sm text-slate-500 mt-1">
                Cochez les options pour visualiser les règles et questions activées.
              </p>
            </div>

            {/* Options checkboxes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Options actives</h3>
              {form.options.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucune option configurée.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {form.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={simulateOptionIds.includes(opt.id)}
                        onChange={(e) =>
                          setSimulateOptionIds((prev) =>
                            e.target.checked
                              ? [...prev, opt.id]
                              : prev.filter((id) => id !== opt.id)
                          )
                        }
                        className="rounded accent-indigo-600"
                      />
                      <span className="text-sm text-slate-700">{opt.label || opt.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Questions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                Questions déclenchées
                <Badge variant="outline" className="ml-1">{simActiveQuestions.length}</Badge>
              </h3>
              {simActiveQuestions.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucune question déclenchée.</p>
              ) : (
                <div className="space-y-2">
                  {simActiveQuestions.map((q) => {
                    const schedules = form.questionSchedule.filter((s) => s.questionId === q.id);
                    return (
                      <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{q.label || q.id}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{q.answerType}</Badge>
                              {q.condition ? (
                                <Badge variant="outline" className="text-xs text-violet-600 border-violet-200">
                                  Si : {optionLabel(q.condition.optionId)}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-slate-400">Toujours active</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {schedules.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            {schedules.map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {s.daysBeforeDeployment >= 0 ? `J+${s.daysBeforeDeployment}` : `J${s.daysBeforeDeployment}`}
                                {s.label ? ` — ${s.label}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Document rules */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Règles documents déclenchées
                <Badge variant="outline" className="ml-1">{simActiveDocRules.length}</Badge>
              </h3>
              {simActiveDocRules.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucune règle document déclenchée.</p>
              ) : (
                <div className="space-y-2">
                  {simActiveDocRules.map((rule) => {
                    const tmpl = docTemplates.find((t) => t.id === rule.templateId);
                    const schedules = form.documentSchedule.filter((s) => s.documentRuleId === rule.id);
                    return (
                      <div key={rule.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{tmpl?.name || rule.templateId || '—'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{rule.outputPattern}</p>
                          </div>
                          {rule.condition ? (
                            <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 shrink-0">
                              Si : {optionLabel(rule.condition.optionId)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-slate-400 shrink-0">Toujours active</Badge>
                          )}
                        </div>
                        {schedules.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            {schedules.map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {s.daysBeforeDeployment >= 0 ? `J+${s.daysBeforeDeployment}` : `J${s.daysBeforeDeployment}`}
                                {s.label ? ` — ${s.label}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Email rules */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                Règles emails déclenchées
                <Badge variant="outline" className="ml-1">{simActiveEmailRules.length}</Badge>
              </h3>
              {simActiveEmailRules.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucune règle email déclenchée.</p>
              ) : (
                <div className="space-y-2">
                  {simActiveEmailRules.map((rule) => {
                    const tmpl = emailTemplates.find((t) => t.id === rule.templateId);
                    const schedules = form.emailSchedule.filter((s) => s.emailRuleId === rule.id);
                    return (
                      <div key={rule.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{tmpl?.name || rule.templateId || '—'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{rule.recipient}</p>
                          </div>
                          {rule.condition ? (
                            <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 shrink-0">
                              Si : {optionLabel(rule.condition.optionId)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-slate-400 shrink-0">Toujours active</Badge>
                          )}
                        </div>
                        {schedules.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            {schedules.map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {s.daysBeforeDeployment >= 0 ? `J+${s.daysBeforeDeployment}` : `J${s.daysBeforeDeployment}`}
                                {s.label ? ` — ${s.label}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type de projet ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ProjectConfig;
