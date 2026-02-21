import type {
  DocumentRule,
  EmailRule,
  GenerationRecord,
  GeneratedFile,
  PrerequisiteQuestion,
  ProjectType,
  Template,
  TemplateType,
} from '../types';

/**
 * Résout les variables dans une chaîne à partir d'un dictionnaire de valeurs
 * Ex: resolveVariables("Bonjour {{nom_client}}", { nom_client: "Dupont" }) => "Bonjour Dupont"
 */
export function resolveVariables(template: string, values: Record<string, string>): string {
  if (!template) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    return match;
  });
}

/**
 * Calcule le nom de fichier final à partir du pattern et des valeurs client/projet
 */
export function resolveOutputFileName(pattern: string, values: Record<string, string>): string {
  const resolved = resolveVariables(pattern, values);
  const sanitized = resolved
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_');
  return sanitized;
}

/**
 * Retourne les questions à afficher selon les options sélectionnées
 */
export function getActiveQuestions(
  questions: PrerequisiteQuestion[],
  selectedOptionIds: string[]
): PrerequisiteQuestion[] {
  if (!questions || questions.length === 0) return [];
  const selected = new Set(selectedOptionIds || []);
  return questions.filter((q) => !q.condition || selected.has(q.condition.optionId));
}

/**
 * Retourne les règles de documents actives selon les options sélectionnées
 */
export function getActiveDocumentRules(
  rules: DocumentRule[],
  selectedOptionIds: string[]
): DocumentRule[] {
  if (!rules || rules.length === 0) return [];
  const selected = new Set(selectedOptionIds || []);
  return rules.filter((r) => r.active && (!r.condition || selected.has(r.condition.optionId)));
}

/**
 * Retourne les règles d'emails actives selon les options sélectionnées
 */
export function getActiveEmailRules(
  rules: EmailRule[],
  selectedOptionIds: string[]
): EmailRule[] {
  if (!rules || rules.length === 0) return [];
  const selected = new Set(selectedOptionIds || []);
  return rules.filter((r) => r.active && (!r.condition || selected.has(r.condition.optionId)));
}

const extensionByType: Record<TemplateType, string> = {
  DOCX: '.docx',
  XLSX: '.xlsx',
  PDF: '.pdf',
  EMAIL: '.eml',
};

/**
 * Construit la liste des fichiers à générer avec tous les chemins résolus.
 * Inclut les documentRules et les emailRules actives selon les options sélectionnées.
 */
export function buildGenerationPlan(
  projectType: ProjectType,
  selectedOptionIds: string[],
  clientValues: Record<string, string>,
  templates: Template[]
): GeneratedFile[] {
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  const toGeneratedFile = (rule: DocumentRule): GeneratedFile | null => {
    const template = templateMap.get(rule.templateId);
    if (!template) return null;
    const baseName = resolveOutputFileName(rule.outputPattern, clientValues);
    const finalBaseName = baseName.trim()
      ? baseName
      : `${clientValues.nom_client || 'Document'} - ${template.name}`
        .replace(/[^a-zA-Z0-9\s\-_éèêëàâùûüîïôçÉÈÊËÀÂÙÛÜÎÏÔÇ]/g, '')
        .trim();
    const name = `${finalBaseName}${extensionByType[template.type]}`;
    const destinationPath = resolveVariables(rule.destinationPath, clientValues);
    return { name, type: template.type, templateId: template.id, destinationPath };
  };

  const activeDocRules   = getActiveDocumentRules(projectType?.documentRules || [], selectedOptionIds);
  const activeEmailRules = getActiveEmailRules(projectType?.emailRules || [], selectedOptionIds);

  const fromDocs   = activeDocRules.reduce<GeneratedFile[]>((acc, rule) => {
    const file = toGeneratedFile(rule);
    if (file) acc.push(file);
    return acc;
  }, []);

  const fromEmails = activeEmailRules.reduce<GeneratedFile[]>((acc, rule) => {
    const file = toGeneratedFile(rule);
    if (file) acc.push(file);
    return acc;
  }, []);

  return [...fromDocs, ...fromEmails];
}

