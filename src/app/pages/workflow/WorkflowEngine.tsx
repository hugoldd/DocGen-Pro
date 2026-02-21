import React, { useEffect, useMemo, useState } from 'react';
import {
  Braces,
  Check,
  ChevronRight,
  User,
  Briefcase,
  HelpCircle,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { GeneratedFile, GenerationRecord, ProjectType } from '../../types';
import {
  buildGenerationPlan,
  buildScheduledEmails,
  buildScheduledDocuments,
  buildScheduledQuestions,
  getActiveQuestions,
} from '../../utils/engine';
import { useLocation } from 'react-router';
import PlanningView from '../../components/PlanningView';

type Contact = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
};

interface WizardState {
  clientName: string;
  clientNumber: string;
  contacts: Contact[];
  selectedProjectTypeId: string;
  selectedOptionIds: string[];
  context: string;
  answers: Record<string, string>;
  deploymentDate: string;
  generationPlan: GeneratedFile[];
  generatedFiles: GeneratedFile[];
}

const STEPS = [
  { id: 1, label: 'Informations client', icon: User },
  { id: 2, label: 'Type de projet', icon: Briefcase },
  { id: 3, label: 'Questions prérequis', icon: HelpCircle },
  { id: 4, label: 'Récapitulatif', icon: FileText },
  { id: 5, label: 'Terminé', icon: CheckCircle },
];

const createContact = (): Contact => ({
  id: Math.random().toString(36).slice(2, 10),
  name: '',
  role: '',
  email: '',
  phone: '',
});

const getInitialState = (): WizardState => ({
  clientName: '',
  clientNumber: '',
  contacts: [createContact()],
  selectedProjectTypeId: '',
  selectedOptionIds: [],
  context: '',
  answers: {},
  deploymentDate: '',
  generationPlan: [],
  generatedFiles: [],
});

