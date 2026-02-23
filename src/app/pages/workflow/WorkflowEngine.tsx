import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Braces,
  Check,
  ChevronLeft,
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
  Layers,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../context/AppContext';
import { useConsultants, type Consultant } from '../../hooks/useConsultants';
import { useDisponibilites, type Disponibilite } from '../../hooks/useDisponibilites';
import { usePrestationsProjet, type PrestationProjet } from '../../hooks/usePrestationsProjet';
import { usePacks, type Pack } from '../../hooks/usePacks';
import { useProjets } from '../../hooks/useProjets';
import { useReservations } from '../../hooks/useReservations';
import type { GeneratedFile, GenerationRecord, ProjectType } from '../../types';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
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
  selectedPackIds: string[];
  context: string;
  answers: Record<string, string>;
  deploymentDate: string;
  generationPlan: GeneratedFile[];
  generatedFiles: GeneratedFile[];
}

const STEPS = [
  { id: 1, label: 'Informations client', icon: User },
  { id: 2, label: 'Type de projet', icon: Briefcase },
  { id: 3, label: 'Options', icon: Layers },
  { id: 4, label: 'Questions prérequis', icon: HelpCircle },
  { id: 5, label: 'Packs', icon: Package },
  { id: 6, label: 'Réservations', icon: Calendar },
  { id: 7, label: 'Génération documents', icon: FileText },
  { id: 8, label: 'Terminé', icon: CheckCircle },
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
  selectedPackIds: [],
  context: '',
  answers: {},
  deploymentDate: '',
  generationPlan: [],
  generatedFiles: [],
});

type ReservationSlot = {
  morning: boolean;
  afternoon: boolean;
};

type ReservationDraft = {
  id: string;
  prestationId: string;
  consultantId: string;
  slots: Record<string, ReservationSlot>;
  date_debut: string;
  nb_jours: number;
  mode: 'sur_site' | 'distanciel';
  avec_trajet: boolean;
  commentaire: string;
};

type PrestationDraft = {
  id: string;
  label: string;
  jours_prevus: number;
  jours_supplementaires: number;
  annule: boolean;
  forfait: boolean;
  mode_defaut: 'sur_site' | 'distanciel';
  source: 'pack' | 'extra';
  competenceIds?: string[];
};

const formatDateFr = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const parseDateKey = (key: string) => new Date(`${key}T00:00:00`);