/**
 * Calcule la liste des emails planifiés à partir du planning et de la date de déploiement
 */
export function buildScheduledEmails(
  projectType: ProjectType,
  deploymentDate: string,
  clientValues: Record<string, string>,
  templates: Template[]
): NonNullable<GenerationRecord['scheduledEmails']> {
  if (!projectType.emailSchedule?.length || !deploymentDate) return [];

  const scheduled = projectType.emailSchedule.reduce<
    NonNullable<GenerationRecord['scheduledEmails']>
  >((acc, rule) => {
    const emailRule = projectType.emailRules.find((r) => r.id === rule.emailRuleId);
    if (!emailRule) return acc;

    const template = templates.find((t) => t.id === emailRule.templateId);
    const baseDate = rule.generateOnWorkflow
      ? new Date()
      : new Date(deploymentDate);
    const calculatedDate = new Date(baseDate);
    if (!rule.generateOnWorkflow) {
      calculatedDate.setDate(baseDate.getDate() + rule.daysBeforeDeployment);
    }
    const recipient = resolveVariables(emailRule.recipient || '', clientValues);

    acc.push({
      id: rule.id,
      date: calculatedDate.toISOString(),
      label: rule.label,
      description: rule.description,
      templateId: emailRule.templateId,
      templateName: template?.name || 'Template inconnu',
      recipient,
      generateOnWorkflow: rule.generateOnWorkflow ?? false,
    });

    return acc;
  }, []);

  return scheduled.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildScheduledDocuments(
  projectType: ProjectType,
  deploymentDate: string,
  templates: Template[]
): NonNullable<GenerationRecord['scheduledDocuments']> {
  if (!projectType.documentSchedule?.length || !deploymentDate) return [];

  const templateIds = new Set(templates.map((t) => t.id));

  const scheduled = projectType.documentSchedule.reduce<
    NonNullable<GenerationRecord['scheduledDocuments']>
  >((acc, rule) => {
    const documentRule = projectType.documentRules.find((r) => r.id === rule.documentRuleId);
    if (!documentRule) return acc;
    if (!templateIds.has(documentRule.templateId)) return acc;

    const baseDate = rule.generateOnWorkflow
      ? new Date()
      : new Date(deploymentDate);
    const calculatedDate = new Date(baseDate);
    if (!rule.generateOnWorkflow) {
      calculatedDate.setDate(baseDate.getDate() + rule.daysBeforeDeployment);
    }

    acc.push({
      id: rule.id,
      date: calculatedDate.toISOString(),
      label: rule.label,
      description: rule.description,
      documentRuleId: documentRule.id,
      outputPattern: documentRule.outputPattern,
      requiresAction: rule.requiresAction,
      generateOnWorkflow: rule.generateOnWorkflow ?? false,
    });

    return acc;
  }, []);

  return scheduled.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildScheduledQuestions(
  projectType: ProjectType,
  deploymentDate: string
): NonNullable<GenerationRecord['scheduledQuestions']> {
  if (!projectType.questionSchedule?.length || !deploymentDate) return [];

  const scheduled = projectType.questionSchedule.reduce<
    NonNullable<GenerationRecord['scheduledQuestions']>
  >((acc, rule) => {
    const question = projectType.questions.find((q) => q.id === rule.questionId);
    if (!question) return acc;

    const baseDate = rule.generateOnWorkflow
      ? new Date()
      : new Date(deploymentDate);
    const calculatedDate = new Date(baseDate);
    if (!rule.generateOnWorkflow) {
      calculatedDate.setDate(baseDate.getDate() + rule.daysBeforeDeployment);
    }

    acc.push({
      id: rule.id,
      date: calculatedDate.toISOString(),
      label: rule.label,
      description: rule.description,
      questionId: question.id,
      questionLabel: question.label,
      requiresAction: rule.requiresAction,
      generateOnWorkflow: rule.generateOnWorkflow ?? false,
    });

    return acc;
  }, []);

  return scheduled.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
