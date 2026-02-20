import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Edit2, Save, X, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

const SYSTEM_KEYS = [
  'nom_client',
  'numero_client',
  'contact_name',
  'contact_email',
  'type_projet',
];

export default function VariablesPage() {
  const { variables, addVariable, updateVariable, deleteVariable } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newErrors, setNewErrors] = useState<{ key?: string; label?: string }>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editError, setEditError] = useState('');

  const entries = useMemo(() => Object.entries(variables), [variables]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(([key, label]) => {
      return key.toLowerCase().includes(term) || label.toLowerCase().includes(term);
    });
  }, [entries, searchTerm]);

  const resetNewForm = () => {
    setNewKey('');
    setNewLabel('');
    setNewErrors({});
  };

  const validateNew = () => {
    const nextErrors: { key?: string; label?: string } = {};
    if (!newKey.trim()) {
      nextErrors.key = 'La clé est obligatoire.';
    }
    if (!newLabel.trim()) {
      nextErrors.label = 'Le libellé est obligatoire.';
    }
    const normalized = newKey.trim().toLowerCase();
    const hasDuplicate = entries.some(([key]) => key.toLowerCase() === normalized);
    if (normalized && hasDuplicate) {
      nextErrors.key = 'Cette clé existe déjà.';
    }
    return nextErrors;
  };

  const handleAdd = () => {
    const nextErrors = validateNew();
    setNewErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    addVariable(newKey.trim(), newLabel.trim());
    resetNewForm();
  };

  const startEdit = (key: string, label: string) => {
    setEditingKey(key);
    setEditingLabel(label);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingLabel('');
    setEditError('');
  };

  const confirmEdit = () => {
    if (!editingKey) return;
    if (!editingLabel.trim()) {
      setEditError('Le libellé est obligatoire.');
      return;
    }
    updateVariable(editingKey, editingLabel.trim());
    cancelEdit();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bibliothèque de variables</h1>
          <p className="text-slate-500 text-sm mt-1">
            Définissez les balises utilisables dans vos templates et formulaires.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une variable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3 border-b border-slate-200">Clé</th>
                <th className="px-6 py-3 border-b border-slate-200">Libellé</th>
                <th className="px-6 py-3 border-b border-slate-200 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map(([key, label]) => {
                const isSystem = SYSTEM_KEYS.includes(key);
                const isEditing = editingKey === key;
                return (
                  <tr key={key} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-indigo-600 font-mono">
                          {`{{${key}}}`}
                        </code>
                        {isSystem && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-600 border border-slate-300">
                            Système
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                          {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{label}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={confirmEdit}
                              className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                              title="Confirmer"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(key, label)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isSystem && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer cette variable ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est définitive. La variable "{key}" sera supprimée.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteVariable(key)}>
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    <Tag className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p>Aucune variable trouvée.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Ajouter une variable</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">Clé</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                placeholder="ex: date_debut"
              />
              {newErrors.key && <p className="text-xs text-red-500 mt-1">{newErrors.key}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">Libellé</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="ex: Date de début"
              />
              {newErrors.label && <p className="text-xs text-red-500 mt-1">{newErrors.label}</p>}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
            <button
              type="button"
              onClick={resetNewForm}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
