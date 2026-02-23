export type TemplateType = 'DOCX' | 'XLSX' | 'PDF' | 'EMAIL';

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  projectTypeId: string | null;
  content: string;
  emailSubject?: string;
  fileBase64?: string;
  fileName?: string;
  variables: string[];
  linkedTemplateIds: string[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface ProjectOption {
  id: string;
  label: string;
  subConfig?: Record<string, unknown>;
}

export interface PrerequisiteQuestion {
  id: string;
  label: string;
  answerType: 'text' | 'yes-no' | 'dropdown' | 'number';
  required: boolean;
  condition: { optionId: string } | null;
  dropdownOptions?: string[];
}

export interface DocumentRule {
  id: string;
  condition: { optionId: string } | null;
  templateId: string;
  outputPattern: string;
  destinationPath: string;
  active: boolean;
}

export interface EmailRule extends DocumentRule {
  recipient: string;
}

export interface EmailScheduleRule {
  id: string;
  emailRuleId: string;
  daysBeforeDeployment: number;
  label: string;
  description: string;
  generateOnWorkflow?: boolean;
  requiresAction?: boolean;
}

export interface DocumentScheduleRule {
  id: string;
  documentRuleId: string;
  daysBeforeDeployment: number;
  label: string;
  description: string;
  requiresAction: boolean;
  generateOnWorkflow?: boolean;
}

export interface QuestionScheduleRule {
  id: string;
  questionId: string;
  daysBeforeDeployment: number;
  label: string;
  description: string;
  requiresAction: boolean;
  generateOnWorkflow?: boolean;
}

export interface ProjectType {
  id: string;
  name: string;
  code: string;
  description: string;
  tags: string[];
  options: ProjectOption[];
  questions: PrerequisiteQuestion[];
  documentRules: DocumentRule[];
  emailRules: EmailRule[];
  emailSchedule?: EmailScheduleRule[];
  documentSchedule?: DocumentScheduleRule[];
  questionSchedule?: QuestionScheduleRule[];
  pack_ids: string[];
  status: 'draft' | 'published';
}

export interface GeneratedFile {
  name: string;
  type: TemplateType;
  templateId: string;
  destinationPath: string;
}

export interface GenerationRecord {
  id: string;
  date: string;
  clientName: string;
  clientNumber: string;
  projectTypeId: string;
  filesGenerated: GeneratedFile[];
  deploymentDate?: string;
  scheduledEmails?: {
    id: string;
    date: string;
    label: string;
    description: string;
    templateId: string;
    templateName: string;
    recipient: string;
  }[];
  scheduledDocuments?: {
    id: string;
    date: string;
    label: string;
    description: string;
    documentRuleId: string;
    outputPattern: string;
    requiresAction: boolean;
  }[];
  scheduledQuestions?: {
    id: string;
    date: string;
    label: string;
    description: string;
    questionId: string;
    questionLabel: string;
    requiresAction: boolean;
  }[];
  sentEmailIds?: string[];
  sentDocumentIds?: string[];
  sentQuestionIds?: string[];
  contacts?: {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
  }[];
  answers?: Record<string, string>;
  selectedOptionIds?: string[];
  context?: string;
  status: 'success' | 'error';
}

export interface tsCompetence {
  id: string;
  label: string;
  categorie: string;
}

export interface Prestation {
  id: string;
  label: string;
  type: string;
  tarif_presentiel: number;
  tarif_distanciel: number;
}

export interface PackLigne {
  prestation_id: string;
  label: string;
  jours: number;
  tarif_unitaire: number;
  montant: number;
}

export interface Pack {
  id: string;
  label: string;
  description: string;
  lignes: PackLigne[];
}

export interface Consultant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  tjm: number;
  statut: string;
  type_contrat: string;
  adresse: string;
  ville: string;
  code_postal: string;
  jours_travailles: string[];
  competences: {
    competence_id: string;
    niveau: string;
    certifie: boolean;
  }[];
}

export interface Equipe {
  id: string;
  label: string;
  responsable_id: string;
  membres: string[];
}

export interface Client {
  id: string;
  code_client: string;
  nom: string;
  type_structure: string;
  ville: string;
  statut: string;
  data_salesforce: unknown;
}

export interface ContactClient {
  id: string;
  code_client: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
}

export interface NoteClient {
  id: string;
  code_client: string;
  contenu: string;
  tags: string[];
}

export interface ClientAlerte {
  id: string;
  code_client: string;
  niveau: string;
  message: string;
  date_echeance: string;
  resolue: boolean;
}

export interface ClientActivityEvent {
  id: string;
  code_client: string;
  type_event: string;
  description: string;
  created_by: string;
  created: string;
}

export interface ClientSatisfactionEvaluation {
  id: string;
  code_client: string;
  score: number;
  periode: string;
  commentaire: string;
}

export interface ClientFinanceInvoice {
  id: string;
  code_client: string;
  montant: number;
  date: string;
  statut: string;
}

export interface ClientFinancePayment {
  id: string;
  code_client: string;
  montant: number;
  date: string;
}

export interface PrestationProjet {
  id: string;
  code_projet: string;
  prestation_id: string;
  label: string;
  jours_prevus: number;
  jours_supplementaires: number;
  annule: boolean;
  forfait: boolean;
  mode_defaut: string;
}

export interface Reservation {
  id: string;
  code_projet: string;
  prestation_projet_id: string;
  consultant_id: string;
  date_debut: string;
  nb_jours: number;
  mode: string;
  avec_trajet_aller: boolean;
  avec_trajet_retour: boolean;
  commentaire: string;
}

export interface Jalon {
  id: string;
  code_projet: string;
  type: string;
  label: string;
  date_prevue: string;
  date_reelle: string;
  statut: string;
}

export interface Disponibilite {
  id: string;
  consultant_id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  commentaire: string;
}
