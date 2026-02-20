import type { ProjectType } from '../types';

export const exportProjectTypes = (projectTypes: ProjectType[]): void => {
  const payload = {
    exportedAt: new Date().toISOString(),
    projectTypes,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `docgen-settings-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportSingleProjectType = (projectType: ProjectType): void => {
  const payload = {
    exportedAt: new Date().toISOString(),
    projectType,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const slug = projectType.name.trim().toLowerCase().replace(/\s+/g, '-');
  const link = document.createElement('a');
  link.href = url;
  link.download = `docgen-projet-${slug}-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
