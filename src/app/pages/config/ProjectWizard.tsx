import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  FileText,
  HelpCircle,
  Mail,
  Plus,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { cn } from '../../../lib/utils';
import { useApp } from '../../context/AppContext';
import { usePacks } from '../../hooks/usePacks';
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
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';

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
  pack_ids: string[];
};

const STEPS = [
  { id: 1, label: 'Identité', icon: User },
  { id: 2, label: 'Options', icon: Tag },
  { id: 3, label: 'Questions', icon: HelpCircle },
  { id: 4, label: 'Règles documents', icon: FileText },
  { id: 5, label: 'Règles emails', icon: Mail },
  { id: 6, label: 'Planning', icon: Calendar },
  { id: 7, label: 'Simulation', icon: CheckCircle },
];

const genId = () => Math.random().toString(36).slice(2, 10);

const emptyForm: ProjectForm = {
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
  pack_ids: [],
};

const toId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white';

const RuleTextField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={inputCls}
  />
);

export default function ProjectWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { projectTypes, templates, addProjectType, updateProjectType } = useApp();
  const { items: packs } = usePacks();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [newTag, setNewTag] = useState('');
  const [dropdownDrafts, setDropdownDrafts] = useState<Record<string, string>>({});
  const [simulatedOptions, setSimulatedOptions] = useState<string[]>([]);

  const isEditMode = !!id;
  const existingProject = useMemo(
    () => (id ? projectTypes.find((p) => p.id === id) : undefined),
    [id, projectTypes]
  );

  useEffect(() => {
    if (!isEditMode) {
      setForm(emptyForm);
      return;
    }
    if (existingProject) {
      setForm({
        name: existingProject.name,
        code: existingProject.code,
        description: existingProject.description,
        tags: existingProject.tags,
        status: existingProject.status,
        options: existingProject.options,
        questions: existingProject.questions,
        documentRules: existingProject.documentRules,
        emailRules: existingProject.emailRules,
        emailSchedule: (existingProject.emailSchedule ?? []).map((s) => ({
          ...s,
          requiresAction: s.requiresAction ?? false,
          generateOnWorkflow: s.generateOnWorkflow ?? false,
        })),
        documentSchedule: (existingProject.documentSchedule ?? []).map((s) => ({
          ...s,
          requiresAction: s.requiresAction ?? false,
          generateOnWorkflow: s.generateOnWorkflow ?? false,
        })),
        questionSchedule: (existingProject.questionSchedule ?? []).map((s) => ({
          ...s,
          requiresAction: s.requiresAction ?? false,
          generateOnWorkflow: s.generateOnWorkflow ?? false,
        })),
        pack_ids: existingProject.pack_ids ?? [],
      });
    }
  }, [existingProject, isEditMode]);

  const saveProject = (status: 'draft' | 'published') => {
    const normalizedDocumentRules = form.documentRules.map((rule) => ({
      ...rule,
      outputPattern: '',
    }));
    const normalizedEmailRules = form.emailRules.map((rule) => ({
      ...rule,
      outputPattern: '',
      recipient: '',
    }));

    const emailSchedule = form.emailSchedule.map((s) => {
      const rule = normalizedEmailRules.find((r) => r.id === s.emailRuleId);
      const tmpl = emailTemplates.find((t) => t.id === rule?.templateId);
      const base = tmpl?.name || rule?.templateId || 'Email';
      return {
        ...s,
        label: `${base} - J${s.daysBeforeDeployment}`,
        description: '',
        requiresAction: s.requiresAction ?? false,
        generateOnWorkflow: s.generateOnWorkflow ?? false,
      };
    });

    const documentSchedule = form.documentSchedule.map((s) => {
      const rule = normalizedDocumentRules.find((r) => r.id === s.documentRuleId);
      const tmpl = docTemplates.find((t) => t.id === rule?.templateId);
      const base = tmpl?.name || rule?.templateId || 'Document';
      return {
        ...s,
        label: `${base} - J${s.daysBeforeDeployment}`,
        description: '',
        requiresAction: s.requiresAction ?? false,
        generateOnWorkflow: s.generateOnWorkflow ?? false,
      };
    });

    const questionSchedule = form.questionSchedule.map((s) => {
      const question = form.questions.find((q) => q.id === s.questionId);
      const base = question?.label || 'Question';
      return {
        ...s,
        label: `${base} - J${s.daysBeforeDeployment}`,
        description: '',
        requiresAction: s.requiresAction ?? false,
        generateOnWorkflow: s.generateOnWorkflow ?? false,
      };
    });

    const payload = {
      ...form,
      documentRules: normalizedDocumentRules,
      emailRules: normalizedEmailRules,
      emailSchedule,
      documentSchedule,
      questionSchedule,
      status,
    };
    if (isEditMode && existingProject) {
      updateProjectType(existingProject.id, payload);
    } else {
      addProjectType(payload);
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || form.tags.includes(tag)) {
      setNewTag('');
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setNewTag('');
  };

  const removeTag = (tag: string) =>
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  const addOption = () =>
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { id: genId(), label: '' }],
    }));

  const updateOptionLabel = (idValue: string, label: string) =>
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === idValue ? { ...opt, label } : opt
      ),
    }));

  const removeOption = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== idValue),
    }));

  const addQuestion = () =>
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: genId(),
          label: '',
          answerType: 'text',
          required: false,
          condition: null,
        },
      ],
    }));

  const updateQuestion = (idValue: string, patch: Partial<PrerequisiteQuestion>) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === idValue ? { ...q, ...patch } : q
      ),
    }));

  const updateQuestionLabel = (idValue: string, label: string) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === idValue ? { ...q, label } : q
      ),
    }));

  const removeQuestion = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== idValue),
    }));

  const addDropdownOption = (questionId: string) => {
    const option = (dropdownDrafts[questionId] || '').trim();
    if (!option) return;
    updateQuestion(questionId, {
      dropdownOptions: [
        ...(form.questions.find((q) => q.id === questionId)?.dropdownOptions ??
          []),
        option,
      ],
    });
    setDropdownDrafts((prev) => ({ ...prev, [questionId]: '' }));
  };
  const parseDaysInput = (value: string, fallback: number) => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '-') return 0;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };
  const goNext = () => setStep((prev) => Math.min(STEPS.length, prev + 1));
  const goPrev = () => setStep((prev) => Math.max(1, prev - 1));

  const addDocumentRule = () =>
    setForm((prev) => ({
      ...prev,
      documentRules: [
        ...prev.documentRules,
        {
          id: genId(),
          condition: null,
          templateId: '',
          outputPattern: '',
          destinationPath: '',
          active: true,
        },
      ],
    }));

  const updateDocumentRule = (idValue: string, patch: Partial<DocumentRule>) =>
    setForm((prev) => ({
      ...prev,
      documentRules: prev.documentRules.map((r) =>
        r.id === idValue ? { ...r, ...patch } : r
      ),
    }));

  const removeDocumentRule = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      documentRules: prev.documentRules.filter((r) => r.id !== idValue),
    }));

  const addEmailRule = () =>
    setForm((prev) => ({
      ...prev,
      emailRules: [
        ...prev.emailRules,
        {
          id: genId(),
          condition: null,
          templateId: '',
          outputPattern: '',
          destinationPath: '',
          active: true,
          recipient: '',
        },
      ],
    }));

  const updateEmailRule = (idValue: string, patch: Partial<EmailRule>) =>
    setForm((prev) => ({
      ...prev,
      emailRules: prev.emailRules.map((r) =>
        r.id === idValue ? { ...r, ...patch } : r
      ),
    }));

  const removeEmailRule = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      emailRules: prev.emailRules.filter((r) => r.id !== idValue),
    }));

  const addEmailSchedule = () =>
    setForm((prev) => ({
      ...prev,
      emailSchedule: [
        ...prev.emailSchedule,
        {
          id: genId(),
          emailRuleId: '',
          daysBeforeDeployment: 0,
          label: '',
          description: '',
          generateOnWorkflow: false,
          requiresAction: false,
        },
      ],
    }));

  const updateEmailSchedule = (idValue: string, patch: Partial<EmailScheduleRule>) =>
    setForm((prev) => ({
      ...prev,
      emailSchedule: prev.emailSchedule.map((s) =>
        s.id === idValue ? { ...s, ...patch } : s
      ),
    }));

  const removeEmailSchedule = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      emailSchedule: prev.emailSchedule.filter((s) => s.id !== idValue),
    }));

  const addDocumentSchedule = () =>
    setForm((prev) => ({
      ...prev,
      documentSchedule: [
        ...prev.documentSchedule,
        {
          id: genId(),
          documentRuleId: '',
          daysBeforeDeployment: 0,
          label: '',
          description: '',
          requiresAction: false,
          generateOnWorkflow: false,
        },
      ],
    }));

  const updateDocumentSchedule = (idValue: string, patch: Partial<DocumentScheduleRule>) =>
    setForm((prev) => ({
      ...prev,
      documentSchedule: prev.documentSchedule.map((s) =>
        s.id === idValue ? { ...s, ...patch } : s
      ),
    }));

  const removeDocumentSchedule = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      documentSchedule: prev.documentSchedule.filter((s) => s.id !== idValue),
    }));

  const addQuestionSchedule = () =>
    setForm((prev) => ({
      ...prev,
      questionSchedule: [
        ...prev.questionSchedule,
        {
          id: genId(),
          questionId: '',
          daysBeforeDeployment: 0,
          label: '',
          description: '',
          requiresAction: false,
          generateOnWorkflow: false,
        },
      ],
    }));

  const updateQuestionSchedule = (idValue: string, patch: Partial<QuestionScheduleRule>) =>
    setForm((prev) => ({
      ...prev,
      questionSchedule: prev.questionSchedule.map((s) =>
        s.id === idValue ? { ...s, ...patch } : s
      ),
    }));

  const removeQuestionSchedule = (idValue: string) =>
    setForm((prev) => ({
      ...prev,
      questionSchedule: prev.questionSchedule.filter((s) => s.id !== idValue),
    }));

  const togglePack = (packId: string) => {
    setForm((prev) => ({
      ...prev,
      pack_ids: prev.pack_ids.includes(packId)
        ? prev.pack_ids.filter((idValue) => idValue !== packId)
        : [...prev.pack_ids, packId],
    }));
  };

  const docTemplates = templates.filter((t) => t.type !== 'EMAIL');
  const emailTemplates = templates.filter((t) => t.type === 'EMAIL');

  const simActiveQuestions = useMemo(
    () => getActiveQuestions(form.questions, simulatedOptions),
    [form.questions, simulatedOptions]
  );
  const simActiveDocRules = useMemo(
    () => getActiveDocumentRules(form.documentRules, simulatedOptions),
    [form.documentRules, simulatedOptions]
  );
  const simActiveEmailRules = useMemo(
    () => getActiveEmailRules(form.emailRules, simulatedOptions),
    [form.emailRules, simulatedOptions]
  );

  const planningPreview = useMemo(() => {
    const items = [
      ...form.emailSchedule.map((item) => {
        const rule = form.emailRules.find((r) => r.id === item.emailRuleId);
        const label =
          templates.find((t) => t.id === rule?.templateId)?.name || 'Email';
        return {
          id: item.id,
          type: 'email' as const,
          label,
          daysBeforeDeployment: item.daysBeforeDeployment,
          generateOnWorkflow: item.generateOnWorkflow ?? false,
          requiresAction: item.requiresAction ?? false,
          conditionOptionId: rule?.condition?.optionId,
        };
      }),
      ...form.documentSchedule.map((item) => {
        const rule = form.documentRules.find((r) => r.id === item.documentRuleId);
        const tmpl = templates.find((t) => t.id === rule?.templateId);
        return {
          id: item.id,
          type: 'document' as const,
          label: tmpl?.name || 'Document sans nom',
          daysBeforeDeployment: item.daysBeforeDeployment,
          generateOnWorkflow: item.generateOnWorkflow ?? false,
          requiresAction: item.requiresAction ?? false,
          conditionOptionId: rule?.condition?.optionId,
        };
      }),
      ...form.questionSchedule.map((item) => {
        const question = form.questions.find((q) => q.id === item.questionId);
        return {
          id: item.id,
          type: 'question' as const,
          label: question?.label || 'Question sans nom',
          daysBeforeDeployment: item.daysBeforeDeployment,
          generateOnWorkflow: item.generateOnWorkflow ?? false,
          requiresAction: item.requiresAction ?? false,
          conditionOptionId: question?.condition?.optionId,
        };
      }),
    ];

    return items.sort((a, b) => {
      const val = (i: (typeof items)[number]) =>
        i.generateOnWorkflow ? -Infinity : Number(i.daysBeforeDeployment);
      return val(a) - val(b);
    });
  }, [
    form.documentRules,
    form.documentSchedule,
    form.emailRules,
    form.emailSchedule,
    form.questionSchedule,
    form.questions,
    templates,
  ]);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button
        type="button"
        onClick={() => navigate('/configuration')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la configuration
      </button>

      <div className="mb-8">
        <div className="flex items-center justify-between relative h-16">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((s) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-white px-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : isCurrent
                      ? 'bg-white border-indigo-600 text-indigo-600 shadow-md ring-4 ring-indigo-50'
                      : 'bg-white border-slate-300 text-slate-400'
                  )}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-300 absolute top-12 w-32 text-center',
                    isCurrent ? 'text-indigo-700 font-bold' : 'text-slate-500'
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[520px] flex flex-col mt-12">
        <div className="p-8 flex-1 space-y-8">
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Identité du projet</h2>
                <p className="text-slate-500 mt-2">Définissez les informations générales du type de projet.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex : Intégration client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="EX: INT-CLIENT"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                    placeholder="Résumé du type de projet"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Tags</label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ajouter un tag et appuyer sur Entrée"
                />
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-2">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Brouillon</span>
                <Switch
                  checked={form.status === 'published'}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, status: checked ? 'published' : 'draft' }))
                  }
                />
                <span className="text-sm text-slate-600">Publié</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Options</h2>
                <p className="text-slate-500 mt-2">Configurez les options disponibles pour ce type de projet.</p>
              </div>
              {form.options.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
                  Aucune option définie.
                </div>
              )}
              <div className="space-y-4">
                {form.options.map((opt) => (
                  <div key={opt.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeOption(opt.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Label</label>
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateOptionLabel(opt.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ex : Urgent"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une option
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Questions prérequis</h2>
                <p className="text-slate-500 mt-2">Définissez les informations à collecter.</p>
              </div>
              {form.questions.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
                  Aucune question définie.
                </div>
              )}
              <div className="space-y-4">
                {form.questions.map((q) => (
                  <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Label</label>
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) => updateQuestionLabel(q.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ex : Date de démarrage"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500">Type de réponse</label>
                        <select
                          value={q.answerType}
                          onChange={(e) =>
                            updateQuestion(q.id, { answerType: e.target.value as PrerequisiteQuestion['answerType'] })
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                          <option value="text">Texte</option>
                          <option value="yes-no">Oui / Non</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="number">Nombre</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Condition d'affichage</label>
                        <select
                          value={q.condition?.optionId ?? ''}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              condition: e.target.value ? { optionId: e.target.value } : null,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                          <option value="">Toujours afficher</option>
                          {form.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label || opt.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {q.answerType === 'dropdown' && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500">Options possibles</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={dropdownDrafts[q.id] || ''}
                            onChange={(e) =>
                              setDropdownDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addDropdownOption(q.id);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ajouter une option et Entrée"
                          />
                          <button
                            type="button"
                            onClick={() => addDropdownOption(q.id)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(q.dropdownOptions || []).map((opt) => (
                            <Badge key={opt} variant="outline">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={q.required}
                        onCheckedChange={(checked) => updateQuestion(q.id, { required: checked })}
                      />
                      <span className="text-sm text-slate-600">Obligatoire</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une question
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Règles documents</h2>
                <p className="text-slate-500 mt-2">Définissez les règles de génération des documents.</p>
              </div>
              {form.documentRules.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
                  Aucune règle document définie.
                </div>
              )}
              <div className="space-y-4">
                {form.documentRules.map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeDocumentRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Template</label>
                      <select
                        value={rule.templateId}
                        onChange={(e) => updateDocumentRule(rule.id, { templateId: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">Choisir un template</option>
                        {docTemplates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Dossier destination</label>
                      <RuleTextField
                        value={rule.destinationPath}
                        onChange={(val) => updateDocumentRule(rule.id, { destinationPath: val })}
                        placeholder="/Projets/2026"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Condition</label>
                        <select
                          value={rule.condition?.optionId ?? ''}
                          onChange={(e) =>
                            updateDocumentRule(rule.id, {
                              condition: e.target.value ? { optionId: e.target.value } : null,
                            })
                          }
                          className={inputCls}
                        >
                          <option value="">Toujours</option>
                          {form.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label || opt.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Switch
                          checked={rule.active}
                          onCheckedChange={(checked) => updateDocumentRule(rule.id, { active: checked })}
                        />
                        <span className="text-sm text-slate-600">Actif</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addDocumentRule}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une règle document
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Règles emails</h2>
                <p className="text-slate-500 mt-2">Définissez les règles d'envoi d'emails.</p>
              </div>
              {form.emailRules.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
                  Aucune règle email définie.
                </div>
              )}
              <div className="space-y-4">
                {form.emailRules.map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeEmailRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Template email</label>
                      <select
                        value={rule.templateId}
                        onChange={(e) => updateEmailRule(rule.id, { templateId: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">Choisir un template</option>
                        {emailTemplates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Dossier destination</label>
                      <RuleTextField
                        value={rule.destinationPath}
                        onChange={(val) => updateEmailRule(rule.id, { destinationPath: val })}
                        placeholder="/Emails/2026"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Condition</label>
                        <select
                          value={rule.condition?.optionId ?? ''}
                          onChange={(e) =>
                            updateEmailRule(rule.id, {
                              condition: e.target.value ? { optionId: e.target.value } : null,
                            })
                          }
                          className={inputCls}
                        >
                          <option value="">Toujours</option>
                          {form.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label || opt.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Switch
                          checked={rule.active}
                          onCheckedChange={(checked) => updateEmailRule(rule.id, { active: checked })}
                        />
                        <span className="text-sm text-slate-600">Actif</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmailRule}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une règle email
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Planning</h2>
                <p className="text-slate-500 mt-2">Planifiez les envois et actions associées.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Packs de prestations associés</h3>
                </div>
                {packs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
                    Aucun pack disponible.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {packs.map((pack) => (
                      <label
                        key={pack.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.pack_ids.includes(pack.id)}
                          onChange={() => togglePack(pack.id)}
                          className="rounded accent-indigo-600"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{pack.label}</div>
                          <div className="text-xs text-slate-500">{pack.description || 'Sans description'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Emails planifiés</h3>
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
                    Aucun email planifié.
                  </div>
                )}
                <div className="space-y-3">
                  {form.emailSchedule.map((s) => (
                    <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">
                          {(() => {
                            const rule = form.emailRules.find((r) => r.id === s.emailRuleId);
                            const tmpl = templates.find((t) => t.id === rule?.templateId);
                            return tmpl?.name || 'Email sans nom';
                          })()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEmailSchedule(s.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Règle email</label>
                        <select
                          value={s.emailRuleId}
                          onChange={(e) => updateEmailSchedule(s.id, { emailRuleId: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">Choisir une règle</option>
                          {form.emailRules.map((r) => {
                            const tmpl = emailTemplates.find((t) => t.id === r.templateId);
                            const label = tmpl?.name || 'Template inconnu';
                            return (
                              <option key={r.id} value={r.id}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={s.generateOnWorkflow ?? false}
                          onChange={(e) =>
                            updateEmailSchedule(s.id, {
                              generateOnWorkflow: e.target.checked,
                              daysBeforeDeployment: e.target.checked ? 0 : s.daysBeforeDeployment,
                            })
                          }
                          className="rounded accent-indigo-600"
                        />
                        Générer lors de la prise en charge
                      </label>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Jours avant déploiement</label>
                        <input
                          type="text"
                          value={s.generateOnWorkflow ? 0 : s.daysBeforeDeployment}
                          onChange={(e) =>
                            updateEmailSchedule(s.id, {
                              daysBeforeDeployment: parseDaysInput(
                                e.target.value,
                                s.daysBeforeDeployment
                              ),
                            })
                          }
                          placeholder="Ex: -7 pour J-7"
                          disabled={s.generateOnWorkflow}
                          className={cn(
                            inputCls,
                            s.generateOnWorkflow && 'opacity-50 cursor-not-allowed'
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={s.requiresAction ?? false}
                          onCheckedChange={(checked) =>
                            updateEmailSchedule(s.id, { requiresAction: checked })
                          }
                        />
                        <span className="text-sm text-slate-600">Rappel utilisateur</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Documents planifiés</h3>
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
                    <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">
                          {(() => {
                            const rule = form.documentRules.find((r) => r.id === s.documentRuleId);
                            const tmpl = templates.find((t) => t.id === rule?.templateId);
                            return tmpl?.name || 'Document sans nom';
                          })()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocumentSchedule(s.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Règle document</label>
                        <select
                          value={s.documentRuleId}
                          onChange={(e) => updateDocumentSchedule(s.id, { documentRuleId: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">Choisir une règle</option>
                          {form.documentRules.map((r) => {
                            const tmpl = docTemplates.find((t) => t.id === r.templateId);
                            const label = tmpl?.name || 'Template inconnu';
                            return (
                              <option key={r.id} value={r.id}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={s.generateOnWorkflow ?? false}
                          onChange={(e) =>
                            updateDocumentSchedule(s.id, {
                              generateOnWorkflow: e.target.checked,
                              daysBeforeDeployment: e.target.checked ? 0 : s.daysBeforeDeployment,
                            })
                          }
                          className="rounded accent-indigo-600"
                        />
                        Générer lors de la prise en charge
                      </label>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Jours avant déploiement</label>
                        <input
                          type="text"
                          value={s.generateOnWorkflow ? 0 : s.daysBeforeDeployment}
                          onChange={(e) =>
                            updateDocumentSchedule(s.id, {
                              daysBeforeDeployment: parseDaysInput(
                                e.target.value,
                                s.daysBeforeDeployment
                              ),
                            })
                          }
                          placeholder="Ex: -7 pour J-7"
                          disabled={s.generateOnWorkflow}
                          className={cn(
                            inputCls,
                            s.generateOnWorkflow && 'opacity-50 cursor-not-allowed'
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={s.requiresAction}
                          onCheckedChange={(checked) => updateDocumentSchedule(s.id, { requiresAction: checked })}
                        />
                        <span className="text-sm text-slate-600">Rappel utilisateur</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Questions planifiées</h3>
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
                    <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">
                          {form.questions.find((q) => q.id === s.questionId)?.label || 'Question sans nom'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuestionSchedule(s.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Question liée</label>
                        <select
                          value={s.questionId}
                          onChange={(e) => updateQuestionSchedule(s.id, { questionId: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">Choisir une question</option>
                          {form.questions.map((q) => (
                            <option key={q.id} value={q.id}>
                              {q.label || q.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={s.generateOnWorkflow ?? false}
                          onChange={(e) =>
                            updateQuestionSchedule(s.id, {
                              generateOnWorkflow: e.target.checked,
                              daysBeforeDeployment: e.target.checked ? 0 : s.daysBeforeDeployment,
                            })
                          }
                          className="rounded accent-indigo-600"
                        />
                        Générer lors de la prise en charge
                      </label>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Jours avant déploiement</label>
                        <input
                          type="text"
                          value={s.generateOnWorkflow ? 0 : s.daysBeforeDeployment}
                          onChange={(e) =>
                            updateQuestionSchedule(s.id, {
                              daysBeforeDeployment: parseDaysInput(
                                e.target.value,
                                s.daysBeforeDeployment
                              ),
                            })
                          }
                          placeholder="Ex: -7 pour J-7"
                          disabled={s.generateOnWorkflow}
                          className={cn(
                            inputCls,
                            s.generateOnWorkflow && 'opacity-50 cursor-not-allowed'
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={s.requiresAction}
                          onCheckedChange={(checked) => updateQuestionSchedule(s.id, { requiresAction: checked })}
                        />
                        <span className="text-sm text-slate-600">Rappel utilisateur</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Simulation</h2>
                <p className="text-slate-500 mt-2">Visualisez les éléments activés selon les options.</p>
              </div>

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
                          checked={simulatedOptions.includes(opt.id)}
                          onChange={(e) =>
                            setSimulatedOptions((prev) =>
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

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                    Questions activées
                    <Badge variant="outline" className="ml-1">{simActiveQuestions.length}</Badge>
                  </h3>
                  {simActiveQuestions.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Aucune question activée.</p>
                  ) : (
                    <div className="space-y-2">
                      {simActiveQuestions.map((q) => (
                        <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{q.label || q.id}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Règles documents activées
                    <Badge variant="outline" className="ml-1">{simActiveDocRules.length}</Badge>
                  </h3>
                  {simActiveDocRules.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Aucune règle document activée.</p>
                  ) : (
                    <div className="space-y-2">
                      {simActiveDocRules.map((rule) => {
                        const tmpl = docTemplates.find((t) => t.id === rule.templateId);
                        const outputPattern = rule.outputPattern?.trim();
                        return (
                          <div key={rule.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">
                              {tmpl?.name || 'Template inconnu'}
                            </p>
                            {outputPattern && (
                              <p className="text-xs text-slate-500 mt-0.5">{outputPattern}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Règles emails activées
                    <Badge variant="outline" className="ml-1">{simActiveEmailRules.length}</Badge>
                  </h3>
                  {simActiveEmailRules.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Aucune règle email activée.</p>
                  ) : (
                    <div className="space-y-2">
                      {simActiveEmailRules.map((rule) => {
                        const tmpl = emailTemplates.find((t) => t.id === rule.templateId);
                        const trigger = rule.condition
                          ? form.options.find((opt) => opt.id === rule.condition?.optionId)?.label || rule.condition?.optionId
                          : '';
                        return (
                          <div key={rule.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">
                              {tmpl?.name || 'Template inconnu'}
                            </p>
                            {trigger && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                Déclenché par : {trigger}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Aperçu du planning
                    <Badge variant="outline" className="ml-1">{planningPreview.length}</Badge>
                  </h3>
                  {planningPreview.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">
                      Aucun élément planifié configuré.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {planningPreview.map((item) => {
                        const isWorkflow = item.generateOnWorkflow;
                        const days = item.daysBeforeDeployment;
                        const timingBadge = isWorkflow
                          ? { label: 'Prise en charge', cls: 'bg-indigo-100 text-indigo-700' }
                          : days < 0
                          ? { label: `J${days}`, cls: 'bg-amber-100 text-amber-700' }
                          : days === 0
                          ? { label: 'Déploiement', cls: 'bg-slate-100 text-slate-600' }
                          : { label: `J+${days}`, cls: 'bg-blue-100 text-blue-700' };

                        const Icon =
                          item.type === 'email'
                            ? Mail
                            : item.type === 'document'
                            ? FileText
                            : HelpCircle;

                        const conditionOption = item.conditionOptionId
                          ? form.options.find((opt) => opt.id === item.conditionOptionId)
                          : undefined;
                        const isInactive =
                          conditionOption && !simulatedOptions.includes(conditionOption.id);

                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            className={cn(
                              'flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3',
                              isInactive && 'opacity-40'
                            )}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <Icon className="h-4 w-4 text-slate-400 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-sm text-slate-800 truncate block">{item.label}</span>
                                {conditionOption && (
                                  <span className="text-xs text-slate-500 block">
                                    Si : {conditionOption.label || conditionOption.id}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${timingBadge.cls}`}>
                                {timingBadge.label}
                              </span>
                              {isInactive && (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                  Inactif
                                </span>
                              )}
                              {item.requiresAction && (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                                  Rappel utilisateur
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {simActiveQuestions.length === 0 &&
                  simActiveDocRules.length === 0 &&
                  simActiveEmailRules.length === 0 && (
                    <p className="text-sm text-slate-400 italic">
                      Aucun élément activé pour la sélection actuelle.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              step === 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                saveProject('draft');
                navigate('/configuration');
              }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50"
            >
              Enregistrer brouillon
            </button>
            {step === STEPS.length ? (
              <button
                type="button"
                onClick={() => {
                  saveProject('published');
                  navigate('/configuration');
                }}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 text-sm font-medium"
              >
                Publier
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 text-sm font-medium flex items-center gap-2"
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
