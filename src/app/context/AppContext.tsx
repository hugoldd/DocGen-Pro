import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  Template,
  ProjectType,
  GenerationRecord,
} from '../types';

type AddRecordPayload = Omit<GenerationRecord, 'id' | 'date'>;

interface AppContextType {
  templates: Template[];
  projectTypes: ProjectType[];
  variables: Record<string, string>;
  records: GenerationRecord[];
  addTemplate: (template: Omit<Template, 'id' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  addProjectType: (projectType: Omit<ProjectType, 'id'>) => void;
  updateProjectType: (id: string, updates: Partial<ProjectType>) => void;
  deleteProjectType: (id: string) => void;
  publishProjectType: (id: string) => void;
  addVariable: (key: string, label: string) => void;
  updateVariable: (key: string, label: string) => void;
  deleteVariable: (key: string) => void;
  addRecord: (record: AddRecordPayload) => void;
  deleteRecord: (id: string) => void;
  getRecords: () => GenerationRecord[];
  markEmailAsSent: (recordId: string, emailId: string) => void;
  unmarkEmailAsSent: (recordId: string, emailId: string) => void;
  markDocumentAsSent: (recordId: string, documentId: string) => void;
  unmarkDocumentAsSent: (recordId: string, documentId: string) => void;
  markQuestionAsSent: (recordId: string, questionId: string) => void;
  unmarkQuestionAsSent: (recordId: string, questionId: string) => void;
  resetAllData: () => void;
}

const nowIso = () => new Date().toISOString();
const generateId = () => Math.random().toString(36).slice(2, 10);

const STORAGE_VERSION = '3';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (localStorage.getItem('docgen_version') !== STORAGE_VERSION) {
      localStorage.clear();
      localStorage.setItem('docgen_version', STORAGE_VERSION);
      return fallback;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silencieux
  }
}

const INITIAL_VARIABLES: Record<string, string> = {
  nom_client: 'Nom du client',
  numero_client: 'Numéro client',
  contact_name: 'Nom du contact',
  contact_email: 'Email du contact',
  type_projet: 'Type de projet',
  date_debut: 'Date de début',
};

const INITIAL_PROJECT_TYPES: ProjectType[] = [
  {
    id: 'pt1',
    name: 'Produit A — Premium',
    code: 'PROD_A_PREM',
    description: "Projet premium avec options d'assistance et d'assurance.",
    tags: ['Premium', 'Vente'],
    status: 'published',
    options: [
      { id: 'opt_assurance', label: 'Assurance annulation' },
      { id: 'opt_support', label: 'Support 24/7' },
    ],
    questions: [
      {
        id: 'q_start',
        label: 'Date de début souhaitée',
        answerType: 'text',
        required: true,
        condition: null,
      },
      {
        id: 'q_assurance',
        label: "Avez-vous besoin de l'assurance annulation ?",
        answerType: 'yes-no',
        required: true,
        condition: { optionId: 'opt_assurance' },
      },
    ],
    documentRules: [
      {
        id: 'dr1',
        condition: null,
        templateId: 't_doc_1',
        outputPattern: '{{nom_client}}_{{type_projet}}_contrat',
        destinationPath: '/Projets/2026/Contrats',
        active: true,
      },
      {
        id: 'dr2',
        condition: { optionId: 'opt_assurance' },
        templateId: 't_doc_2',
        outputPattern: '{{nom_client}}_Annexe_Assurance',
        destinationPath: '/Projets/2026/Contrats',
        active: true,
      },
    ],
    emailRules: [
      {
        id: 'er1',
        condition: null,
        templateId: 't_email_1',
        outputPattern: 'Email_Bienvenue_{{nom_client}}',
        destinationPath: '/Emails/2026',
        active: true,
        recipient: '{{contact_email}}',
      },
    ],
    emailSchedule: [
      {
        id: 'es1',
        emailRuleId: 'er1',
        daysBeforeDeployment: -7,
        label: 'Envoi du dossier de bienvenue',
        description: 'Documents contractuels envoyés 1 semaine avant le déploiement',
      },
      {
        id: 'es2',
        emailRuleId: 'er1',
        daysBeforeDeployment: 0,
        label: 'Email de lancement',
        description: 'Confirmation du démarrage le jour J',
      },
    ],
  },
  {
    id: 'pt2',
    name: 'Consulting — Standard',
    code: 'CONSULT_STD',
    description: 'Mission de conseil standard avec cadrage initial.',
    tags: ['Service'],
    status: 'draft',
    options: [
      { id: 'opt_kickoff', label: 'Atelier de lancement' },
      { id: 'opt_audit', label: 'Audit initial' },
    ],
    questions: [
      {
        id: 'q_scope',
        label: 'Périmètre de la mission',
        answerType: 'text',
        required: true,
        condition: null,
      },
      {
        id: 'q_audit',
        label: 'Souhaitez-vous inclure un audit ? (Oui/Non)',
        answerType: 'yes-no',
        required: false,
        condition: { optionId: 'opt_audit' },
      },
    ],
    documentRules: [
      {
        id: 'dr3',
        condition: null,
        templateId: 't_doc_3',
        outputPattern: '{{nom_client}}_Lettre_Mission',
        destinationPath: '/Projets/2026/Consulting',
        active: true,
      },
    ],
    emailRules: [],
  },
];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 't_doc_1',
    name: 'Contrat cadre v2',
    type: 'DOCX',
    projectTypeId: 'pt1',
    content: 'Contrat pour {{nom_client}} — Type: {{type_projet}}',
    variables: ['nom_client', 'type_projet'],
    linkedTemplateIds: [],
    status: 'published',
    updatedAt: '2026-02-19T10:30:00.000Z',
  },
  {
    id: 't_doc_2',
    name: 'Annexe assurance',
    type: 'PDF',
    projectTypeId: 'pt1',
    content: 'Annexe assurance pour {{nom_client}}',
    variables: ['nom_client'],
    linkedTemplateIds: [],
    status: 'published',
    updatedAt: '2026-02-18T14:10:00.000Z',
  },
  {
    id: 't_doc_3',
    name: 'Lettre de mission',
    type: 'DOCX',
    projectTypeId: 'pt2',
    content: 'Lettre de mission — Client: {{nom_client}}',
    variables: ['nom_client'],
    linkedTemplateIds: [],
    status: 'draft',
    updatedAt: '2026-02-17T09:00:00.000Z',
  },
  {
    id: 't_email_1',
    name: 'Email de bienvenue',
    type: 'EMAIL',
    projectTypeId: 'pt1',
    content: 'Bonjour {{contact_name}}, bienvenue chez {{nom_client}}.',
    variables: ['contact_name', 'nom_client'],
    linkedTemplateIds: [],
    status: 'published',
    updatedAt: '2026-02-19T08:20:00.000Z',
  },
];