const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const weekdayIndex = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};
export default function WorkflowEngine() {
  const { projectTypes, templates, variables } = useApp();
  const location = useLocation();
  const projets = useProjets();
  const prestationsProjet = usePrestationsProjet();
  const reservationsState = useReservations();
  const consultantsState = useConsultants();
  const disponibilitesState = useDisponibilites();
  const packsState = usePacks();
  const prestationsProjetRef = useRef<PrestationProjet[]>([]);
  const [step, setStep] = useState(1);
  const [prestations, setPrestations] = useState<PrestationDraft[]>([]);
  const [reservations, setReservations] = useState<ReservationDraft[]>([]);
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
    prestationsProjetRef.current = prestationsProjet.items;
  }, [prestationsProjet.items]);

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
  const totalSteps = hasPlanning ? 8 : 7;
  const successStep = totalSteps + 1;
  const effectiveStep = step;

  const displaySteps = useMemo(() => {
    if (!hasPlanning) return STEPS;
    return [
      ...STEPS.slice(0, 6),
      { id: 7, label: 'Planning', icon: Calendar },
      { id: 8, label: 'Génération documents', icon: FileText },
      { id: 9, label: 'Terminé', icon: CheckCircle },
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
    if (step !== totalSteps || !selectedProjectType) return;

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
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleGoNext = () => {
    if (step === 5) {
      const newPrestations: PrestationDraft[] = [];
      for (const packId of state.selectedPackIds) {
        const pack = packsState.items.find((p) => p.id === packId);
        if (!pack) continue;
        for (const ligne of pack.lignes) {
          const l = ligne as Record<string, unknown>;
          newPrestations.push({
            id: Math.random().toString(36).slice(2, 10),
            label: String(l.label || ''),
            jours_prevus: Number(l.jours_prevus || 0),
            jours_supplementaires: Number(l.jours_supplementaires || 0),
            annule: false,
            forfait: Boolean(l.forfait),
            mode_defaut: (['sur_site', 'distanciel'].includes(String(l.mode_defaut))
              ? String(l.mode_defaut)
              : 'sur_site') as 'sur_site' | 'distanciel',
            source: 'pack',
            competenceIds: Array.isArray(l.competenceIds)
              ? (l.competenceIds as unknown[]).map(String)
              : [],
          });
        }
      }
      setPrestations(newPrestations);
    }
    goNext();
  };
  const goPrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const resetWizard = () => {
    setState(getInitialState());
    setPrestations([]);
    setReservations([]);
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
  const canProceedStep2 = !!state.selectedProjectTypeId;
  const canProceedStep3 = !requiresDeploymentDate || !!state.deploymentDate;

  const canProceedStep4 = useMemo(() => {
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

      const codeProjet = await projets.generateCodeProjet(state.clientNumber);
      const projectId = await projets.upsert(state.clientNumber, codeProjet, {
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

      if (!projectId) {
        throw new Error('Création du projet impossible.');
      }

      const prestationsToCreate = prestations.filter((item) => !item.annule);
      for (const item of prestationsToCreate) {
        await prestationsProjet.add({
          code_projet: codeProjet,
          prestation_id: item.id,
          label: item.label,
          jours_prevus: item.jours_prevus,
          jours_supplementaires: item.jours_supplementaires,
          annule: item.annule,
          forfait: item.forfait,
          mode_defaut: item.mode_defaut,
        });
      }

      await prestationsProjet.refresh();
      const createdPrestations = prestationsProjetRef.current.filter(
        (item) => item.code_projet === codeProjet
      );
      const prestationBuckets = new Map<string, PrestationProjet[]>();
      createdPrestations.forEach((item) => {
        const key = `${item.label}|${item.jours_prevus}|${item.jours_supplementaires}|${item.forfait}|${item.mode_defaut}`;
        const list = prestationBuckets.get(key) || [];
        list.push(item);
        prestationBuckets.set(key, list);
      });

      for (const reservation of reservations) {
        const prestation = prestations.find((item) => item.id === reservation.prestationId);
        if (!prestation) continue;
        const bucketKey = `${prestation.label}|${prestation.jours_prevus}|${prestation.jours_supplementaires}|${prestation.forfait}|${prestation.mode_defaut}`;
        const bucket = prestationBuckets.get(bucketKey) || [];
        const linkedPrestation = bucket.shift();
        if (!linkedPrestation) continue;

        await reservationsState.add({
          code_projet: codeProjet,
          prestation_projet_id: linkedPrestation.id,
          consultant_id: reservation.consultantId,
          date_debut: reservation.date_debut,
          nb_jours: reservation.nb_jours,
          mode: reservation.mode,
          avec_trajet_aller: reservation.avec_trajet,
          avec_trajet_retour: reservation.avec_trajet,
          commentaire: reservation.commentaire,
        });
      }

      setState((prev) => ({
        ...prev,
        generatedFiles: prev.generationPlan,
      }));
      setStep(successStep);
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
                <StepOptions
                  state={state}
                  updateState={setState}
                  projectType={selectedProjectType}
                />
              )}
              {step === 4 && (
                <StepQuestions
                  state={state}
                  updateState={setState}
                  questions={activeQuestions}
                />
              )}
              {step === 5 && (
                <StepPacks
                  state={state}
                  updateState={setState}
                  projectType={selectedProjectType}
                  allPacks={packsState.items}
                />
              )}
              {step === 6 && (
                <StepReservations
                  prestations={prestations}
                  reservations={reservations}
                  setPrestations={setPrestations}
                  setReservations={setReservations}
                  consultants={consultantsState.items}
                  disponibilites={disponibilitesState.items}
                />
              )}
              {step === 7 && !hasPlanning && (
                <StepSummary
                  state={state}
                  updateState={setState}
                  projectType={selectedProjectType}
                  questions={activeQuestions}
                />
              )}
              {step === 7 && hasPlanning && (
                <StepPlanning
                  scheduledEmails={scheduledEmails}
                  scheduledDocuments={scheduledDocuments}
                  scheduledQuestions={scheduledQuestions}
                  deploymentDate={state.deploymentDate}
                />
              )}
              {step === 8 && hasPlanning && (
                <StepSummary
                  state={state}
                  updateState={setState}
                  projectType={selectedProjectType}
                  questions={activeQuestions}
                />
              )}
              {step === successStep && (
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

        {step <= totalSteps && (
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

            {step === totalSteps ? (
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
                onClick={handleGoNext}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3) || (step === 4 && !canProceedStep4)}
                className={cn(
                  'px-8 py-2.5 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-all text-sm font-medium flex items-center gap-2',
                  ((step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3) || (step === 4 && !canProceedStep4)) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      {step === totalSteps && generationError && (
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

    </div>
  );
}

function StepOptions({
  state,
  updateState,
  projectType,
}: {
  state: WizardState;
  updateState: React.Dispatch<React.SetStateAction<WizardState>>;
  projectType: ProjectType | undefined;
}) {
  const hasSchedule = !!(
    projectType?.emailSchedule?.length ||
    projectType?.documentSchedule?.length ||
    projectType?.questionSchedule?.length
  );

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Options du projet</h2>
        <p className="text-slate-500 mt-2">Configurez les options spécifiques à ce type de projet.</p>
      </div>

      {!projectType ? (
        <p className="text-center text-slate-500 italic">Sélectionnez un type de projet à l'étape précédente.</p>
      ) : (
        <>
          {projectType.options?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectType.options.map((opt) => (
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
            <p className="text-slate-500 italic text-sm">Aucune option disponible pour ce type de projet.</p>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Contexte (optionnel)</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px]"
              placeholder="Ajoutez ici des détails spécifiques..."
              value={state.context}
              onChange={(e) => updateState((prev) => ({ ...prev, context: e.target.value }))}
            />
          </div>

          {hasSchedule && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de déploiement souhaitée <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={state.deploymentDate}
                onChange={(e) => updateState((prev) => ({ ...prev, deploymentDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Requise pour générer le planning d'envoi des emails.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StepPacks({
  state,
  updateState,
  projectType,
  allPacks,
}: {
  state: WizardState;
  updateState: React.Dispatch<React.SetStateAction<WizardState>>;
  projectType: ProjectType | undefined;
  allPacks: Pack[];
}) {
  const defaultPackIds: string[] = (projectType as unknown as { pack_ids?: string[] })?.pack_ids ?? [];

  // Pre-check default packs on first render
  React.useEffect(() => {
    if (defaultPackIds.length > 0 && state.selectedPackIds.length === 0) {
      updateState((prev) => ({ ...prev, selectedPackIds: defaultPackIds }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectType?.id]);

  const togglePack = (packId: string, checked: boolean) => {
    updateState((prev) => ({
      ...prev,
      selectedPackIds: checked
        ? [...prev.selectedPackIds, packId]
        : prev.selectedPackIds.filter((id) => id !== packId),
    }));
  };

  const selectedPacks = allPacks.filter((p) => state.selectedPackIds.includes(p.id));
  const totalLignes = selectedPacks.reduce((sum, p) => sum + p.lignes.length, 0);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Packs de prestations</h2>
        <p className="text-slate-500 mt-2">Sélectionnez les packs à inclure dans ce projet.</p>
      </div>

      {allPacks.length === 0 ? (
        <p className="text-center text-slate-500 italic">Aucun pack disponible.</p>
      ) : (
        <div className="space-y-3">
          {allPacks.map((pack) => {
            const isDefault = defaultPackIds.includes(pack.id);
            const isChecked = state.selectedPackIds.includes(pack.id);
            return (
              <label
                key={pack.id}
                className={cn(
                  'flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all',
                  isChecked ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  checked={isChecked}
                  onChange={(e) => togglePack(pack.id, e.target.checked)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{pack.label}</span>
                    {isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded border border-indigo-200">Par défaut</span>
                    )}
                  </div>
                  {pack.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{pack.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{pack.lignes.length} ligne(s) de prestation</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {totalLignes > 0 && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          {totalLignes} prestation(s) seront créées pour ce projet.
        </div>
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

function StepReservations({
  prestations,
  reservations,
  setPrestations,
  setReservations,
  consultants,
  disponibilites,
}: {
  prestations: PrestationDraft[];
  reservations: ReservationDraft[];
  setPrestations: React.Dispatch<React.SetStateAction<PrestationDraft[]>>;
  setReservations: React.Dispatch<React.SetStateAction<ReservationDraft[]>>;
  consultants: Consultant[];
  disponibilites: Disponibilite[];
}) {
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [prestationModalOpen, setPrestationModalOpen] = useState(false);
  const [activePrestationId, setActivePrestationId] = useState<string | null>(null);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Record<string, ReservationSlot>>({});
  const [mode, setMode] = useState<'sur_site' | 'distanciel'>('sur_site');
  const [avecTrajet, setAvecTrajet] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [newPrestationLabel, setNewPrestationLabel] = useState('');
  const [newPrestationDays, setNewPrestationDays] = useState('1');
  const [newPrestationMode, setNewPrestationMode] = useState<'sur_site' | 'distanciel'>('sur_site');

  const packPrestations = prestations.filter((item) => item.source === 'pack');
  const extraPrestations = prestations.filter((item) => item.source === 'extra');

  const activePrestation = prestations.find((item) => item.id === activePrestationId) || null;

  const activeConsultant = consultants.find((item) => item.id === selectedConsultantId) || null;
  const workingDays = useMemo(() => {
    if (!activeConsultant || !Array.isArray(activeConsultant.jours_travailles)) {
      return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    }
    if (activeConsultant.jours_travailles.length === 0) {
      return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    }
    return activeConsultant.jours_travailles
      .map((day) => String(day).toLowerCase())
      .filter((day) => dayNames.includes(day));
  }, [activeConsultant]);

  const isDayBlocked = (date: Date) => {
    const issues: string[] = [];
    const index = weekdayIndex(date);
    if (index >= 5) issues.push('Week-end');
    const dayName = dayNames[index];
    if (!workingDays.includes(dayName)) {
      issues.push('Jour non travaillé');
    }
    if (activeConsultant) {
      const day = startOfDay(date).getTime();
      disponibilites
        .filter((item) => item.consultant_id === activeConsultant.id)
        .forEach((item) => {
          const startDate = new Date(item.date_debut);
          const endDate = new Date(item.date_fin);
          if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return;
          const start = startOfDay(startDate).getTime();
          const end = startOfDay(endDate).getTime();
          if (day >= start && day <= end) {
            issues.push(`Indisponible (${item.type})`);
          }
        });
    }
    return issues;
  };

  const getConsultantLabel = (consultantId: string) => {
    const found = consultants.find((item) => item.id === consultantId);
    if (!found) return 'Non assigné';
    return `${found.nom} ${found.prenom}`.trim();
  };

  const getAvailabilityLabel = (consultantId: string) => {
    const today = startOfDay(new Date()).getTime();
    const hasBlock = disponibilites.some((item) => {
      if (item.consultant_id !== consultantId) return false;
      const startDate = new Date(item.date_debut);
      const endDate = new Date(item.date_fin);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return false;
      const start = startOfDay(startDate).getTime();
      const end = startOfDay(endDate).getTime();
      return today >= start && today <= end;
    });
    return hasBlock ? 'Indisponible' : 'Disponible';
  };

  const getCompetenceLevel = (consultant: Consultant | null, requiredIds?: string[]) => {
    if (!consultant || !Array.isArray(consultant.competences) || !requiredIds?.length) return 0;
    const levels = consultant.competences
      .map((item) => ({
        id: (item as { competence_id?: string }).competence_id || '',
        niveau: Number((item as { niveau?: number }).niveau || 0),
      }))
      .filter((item) => requiredIds.includes(item.id))
      .map((item) => item.niveau);
    return levels.length ? Math.max(...levels) : 0;
  };

  const filteredConsultants = useMemo(() => {
    if (!activePrestation?.competenceIds?.length) return consultants;
    return consultants.filter((consultant) => getCompetenceLevel(consultant, activePrestation.competenceIds) > 0);
  }, [activePrestation, consultants]);

  const openAddReservation = (prestationId: string) => {
    const target = prestations.find((item) => item.id === prestationId);
    setActivePrestationId(prestationId);
    setEditingReservationId(null);
    setSelectedConsultantId('');
    setSelectedSlots({});
    setMode(target?.mode_defaut === 'distanciel' ? 'distanciel' : 'sur_site');
    setAvecTrajet(false);
    setCommentaire('');
    setCalendarMonth(new Date());
    setReservationModalOpen(true);
  };

  const openEditReservation = (reservation: ReservationDraft) => {
    setActivePrestationId(reservation.prestationId);
    setEditingReservationId(reservation.id);
    setSelectedConsultantId(reservation.consultantId);
    setSelectedSlots(reservation.slots);
    setMode(reservation.mode);
    setAvecTrajet(reservation.avec_trajet);
    setCommentaire(reservation.commentaire);
    setCalendarMonth(reservation.date_debut ? new Date(reservation.date_debut) : new Date());
    setReservationModalOpen(true);
  };

  const toggleSlot = (dateKey: string, slot: 'morning' | 'afternoon') => {
    if (!activeConsultant) return;
    const date = parseDateKey(dateKey);
    if (isDayBlocked(date).length > 0) return;
    setSelectedSlots((prev) => {
      const current = prev[dateKey] || { morning: false, afternoon: false };
      const next = {
        ...prev,
        [dateKey]: {
          ...current,
          [slot]: !current[slot],
        },
      };
      if (!next[dateKey].morning && !next[dateKey].afternoon) {
        const copy = { ...next };
        delete copy[dateKey];
        return copy;
      }
      return next;
    });
  };

  const selectedDaysCount = useMemo(() => {
    return Object.values(selectedSlots).reduce((total, slots) => {
      const count = (slots.morning ? 0.5 : 0) + (slots.afternoon ? 0.5 : 0);
      return total + count;
    }, 0);
  }, [selectedSlots]);

  const totalSelectedDays = selectedDaysCount + (avecTrajet ? 1 : 0);

  const activeRemaining = useMemo(() => {
    if (!activePrestation) return 0;
    const planned = reservations
      .filter((item) => item.prestationId === activePrestation.id)
      .reduce((sum, item) => sum + item.nb_jours, 0);
    return activePrestation.jours_prevus + activePrestation.jours_supplementaires - planned;
  }, [activePrestation, reservations]);

  const exceedsRemaining = activePrestation ? totalSelectedDays > activeRemaining : false;

  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startIndex = weekdayIndex(monthStart);
    const start = new Date(monthStart);
    start.setDate(monthStart.getDate() - startIndex);
    return Array.from({ length: 42 }, (_, idx) => {
      const date = new Date(start);
      date.setDate(start.getDate() + idx);
      return date;
    });
  }, [calendarMonth]);

  const getReservationLabel = (reservation: ReservationDraft) => {
    const keys = Object.keys(reservation.slots).sort();
    if (keys.length === 0) return '';
    if (keys.length === 1) {
      const slot = reservation.slots[keys[0]];
      if (slot.morning && slot.afternoon) return 'Journée complète';
      if (slot.morning) return 'Matin';
      if (slot.afternoon) return 'Après-midi';
    }
    return 'Multi-jours';
  };

  const getReservationDateRange = (reservation: ReservationDraft) => {
    const keys = Object.keys(reservation.slots).sort();
    if (keys.length === 0) return '-';
    const start = parseDateKey(keys[0]);
    const end = parseDateKey(keys[keys.length - 1]);
    if (keys.length === 1) return formatDateFr(start);
    return `${formatDateFr(start)} - ${formatDateFr(end)}`;
  };

  const getLevelStyle = (level: number) => {
    if (level >= 3) return 'bg-green-100 text-green-700 border-green-200';
    if (level === 2) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (level === 1) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const handleConfirmReservation = () => {
    if (!activePrestation) return;
    if (totalSelectedDays <= 0 || exceedsRemaining) return;
    const keys = Object.keys(selectedSlots).sort();
    const dateDebut = keys.length ? keys[0] : '';

    setReservations((prev) => {
      if (editingReservationId) {
        return prev.map((item) =>
          item.id === editingReservationId
            ? {
                ...item,
                prestationId: activePrestation.id,
                consultantId: selectedConsultantId,
                slots: selectedSlots,
                date_debut: dateDebut,
                nb_jours: totalSelectedDays,
                mode,
                avec_trajet: avecTrajet,
                commentaire,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: Math.random().toString(36).slice(2, 10),
          prestationId: activePrestation.id,
          consultantId: selectedConsultantId,
          slots: selectedSlots,
          date_debut: dateDebut,
          nb_jours: totalSelectedDays,
          mode,
          avec_trajet: avecTrajet,
          commentaire,
        },
      ];
    });

    setReservationModalOpen(false);
  };

  const removeReservation = (reservationId: string) => {
    setReservations((prev) => prev.filter((item) => item.id !== reservationId));
  };

  const addExtraPrestation = () => {
    const label = newPrestationLabel.trim();
    const days = Number(newPrestationDays);
    if (!label || Number.isNaN(days)) return;
    setPrestations((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 10),
        label,
        jours_prevus: days,
        jours_supplementaires: 0,
        annule: false,
        forfait: false,
        mode_defaut: newPrestationMode,
        source: 'extra',
      },
    ]);
    setNewPrestationLabel('');
    setNewPrestationDays('1');
    setNewPrestationMode('sur_site');
    setPrestationModalOpen(false);
  };

  const renderPrestationCard = (item: PrestationDraft) => {
    const prestationReservations = reservations.filter((r) => r.prestationId === item.id);
    const planned = prestationReservations.reduce((sum, r) => sum + r.nb_jours, 0);
    const total = item.jours_prevus + item.jours_supplementaires;
    const remaining = total - planned;
    const plannedPercent = total > 0 ? Math.min((planned / total) * 100, 100) : 0;
    const remainingPercent = total > 0 ? Math.max(((total - planned) / total) * 100, 0) : 0;

    return (
      <div key={item.id} className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
            {item.forfait && (
              <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">Forfait</Badge>
            )}
          </div>
          <Button type="button" variant="outline" onClick={() => openAddReservation(item.id)}>
            + Ajouter une réservation
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
              Prévus : {total.toFixed(1)} j
            </Badge>
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200">
              Planifiés : {planned.toFixed(1)} j
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
              Restants : {remaining.toFixed(1)} j
            </Badge>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-blue-400" style={{ width: `${Math.min((item.jours_prevus / (total || 1)) * 100, 100)}%` }}></div>
            <div className="bg-orange-400" style={{ width: `${plannedPercent}%` }}></div>
            <div className="bg-emerald-400" style={{ width: `${remainingPercent}%` }}></div>
          </div>
        </div>

        {prestationReservations.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Aucune réservation pour cette prestation.</p>
        ) : (
          <div className="space-y-3">
            {prestationReservations.map((reservation) => {
              const consultant = consultants.find((c) => c.id === reservation.consultantId) || null;
              const level = getCompetenceLevel(consultant, item.competenceIds);
              return (
                <div key={reservation.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{getConsultantLabel(reservation.consultantId)}</span>
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full border ${getLevelStyle(level)}`}>
                          {level}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        {getReservationDateRange(reservation)} · {getReservationLabel(reservation)}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {reservation.mode === 'sur_site' ? 'Sur site' : 'Distanciel'} · {reservation.nb_jours.toFixed(1)} j
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditReservation(reservation)}>
                        Modifier
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeReservation(reservation.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Planification des réservations</h2>
        <p className="text-slate-500 mt-2">Affectez les consultants et planifiez les jours par prestation.</p>
      </div>

      <div className="space-y-6">
        {packPrestations.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Aucune prestation issue des packs pour le moment.</p>
        ) : (
          packPrestations.map(renderPrestationCard)
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Jours non vendus</Badge>
            <span className="text-sm text-slate-600">Prestations hors pack ajoutées manuellement.</span>
          </div>
          <Button type="button" variant="outline" onClick={() => setPrestationModalOpen(true)}>
            Ajouter une prestation
          </Button>
        </div>
        {extraPrestations.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Aucune prestation hors pack.</p>
        ) : (
          extraPrestations.map(renderPrestationCard)
        )}
      </div>

      <Dialog open={reservationModalOpen} onOpenChange={setReservationModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Réservation</DialogTitle>
          </DialogHeader>
          {!activePrestation ? (
            <p className="text-sm text-slate-500">Sélectionnez une prestation.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Consultant</Label>
                  <Select value={selectedConsultantId} onValueChange={setSelectedConsultantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un consultant" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredConsultants.map((consultant) => {
                        const level = getCompetenceLevel(consultant, activePrestation?.competenceIds);
                        const availability = getAvailabilityLabel(consultant.id);
                        return (
                          <SelectItem key={consultant.id} value={consultant.id}>
                            {consultant.nom} {consultant.prenom} · Niveau {level} · {availability}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={mode === 'sur_site' ? 'default' : 'outline'}
                      onClick={() => setMode('sur_site')}
                    >
                      Sur site
                    </Button>
                    <Button
                      type="button"
                      variant={mode === 'distanciel' ? 'default' : 'outline'}
                      onClick={() => setMode('distanciel')}
                    >
                      Distanciel
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Calendrier</Label>
                  <p className="text-xs text-slate-500">Sélectionnez les demi-journées disponibles.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-slate-700">
                    {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs text-slate-500">
                {dayLabels.map((label) => (
                  <div key={label} className="text-center font-semibold">
                    {label}
                  </div>
                ))}
              </div>

              <TooltipProvider>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date) => {
                    const dateKey = toDateKey(date);
                    const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                    const issues = activeConsultant ? isDayBlocked(date) : ['Sélectionnez un consultant'];
                    const blocked = issues.length > 0;
                    const slots = selectedSlots[dateKey] || { morning: false, afternoon: false };
                    const bothSelected = slots.morning && slots.afternoon;

                    const cell = (
                      <div
                        className={cn(
                          'border rounded-lg p-1 min-h-[64px] flex flex-col justify-between text-xs',
                          !isCurrentMonth && 'opacity-40',
                          blocked ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200'
                        )}
                      >
                        <div className="text-right text-[10px] text-slate-500">{date.getDate()}</div>
                        <div className={cn('flex h-8 w-full', bothSelected && 'bg-indigo-100 rounded')}>
                          <button
                            type="button"
                            onClick={() => toggleSlot(dateKey, 'morning')}
                            className={cn(
                              'flex-1 rounded-l border border-transparent',
                              slots.morning && !bothSelected && 'bg-blue-100',
                              blocked && 'cursor-not-allowed'
                            )}
                            disabled={blocked}
                          ></button>
                          <button
                            type="button"
                            onClick={() => toggleSlot(dateKey, 'afternoon')}
                            className={cn(
                              'flex-1 rounded-r border border-transparent',
                              slots.afternoon && !bothSelected && 'bg-orange-100',
                              blocked && 'cursor-not-allowed'
                            )}
                            disabled={blocked}
                          ></button>
                        </div>
                      </div>
                    );

                    if (!blocked) return <div key={dateKey}>{cell}</div>;

                    return (
                      <Tooltip key={dateKey}>
                        <TooltipTrigger asChild>{cell}</TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">{issues.join(' · ')}</div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Avec trajet</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={avecTrajet}
                      onCheckedChange={(value) => setAvecTrajet(Boolean(value))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-slate-600">Ajouter 1 jour (aller + retour)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Jours sélectionnés</Label>
                  <Input value={totalSelectedDays.toFixed(1)} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Commentaire</Label>
                  <Input value={commentaire} onChange={(event) => setCommentaire(event.target.value)} />
                </div>
              </div>

              {exceedsRemaining && (
                <div className="text-sm text-red-600">
                  Vous dépassez le nombre de jours restants
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReservationModalOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleConfirmReservation} disabled={totalSelectedDays <= 0 || exceedsRemaining}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prestationModalOpen} onOpenChange={setPrestationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle prestation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={newPrestationLabel} onChange={(event) => setNewPrestationLabel(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Jours prévus</Label>
              <Input type="number" min={0.5} step={0.5} value={newPrestationDays} onChange={(event) => setNewPrestationDays(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mode par défaut</Label>
              <Select value={newPrestationMode} onValueChange={(value) => setNewPrestationMode(value as 'sur_site' | 'distanciel')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sur_site">Sur site</SelectItem>
                  <SelectItem value="distanciel">Distanciel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPrestationModalOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={addExtraPrestation}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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


































