export default function WorkflowEngine() {
  const { projectTypes, templates, addRecord, variables } = useApp();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(getInitialState());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showVariables, setShowVariables] = useState(false);
  const [variablesSearch, setVariablesSearch] = useState('');

  const publishedProjectTypes = useMemo(
    () => projectTypes.filter((pt) => pt.status === 'published'),
    [projectTypes]
  );

  useEffect(() => {
    const prefill = (location.state as {
      prefill?: Partial<{
        clientName: string;
        clientNumber: string;
        projectTypeId: string;
        contacts: Contact[];
        answers: Record<string, string>;
        selectedOptionIds: string[];
        context: string;
        deploymentDate: string;
      }>;
    })?.prefill;
    if (!prefill) return;
    const hasProjectType = prefill.projectTypeId
      ? projectTypes.some((pt) => pt.id === prefill.projectTypeId)
      : false;
    setState((prev) => ({
      ...prev,
      clientName: prefill.clientName ?? prev.clientName,
      clientNumber: prefill.clientNumber ?? prev.clientNumber,
      contacts: prefill.contacts?.length ? prefill.contacts : prev.contacts,
      selectedProjectTypeId: hasProjectType
        ? prefill.projectTypeId || ''
        : prev.selectedProjectTypeId,
      selectedOptionIds: hasProjectType ? (prefill.selectedOptionIds || []) : [],
      answers: hasProjectType ? (prefill.answers || {}) : {},
      context: prefill.context ?? prev.context,
      deploymentDate: prefill.deploymentDate ?? prev.deploymentDate,
    }));
  }, [location.state, projectTypes]);

  const selectedProjectType = useMemo(
    () => projectTypes.find((pt) => pt.id === state.selectedProjectTypeId),
    [projectTypes, state.selectedProjectTypeId]
  );

  const hasPlanning = !!(
    state.deploymentDate && (
      selectedProjectType?.emailSchedule?.length ||
      selectedProjectType?.documentSchedule?.length ||
      selectedProjectType?.questionSchedule?.length
    )
  );
  const totalSteps = hasPlanning ? 6 : 5;
  const effectiveStep = !hasPlanning && step === 6 ? 5 : step;

  const displaySteps = useMemo(() => {
    if (!hasPlanning) return STEPS;
    return [
      ...STEPS.slice(0, 4),
      { id: 5, label: 'Planning', icon: Calendar },
      { id: 6, label: 'Terminé', icon: CheckCircle },
    ];
  }, [hasPlanning]);

  const clientValues = useMemo(
    () => ({
      nom_client: state.clientName,
      numero_client: state.clientNumber,
      type_projet: selectedProjectType?.name || '',
      contact_name: state.contacts[0]?.name || '',
      contact_email: state.contacts[0]?.email || '',
      contact_1_nom: state.contacts[0]?.name || '',
      contact_1_email: state.contacts[0]?.email || '',
      contact_1_role: state.contacts[0]?.role || '',
      contact_1_telephone: state.contacts[0]?.phone || '',
      contact_2_nom: state.contacts[1]?.name || '',
      contact_2_email: state.contacts[1]?.email || '',
      contact_2_role: state.contacts[1]?.role || '',
      contact_2_telephone: state.contacts[1]?.phone || '',
      contact_3_nom: state.contacts[2]?.name || '',
      contact_3_email: state.contacts[2]?.email || '',
      contact_3_role: state.contacts[2]?.role || '',
      contact_3_telephone: state.contacts[2]?.phone || '',
      ...state.answers,
    }),
    [
      state.clientName,
      state.clientNumber,
      state.contacts,
      state.answers,
      selectedProjectType,
    ]
  );

  const activeQuestions = useMemo(
    () =>
      selectedProjectType
        ? getActiveQuestions(selectedProjectType.questions, state.selectedOptionIds)
        : [],
    [selectedProjectType, state.selectedOptionIds]
  );

  const scheduledEmails = useMemo<NonNullable<GenerationRecord['scheduledEmails']>>(
    () => {
      if (!selectedProjectType || !hasPlanning) return [];
      return buildScheduledEmails(
        selectedProjectType,
        state.deploymentDate,
        clientValues,
        templates
      );
    },
    [selectedProjectType, hasPlanning, state.deploymentDate, clientValues, templates]
  );

  const scheduledDocuments = useMemo<NonNullable<GenerationRecord['scheduledDocuments']>>(
    () => {
      if (!selectedProjectType || !state.deploymentDate) return [];
      return buildScheduledDocuments(
        selectedProjectType,
        state.deploymentDate,
        templates
      );
    },
    [selectedProjectType, state.deploymentDate, templates]
  );

  const scheduledQuestions = useMemo<NonNullable<GenerationRecord['scheduledQuestions']>>(
    () => {
      if (!selectedProjectType || !state.deploymentDate) return [];
      return buildScheduledQuestions(
        selectedProjectType,
        state.deploymentDate
      );
    },
    [selectedProjectType, state.deploymentDate]
  );

  useEffect(() => {
    if (step !== 4 || !selectedProjectType) return;

    const plan = buildGenerationPlan(
      selectedProjectType,
      state.selectedOptionIds,
      clientValues,
      templates
    );

    setState((prev) => {
      const same =
        prev.generationPlan.length === plan.length &&
        prev.generationPlan.every(
          (p, i) =>
            p.name === plan[i]?.name &&
            p.type === plan[i]?.type &&
            p.templateId === plan[i]?.templateId &&
            p.destinationPath === plan[i]?.destinationPath
        );
      return same ? prev : { ...prev, generationPlan: plan };
    });
  }, [
    step,
    selectedProjectType,
    state.clientName,
    state.clientNumber,
    state.contacts,
    state.answers,
    state.selectedOptionIds,
    clientValues,
    templates,
  ]);

  const showToast = (message: string, duration = 2000) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), duration);
  };

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(`{{${key}}}`);
    } catch {
      // ignore clipboard errors
    }
    showToast('Copié !', 1500);
  };

  const variableSections = useMemo(() => {
    const clientKeys = ['nom_client', 'numero_client', 'type_projet'];
    const interlocutorKeys = [
      'contact_1_nom',
      'contact_1_email',
      'contact_1_role',
      'contact_1_telephone',
      'contact_2_nom',
      'contact_2_email',
      'contact_2_role',
      'contact_2_telephone',
      'contact_3_nom',
      'contact_3_email',
      'contact_3_role',
      'contact_3_telephone',
    ];

    const dictionaryEntries = Object.keys(variables).map((key) => ({
      key,
      label: variables[key] || '',
    }));
    const responseEntries =
      selectedProjectType?.questions.map((q) => ({ key: q.id, label: q.label })) || [];

    return [
      {
        label: 'Client',
        items: clientKeys.map((key) => ({ key, label: variables[key] || '' })),
      },
      {
        label: 'Interlocuteurs',
        items: interlocutorKeys.map((key) => ({ key, label: variables[key] || '' })),
      },
      {
        label: 'Dictionnaire',
        items: dictionaryEntries,
      },
      {
        label: 'Réponses',
        items: responseEntries,
      },
    ];
  }, [selectedProjectType, variables]);

  const filteredVariableSections = useMemo(() => {
    const term = variablesSearch.trim().toLowerCase();
    if (!term) return variableSections;
    return variableSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const keyMatch = item.key.toLowerCase().includes(term);
          const labelMatch = (item.label || '').toLowerCase().includes(term);
          return keyMatch || labelMatch;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [variableSections, variablesSearch]);

  const goNext = () => {
    setStep((prev) => {
      if (prev === 4 && !hasPlanning) return 6;
      return Math.min(prev + 1, 6);
    });
  };
  const goPrev = () => {
    setStep((prev) => {
      if (prev === 6 && !hasPlanning) return 4;
      return Math.max(prev - 1, 1);
    });
  };

  const resetWizard = () => {
    setState(getInitialState());
    setStep(1);
    setIsGenerating(false);
    setGenerationError('');
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const removeContact = (id: string) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  };

  const addContact = () => {
    setState((prev) => ({
      ...prev,
      contacts: [...prev.contacts, createContact()],
    }));
  };

  const canProceedStep1 = useMemo(() => {
    if (!state.clientName.trim()) return false;
    if (!state.clientNumber.trim()) return false;
    if (!state.contacts.length) return false;
    if (state.contacts.some((c) => !c.name.trim())) return false;
    return true;
  }, [state.clientName, state.clientNumber, state.contacts]);

  const requiresDeploymentDate = !!(
    selectedProjectType?.emailSchedule?.length ||
    selectedProjectType?.documentSchedule?.length ||
    selectedProjectType?.questionSchedule?.length
  );
  const canProceedStep2 =
    !!state.selectedProjectTypeId && (!requiresDeploymentDate || !!state.deploymentDate);

  const canProceedStep3 = useMemo(() => {
    if (!activeQuestions.length) return true;
    return activeQuestions.every((q) => {
      if (!q.required) return true;
      const value = state.answers[q.id];
      return value !== undefined && String(value).trim() !== '';
    });
  }, [activeQuestions, state.answers]);

  const handleGenerate = async () => {
    if (!selectedProjectType || state.generationPlan.length === 0) return;
    setIsGenerating(true);
    setGenerationError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      addRecord({
        clientName: state.clientName,
        clientNumber: state.clientNumber,
        projectTypeId: selectedProjectType.id,
        filesGenerated: state.generationPlan,
        contacts: state.contacts,
        answers: state.answers,
        selectedOptionIds: state.selectedOptionIds,
        context: state.context,
        deploymentDate: state.deploymentDate || undefined,
        scheduledEmails: hasPlanning ? scheduledEmails : undefined,
        scheduledDocuments: state.deploymentDate
          ? buildScheduledDocuments(selectedProjectType, state.deploymentDate, templates)
          : undefined,
        scheduledQuestions: state.deploymentDate
          ? buildScheduledQuestions(selectedProjectType, state.deploymentDate)
          : undefined,
        status: 'success',
      });

      setState((prev) => ({
        ...prev,
        generatedFiles: prev.generationPlan,
      }));
      setStep(hasPlanning ? 5 : 6);
    } catch (error) {
      setGenerationError('Une erreur est survenue pendant la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowVariables((prev) => !prev)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
        >
          <Braces className="w-4 h-4" />
          Balises
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((effectiveStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>

          {displaySteps.map((s) => {
            const isCompleted = effectiveStep > s.id;
            const isCurrent = effectiveStep === s.id;

            return (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
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
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {step === 1 && (
                <StepClientInfo
                  state={state}
                  updateState={setState}
                  addContact={addContact}
                  updateContact={updateContact}
                  removeContact={removeContact}
                />
              )}
              {step === 2 && (
                <StepProjectSelection
                  state={state}
                  updateState={setState}
                  projectTypes={publishedProjectTypes}
                />
              )}
              {step === 3 && (
                <StepQuestions
                  state={state}
                  updateState={setState}
                  questions={activeQuestions}
                />
              )}
              {step === 4 && (
                <StepSummary
                  state={state}
                  updateState={setState}
                  projectType={selectedProjectType}
                  questions={activeQuestions}
                />
              )}
              {step === 5 && hasPlanning && (
                <StepPlanning
                  scheduledEmails={scheduledEmails}
                  scheduledDocuments={scheduledDocuments}
                  scheduledQuestions={scheduledQuestions}
                  deploymentDate={state.deploymentDate}
                />
              )}
              {step === 6 && (
                <StepSuccess
                  state={state}
                  projectType={selectedProjectType}
                  onDownload={async (doc) => {
                    const template = templates.find((t) => t.id === doc.templateId);
                    if (!template) {
                      showToast('Le template associé est introuvable.');
                      return;
                    }

                    try {
                      const { generateFile } = await import('../../utils/fileGenerator');
                      const blob = await generateFile(template, clientValues);
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = doc.name || 'document';
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      showToast('La génération du fichier a échoué.');
                    }
                  }}
                  onReset={resetWizard}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 6 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
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

            {step === 4 ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || state.generationPlan.length === 0}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Générer les documents
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3)}
                className={cn(
                  'px-8 py-2.5 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-all text-sm font-medium flex items-center gap-2',
                  ((step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3)) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      {step === 4 && generationError && (
        <div className="px-6 pb-6 text-sm text-red-600">{generationError}</div>
      )}
      </div>

      {showVariables && (
        <aside className="fixed top-24 right-6 w-80 max-h-[calc(100vh-6rem)] bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex flex-col z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une balise..."
              value={variablesSearch}
              onChange={(e) => setVariablesSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div className="mt-4 space-y-4 overflow-auto overflow-y-auto flex-1">
            {filteredVariableSections.map((section) => (
              <div key={section.label}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                  {section.label}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isResponses = section.label === 'Réponses';
                    const resolvedValue = isResponses
                      ? (state.answers[item.key] || '')
                      : (clientValues as Record<string, string>)[item.key] || '';
                    const displayValue = resolvedValue
                      ? resolvedValue.length > 20
                        ? `${resolvedValue.slice(0, 20)}…`
                        : resolvedValue
                      : '—';
                    return (
                      <div
                        key={`${section.label}-${item.key}`}
                        className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleCopy(item.key)}
                          className="font-mono text-xs text-indigo-500 hover:text-indigo-700 shrink-0"
                          title={item.label || item.key}
                        >
                          {isResponses ? item.label || item.key : `{{${item.key}}}`}
                        </button>
                        <span className="text-xs text-slate-400 truncate max-w-[120px] text-right">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredVariableSections.length === 0 && (
              <p className="text-sm text-slate-500 italic">Aucune balise trouvée.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function StepClientInfo({
  state,
  updateState,
  addContact,
  updateContact,
  removeContact,
}: {
  state: WizardState;
  updateState: React.Dispatch<React.SetStateAction<WizardState>>;
  addContact: () => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  removeContact: (id: string) => void;
}) {
  const nameError = !state.clientName.trim();
  const numberError = !state.clientNumber.trim();
  const contactErrors = state.contacts.map((c) => !c.name.trim());

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Informations client</h2>
        <p className="text-slate-500 mt-2">Renseignez les détails du client pour personnaliser les documents.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom du client <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            placeholder="Ex: Entreprise SAS"
            value={state.clientName}
            onChange={(e) => updateState((prev) => ({ ...prev, clientName: e.target.value }))}
          />
          {nameError && <p className="text-xs text-red-500 mt-1">Le nom du client est requis.</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Numéro client <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            placeholder="Ex: C-2026-001"
            value={state.clientNumber}
            onChange={(e) => updateState((prev) => ({ ...prev, clientNumber: e.target.value }))}
          />
          {numberError && <p className="text-xs text-red-500 mt-1">Le numéro client est requis.</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <label className="block text-sm font-medium text-slate-900">Interlocuteurs</label>
          <button onClick={addContact} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter un interlocuteur
          </button>
        </div>

        {state.contacts.map((contact, idx) => (
          <div key={contact.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:shadow-md">
            {state.contacts.length > 1 && (
              <button onClick={() => removeContact(contact.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Nom complet <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:border-indigo-500 outline-none"
                  placeholder="Jean Dupont"
                />
                {contactErrors[idx] && (
                  <p className="text-xs text-red-500 mt-1">Le nom de l'interlocuteur est requis.</p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Rôle / Poste</label>
                <input
                  type="text"
                  value={contact.role}
                  onChange={(e) => updateContact(contact.id, { role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:border-indigo-500 outline-none"
                  placeholder="Directeur"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Email</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:border-indigo-500 outline-none"
                  placeholder="jean@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Téléphone</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:border-indigo-500 outline-none"
                  placeholder="06..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepProjectSelection({
  state,
  updateState,
  projectTypes,
}: {
  state: WizardState;
  updateState: React.Dispatch<React.SetStateAction<WizardState>>;
  projectTypes: ProjectType[];
}) {
  const selectedProject = projectTypes.find((pt) => pt.id === state.selectedProjectTypeId);
  const hasSchedule = !!(
    selectedProject?.emailSchedule?.length ||
    selectedProject?.documentSchedule?.length ||
    selectedProject?.questionSchedule?.length
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Type de projet</h2>
        <p className="text-slate-500 mt-2">Sélectionnez le cadre de la mission pour charger les bons templates.</p>
      </div>

      {projectTypes.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500">Aucun type de projet publié pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projectTypes.map((pt) => (
            <div
              key={pt.id}
              onClick={() =>
                updateState((prev) => ({
                  ...prev,
                  selectedProjectTypeId: pt.id,
                  selectedOptionIds: [],
                  answers: {},
                  generationPlan: [],
                }))
              }
              className={cn(
                'cursor-pointer rounded-xl border-2 p-6 transition-all hover:shadow-lg flex flex-col items-center text-center gap-4 relative overflow-hidden',
                state.selectedProjectTypeId === pt.id
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-indigo-200'
              )}
            >
              {state.selectedProjectTypeId === pt.id && (
                <div className="absolute top-2 right-2 text-indigo-600">
                  <CheckCircle className="w-5 h-5 fill-indigo-100" />
                </div>
              )}
              <span className="text-4xl">{pt.code.slice(0, 3)}</span>
              <div>
                <h3 className="font-semibold text-slate-900">{pt.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-1 uppercase">{pt.code}</p>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{pt.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.selectedProjectTypeId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 pt-8 border-t border-slate-100"
        >
          <h3 className="font-semibold text-slate-900 mb-4">Options du projet</h3>

          {projectTypes
            .find((pt) => pt.id === state.selectedProjectTypeId)
            ?.options.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectTypes
                .find((pt) => pt.id === state.selectedProjectTypeId)
                ?.options.map((opt) => (
                  <label key={opt.id} className="flex items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                      checked={state.selectedOptionIds.includes(opt.id)}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          selectedOptionIds: e.target.checked
                            ? [...prev.selectedOptionIds, opt.id]
                            : prev.selectedOptionIds.filter((id) => id !== opt.id),
                        }))
                      }
                    />
                  <div className="ml-3">
                    <span className="font-medium text-slate-700 block">{opt.label}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic text-sm">Aucune option disponible pour ce projet.</p>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Contexte (optionnel)</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px]"
              placeholder="Ajoutez ici des détails spécifiques..."
              value={state.context}
              onChange={(e) => updateState((prev) => ({ ...prev, context: e.target.value }))}
            ></textarea>
          </div>

          {hasSchedule && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de déploiement souhaitée <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={state.deploymentDate}
                onChange={(e) =>
                  updateState((prev) => ({ ...prev, deploymentDate: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Requise pour générer le planning d'envoi des emails.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function StepQuestions({
  state,
  updateState,
  questions,
}: {
  state: WizardState;
  updateState: React.Dispatch<React.SetStateAction<WizardState>>;
  questions: ProjectType['questions'];
}) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Questions prérequis</h2>
        <p className="text-slate-500 mt-2">Répondez aux questions spécifiques pour configurer les variables.</p>
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-slate-500 italic">Aucun prérequis pour cette sélection.</p>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {q.label} {q.required && <span className="text-red-500">*</span>}
              </label>

                            {q.answerType === 'text' && (
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Réponse..."
                  value={state.answers[q.id] || ''}
                  onChange={(e) =>
                    updateState((prev) => ({
                      ...prev,
                      answers: { ...prev.answers, [q.id]: e.target.value },
                    }))
                  }
                />
              )}

              {q.answerType === 'number' && (
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0"
                  value={state.answers[q.id] || ''}
                  onChange={(e) =>
                    updateState((prev) => ({
                      ...prev,
                      answers: { ...prev.answers, [q.id]: e.target.value },
                    }))
                  }
                />
              )}

              {q.answerType === 'dropdown' && (
                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                    value={state.answers[q.id] || ''}
                    onChange={(e) =>
                      updateState((prev) => ({
                        ...prev,
                        answers: { ...prev.answers, [q.id]: e.target.value },
                      }))
                    }
                  >
                    <option value="">Sélectionner...</option>
                    {(q.dropdownOptions || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                </div>
              )}

              {q.answerType === 'yes-no' && (
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value="Oui"
                      checked={state.answers[q.id] === 'Oui'}
                      onChange={() =>
                        updateState((prev) => ({
                          ...prev,
                          answers: { ...prev.answers, [q.id]: 'Oui' },
                        }))
                      }
                    />
                    Oui
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value="Non"
                      checked={state.answers[q.id] === 'Non'}
                      onChange={() =>
                        updateState((prev) => ({
                          ...prev,
                          answers: { ...prev.answers, [q.id]: 'Non' },
                        }))
                      }
                    />
                    Non
                  </label>
                </div>
              )}

              {q.required && !(state.answers[q.id] || '').trim() && (
                <p className="text-xs text-red-500 mt-1">Ce champ est requis.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepSummary({
  state,
  updateState,
  projectType,
  questions,
}: {
  state: WizardState;
  updateState: React.Dispatch<React.SetStateAction<WizardState>>;
  projectType: ProjectType | undefined;
  questions: ProjectType['questions'];
}) {
  const destinationHint = state.generationPlan[0]?.destinationPath || '-';

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Récapitulatif avant génération</h2>
        <p className="text-slate-500 mt-2">Vérifiez les informations. Les documents seront générés automatiquement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Client
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs uppercase">Nom</span>
                <span className="font-medium text-slate-900">{state.clientName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase">Numéro client</span>
                <span className="font-medium text-slate-900">{state.clientNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase">Contact principal</span>
                <span className="font-medium text-slate-900">{state.contacts[0]?.name || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" /> Projet
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs uppercase">Type</span>
                <span className="font-medium text-slate-900">{projectType?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase">Options actives</span>
                <div className="flex flex-wrap gap-1 mt-1">
                    {state.selectedOptionIds.length > 0 ? (
                    state.selectedOptionIds
                      .map((optId) =>
                        projectType?.options.find((o) => o.id === optId)?.label
                      )
                      .filter((label): label is string => Boolean(label))
                      .map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs border border-indigo-200"
                        >
                          {label}
                        </span>
                      ))
                  ) : (
                    <span className="text-slate-400 italic">Aucune</span>
                  )}
                </div>
              </div>
              {state.context && (
                <div>
                  <span className="text-slate-500 block text-xs uppercase">Contexte</span>
                  <span className="text-slate-700 text-sm">{state.context}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500" /> Pré-requis
            </h3>
            {questions.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Aucun prérequis renseigné.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {questions.map((q) => (
                  <div key={q.id}>
                    <span className="text-slate-500 block text-xs uppercase">{q.label}</span>
                    <span className="font-medium text-slate-900">{state.answers[q.id] || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Documents à générer ({state.generationPlan.length})</h3>
              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">Destination: {destinationHint}</span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Nom du fichier</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Chemin de destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.generationPlan.length > 0 ? (
                    state.generationPlan.map((doc, idx) => (
                      <tr key={`${doc.templateId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-700 text-xs sm:text-sm">
                          {doc.name}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'px-2 py-1 rounded text-xs font-bold',
                              doc.type === 'PDF'
                                ? 'bg-red-100 text-red-700'
                                : doc.type === 'EMAIL'
                                ? 'bg-amber-100 text-amber-700'
                                : doc.type === 'XLSX'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            )}
                          >
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={doc.destinationPath}
                            onChange={(e) =>
                              updateState((prev) => {
                                const next = [...prev.generationPlan];
                                next[idx] = { ...next[idx], destinationPath: e.target.value };
                                return { ...prev, generationPlan: next };
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 font-mono outline-none focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-amber-600 italic">
                        Aucun document à générer pour la sélection actuelle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPlanning({
  scheduledEmails,
  scheduledDocuments,
  scheduledQuestions,
  deploymentDate,
}: {
  scheduledEmails: NonNullable<GenerationRecord['scheduledEmails']>;
  scheduledDocuments: NonNullable<GenerationRecord['scheduledDocuments']>;
  scheduledQuestions: NonNullable<GenerationRecord['scheduledQuestions']>;
  deploymentDate: string;
}) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Planning des envois</h2>
        <p className="text-slate-500 mt-2">
          Vérifiez les dates prévues avant de finaliser la génération.
        </p>
      </div>
      <PlanningView
        scheduledEmails={scheduledEmails}
        scheduledDocuments={scheduledDocuments}
        scheduledQuestions={scheduledQuestions}
        deploymentDate={deploymentDate}
      />
    </div>
  );
}

function StepSuccess({
  state,
  projectType,
  onDownload,
  onReset,
}: {
  state: WizardState;
  projectType: ProjectType | undefined;
  onDownload: (doc: GeneratedFile) => void;
  onReset: () => void;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto py-8">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10" />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-2">Génération réussie !</h2>
      <p className="text-slate-600 mb-8">Les documents ont été créés et enregistrés.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left mb-8">
        <div className="divide-y divide-slate-100">
          {state.generatedFiles.map((doc, i) => (
            <div key={`${doc.templateId}-${i}`} className="p-4 flex items-center justify-between hover:bg-slate-50 group">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400 truncate font-mono">{doc.destinationPath}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Ouvrir">
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Télécharger"
                  onClick={() => onDownload(doc)}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {state.generatedFiles.length === 0 && (
            <div className="p-6 text-center text-slate-500">Aucun fichier généré.</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div>
          <p className="font-medium">Téléchargement local uniquement</p>
          <p className="text-xs mt-1 text-amber-700">
            Les fichiers sont téléchargés dans votre dossier Téléchargements. Le dépôt automatique vers les chemins de destination (SharePoint, réseau) n'est pas encore disponible.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <span className="text-sm text-slate-500">Projet : {projectType?.name || '-'}</span>
        <button onClick={onReset} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          Nouvelle prise en charge
        </button>
      </div>
    </div>
  );
}



