const INITIAL_RECORDS: GenerationRecord[] = [
  {
    id: 'gr1',
    date: '2026-02-19T14:30:00.000Z',
    clientName: 'TechSolutions SAS',
    clientNumber: 'C-2026-042',
    projectTypeId: 'pt1',
    status: 'success',
    deploymentDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    scheduledEmails: [
      {
        id: 'se1',
        date: new Date(Date.now() + 8 * 86400000).toISOString(),
        label: 'Envoi du dossier de bienvenue',
        description: 'Documents contractuels envoyés 1 semaine avant le déploiement',
        templateId: 't_email_1',
        templateName: 'Email de bienvenue',
        recipient: 'contact@techsolutions.fr',
      },
      {
        id: 'se2',
        date: new Date(Date.now() + 15 * 86400000).toISOString(),
        label: 'Email de lancement',
        description: 'Confirmation du démarrage le jour J',
        templateId: 't_email_1',
        templateName: 'Email de bienvenue',
        recipient: 'contact@techsolutions.fr',
      },
    ],
    filesGenerated: [
      {
        name: 'TechSolutions_ProduitA_Contrat.docx',
        type: 'DOCX',
        templateId: 't_doc_1',
        destinationPath: '/Projets/2026/Contrats',
      },
      {
        name: 'TechSolutions_Annexe_Assurance.pdf',
        type: 'PDF',
        templateId: 't_doc_2',
        destinationPath: '/Projets/2026/Contrats',
      },
    ],
  },
  {
    id: 'gr2',
    date: '2026-02-18T11:15:00.000Z',
    clientName: 'Cabinet Moreau',
    clientNumber: 'C-2026-041',
    projectTypeId: 'pt2',
    status: 'error',
    filesGenerated: [],
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>(
    () => loadFromStorage('docgen_templates', INITIAL_TEMPLATES)
  );
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>(
    () => loadFromStorage('docgen_projectTypes', INITIAL_PROJECT_TYPES)
  );
  const [variables, setVariables] = useState<Record<string, string>>(
    () => loadFromStorage('docgen_variables', INITIAL_VARIABLES)
  );
  const [records, setRecords] = useState<GenerationRecord[]>(
    () => loadFromStorage('docgen_records', INITIAL_RECORDS)
  );

  useEffect(() => { saveToStorage('docgen_templates', templates); }, [templates]);
  useEffect(() => { saveToStorage('docgen_projectTypes', projectTypes); }, [projectTypes]);
  useEffect(() => { saveToStorage('docgen_variables', variables); }, [variables]);
  useEffect(() => { saveToStorage('docgen_records', records); }, [records]);

  const addTemplate = (template: Omit<Template, 'id' | 'updatedAt'>) => {
    const newTemplate: Template = {
      ...template,
      id: generateId(),
      updatedAt: nowIso(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: nowIso() } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const duplicateTemplate = (id: string) => {
    setTemplates((prev) => {
      const original = prev.find((t) => t.id === id);
      if (!original) return prev;
      const copy: Template = {
        ...original,
        id: generateId(),
        name: `${original.name} (copie)`,
        status: 'draft',
        updatedAt: nowIso(),
      };
      return [...prev, copy];
    });
  };

  const addProjectType = (projectType: Omit<ProjectType, 'id'>) => {
    const newProjectType: ProjectType = {
      ...projectType,
      id: generateId(),
    };
    setProjectTypes((prev) => [...prev, newProjectType]);
  };

  const updateProjectType = (id: string, updates: Partial<ProjectType>) => {
    setProjectTypes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProjectType = (id: string) => {
    setProjectTypes((prev) => prev.filter((p) => p.id !== id));
  };

  const publishProjectType = (id: string) => {
    setProjectTypes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'published' } : p))
    );
  };

  const addVariable = (key: string, label: string) => {
    setVariables((prev) => ({ ...prev, [key]: label }));
  };

  const updateVariable = (key: string, label: string) => {
    setVariables((prev) => ({ ...prev, [key]: label }));
  };

  const deleteVariable = (key: string) => {
    setVariables((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addRecord = (record: AddRecordPayload) => {
    const newRecord: GenerationRecord = {
      ...record,
      id: generateId(),
      date: nowIso(),
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  };

  const getRecords = () => records;

  const markEmailAsSent = (recordId: string, emailId: string) => {
    setRecords((prev) => prev.map((record) => {
      if (record.id !== recordId) return record;
      const current = record.sentEmailIds || [];
      if (current.includes(emailId)) return record;
      return { ...record, sentEmailIds: [...current, emailId] };
    }));
  };

  const unmarkEmailAsSent = (recordId: string, emailId: string) => {
    setRecords((prev) => prev.map((record) => {
      if (record.id !== recordId) return record;
      return { ...record, sentEmailIds: (record.sentEmailIds || []).filter((id) => id !== emailId) };
    }));
  };

  const markDocumentAsSent = (recordId: string, documentId: string) => {
    setRecords((prev) => prev.map((record) => {
      if (record.id !== recordId) return record;
      const current = record.sentDocumentIds || [];
      if (current.includes(documentId)) return record;
      return { ...record, sentDocumentIds: [...current, documentId] };
    }));
  };

  const unmarkDocumentAsSent = (recordId: string, documentId: string) => {
    setRecords((prev) => prev.map((record) => {
      if (record.id !== recordId) return record;
      return { ...record, sentDocumentIds: (record.sentDocumentIds || []).filter((id) => id !== documentId) };
    }));
  };

  const markQuestionAsSent = (recordId: string, questionId: string) => {
    setRecords((prev) => prev.map((record) => {
      if (record.id !== recordId) return record;
      const current = record.sentQuestionIds || [];
      if (current.includes(questionId)) return record;
      return { ...record, sentQuestionIds: [...current, questionId] };
    }));
  };

  const unmarkQuestionAsSent = (recordId: string, questionId: string) => {
    setRecords((prev) => prev.map((record) => {
      if (record.id !== recordId) return record;
      return { ...record, sentQuestionIds: (record.sentQuestionIds || []).filter((id) => id !== questionId) };
    }));
  };

  const resetAllData = () => {
    setTemplates(INITIAL_TEMPLATES);
    setProjectTypes(INITIAL_PROJECT_TYPES);
    setVariables(INITIAL_VARIABLES);
    setRecords(INITIAL_RECORDS);
    ['docgen_templates', 'docgen_projectTypes', 'docgen_variables', 'docgen_records']
      .forEach((key) => localStorage.removeItem(key));
  };

  return (
    <AppContext.Provider
      value={{
        templates,
        projectTypes,
        variables,
        records,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        addProjectType,
        updateProjectType,
        deleteProjectType,
        publishProjectType,
        addVariable,
        updateVariable,
        deleteVariable,
        addRecord,
        deleteRecord,
        getRecords,
        markEmailAsSent,
        unmarkEmailAsSent,
        markDocumentAsSent,
        unmarkDocumentAsSent,
        markQuestionAsSent,
        unmarkQuestionAsSent,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
