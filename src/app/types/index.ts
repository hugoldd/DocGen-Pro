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
