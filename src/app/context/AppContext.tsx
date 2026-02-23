import React, { createContext, useContext } from 'react';
import type { GenerationRecord, ProjectType, Template } from '../types';
import { useProjectTypes } from '../hooks/useProjectTypes';
import { useProjets } from '../hooks/useProjets';
import { useTemplates } from '../hooks/useTemplates';
import { useVariables } from '../hooks/useVariables';

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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const templatesState = useTemplates();
  const projectTypesState = useProjectTypes();
  const variablesState = useVariables();
  const recordsState = useProjets();

  const resetAllData = () => {
    templatesState.reset();
    projectTypesState.reset();
    variablesState.reset();
    recordsState.reset();
  };

  return (
    <AppContext.Provider
      value={{
        templates: templatesState.templates,
        projectTypes: projectTypesState.projectTypes,
        variables: variablesState.variables,
        records: recordsState.records,
        addTemplate: templatesState.addTemplate,
        updateTemplate: templatesState.updateTemplate,
        deleteTemplate: templatesState.deleteTemplate,
        duplicateTemplate: templatesState.duplicateTemplate,
        addProjectType: projectTypesState.addProjectType,
        updateProjectType: projectTypesState.updateProjectType,
        deleteProjectType: projectTypesState.deleteProjectType,
        publishProjectType: projectTypesState.publishProjectType,
        addVariable: variablesState.addVariable,
        updateVariable: variablesState.updateVariable,
        deleteVariable: variablesState.deleteVariable,
        addRecord: recordsState.addRecord,
        deleteRecord: recordsState.deleteRecord,
        getRecords: () => recordsState.records,
        markEmailAsSent: recordsState.markEmailAsSent,
        unmarkEmailAsSent: recordsState.unmarkEmailAsSent,
        markDocumentAsSent: recordsState.markDocumentAsSent,
        unmarkDocumentAsSent: recordsState.unmarkDocumentAsSent,
        markQuestionAsSent: recordsState.markQuestionAsSent,
        unmarkQuestionAsSent: recordsState.unmarkQuestionAsSent,
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
