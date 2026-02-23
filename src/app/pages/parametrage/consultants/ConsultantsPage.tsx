import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, MapPin, Shield, Users, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { useConsultants } from '../../../hooks/useConsultants';
import { useCompetences } from '../../../hooks/useCompetences';
import type { Consultant } from '../../../types';

type CompetenceSelection = {
  competence_id: string;
  niveau: string;
};

type FormState = {
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  adresse: string;
  ville: string;
  code_postal: string;
  jours_travailles: string[];
  competences: CompetenceSelection[];
};

const STEPS = [
  { id: 1, label: 'Profil', icon: ClipboardList },
  { id: 2, label: 'Adresse', icon: MapPin },
  { id: 3, label: 'Disponibilité', icon: Users },
  { id: 4, label: 'Compétences', icon: Shield },
];

const emptyForm: FormState = {
  nom: '',
  prenom: '',
  email: '',
  statut: 'actif',
  adresse: '',
  ville: '',
  code_postal: '',
  jours_travailles: [],
  competences: [],
};

const jours = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
];

const StepHeader = ({ step, totalSteps }: { step: number; totalSteps: number }) => (
  <div className="mb-8">
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between relative h-16">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        />
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
  </div>
);

export default function ConsultantsPage() {
  const { items, loading, error, add, update, remove } = useConsultants();
  const { items: competences } = useCompetences();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canProceedStep1 = form.nom.trim().length > 0;
  const canSave = form.nom.trim().length > 0;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStep(1);
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<Consultant, 'id'> = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim(),
      statut: form.statut,
      adresse: form.adresse.trim(),
      ville: form.ville.trim(),
      code_postal: form.code_postal.trim(),
      jours_travailles: form.jours_travailles,
      competences: form.competences.map((c) => ({
        competence_id: c.competence_id,
        niveau: c.niveau,
      })),
    };
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    resetForm();
  };

  const handleEdit = (item: Consultant) => {
    setForm({
      nom: item.nom || '',
      prenom: item.prenom || '',
      email: item.email || '',
      statut: item.statut || 'actif',
      adresse: item.adresse || '',
      ville: item.ville || '',
      code_postal: item.code_postal || '',
      jours_travailles: item.jours_travailles || [],
      competences: (item.competences || []).map((c) => ({
        competence_id: c.competence_id,
        niveau: c.niveau,
      })),
    });
    setEditingId(item.id);
    setStep(1);
  };

  const toggleJour = (dayId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      jours_travailles: checked
        ? [...prev.jours_travailles, dayId]
        : prev.jours_travailles.filter((d) => d !== dayId),
    }));
  };

  const toggleCompetence = (competenceId: string, checked: boolean) => {
    setForm((prev) => {
      if (checked) {
        return {
          ...prev,
          competences: [
            ...prev.competences,
            { competence_id: competenceId, niveau: '0' },
          ],
        };
      }
      return {
        ...prev,
        competences: prev.competences.filter((c) => c.competence_id !== competenceId),
      };
    });
  };

  const updateCompetence = (competenceId: string, patch: Partial<CompetenceSelection>) => {
    setForm((prev) => ({
      ...prev,
      competences: prev.competences.map((c) =>
        c.competence_id === competenceId ? { ...c, ...patch } : c
      ),
    }));
  };

  const selectedCompetenceIds = useMemo(
    () => new Set(form.competences.map((c) => c.competence_id)),
    [form.competences]
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-10">
      <Card className="shadow-xl border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Consultants</CardTitle>
          <p className="text-sm text-slate-500">
            Créez un consultant en plusieurs étapes.
          </p>
        </CardHeader>
        <CardContent>
          <StepHeader step={step} totalSteps={STEPS.length} />

          {step === 1 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consultant-nom">Nom *</Label>
                  <Input
                    id="consultant-nom"
                    value={form.nom}
                    onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))}
                    placeholder="Ex: Durand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultant-prenom">Prénom</Label>
                  <Input
                    id="consultant-prenom"
                    value={form.prenom}
                    onChange={(event) => setForm((prev) => ({ ...prev, prenom: event.target.value }))}
                    placeholder="Ex: Camille"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultant-email">Email</Label>
                  <Input
                    id="consultant-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="prenom.nom@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={form.statut}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, statut: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="consultant-adresse">Adresse</Label>
                <Input
                  id="consultant-adresse"
                  value={form.adresse}
                  onChange={(event) => setForm((prev) => ({ ...prev, adresse: event.target.value }))}
                  placeholder="12 rue des Lilas"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consultant-ville">Ville</Label>
                  <Input
                    id="consultant-ville"
                    value={form.ville}
                    onChange={(event) => setForm((prev) => ({ ...prev, ville: event.target.value }))}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultant-cp">Code postal</Label>
                  <Input
                    id="consultant-cp"
                    value={form.code_postal}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, code_postal: event.target.value }))
                    }
                    placeholder="75000"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {jours.map((day) => {
                  const checked = form.jours_travailles.includes(day.id);
                  return (
                    <label
                      key={day.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleJour(day.id, value === true)}
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {competences.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune compétence disponible.</p>
              ) : (
                <div className="space-y-4">
                  {competences.map((competence) => {
                    const isSelected = selectedCompetenceIds.has(competence.id);
                    const selection = form.competences.find(
                      (c) => c.competence_id === competence.id
                    );
                    return (
                      <Card key={competence.id} className="border-slate-200">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{competence.label}</p>
                              <p className="text-xs text-slate-500">{competence.categorie}</p>
                            </div>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(value) => toggleCompetence(competence.id, value === true)}
                            />
                          </div>
                          {isSelected && selection && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Niveau</Label>
                                <Select
                                  value={selection.niveau}
                                  onValueChange={(value) =>
                                    updateCompetence(competence.id, { niveau: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="0" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0</SelectItem>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Annuler édition
                </Button>
              )}
              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !canProceedStep1) return;
                    setStep((prev) => Math.min(STEPS.length, prev + 1));
                  }}
                  disabled={step === 1 && !canProceedStep1}
                >
                  Suivant
                </Button>
              ) : (
                <Button type="button" onClick={handleSave} disabled={!canSave}>
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Consultants existants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun consultant enregistré.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const displayCompetences = (item.competences || []).map((entry) => {
                  const competence = competences.find((c) => c.id === entry.competence_id);
                  const niveau = Number(entry.niveau || 0);
                  const color =
                    niveau === 0
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : niveau === 1
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : niveau === 2
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                  return {
                    id: entry.competence_id,
                    label: competence?.label || entry.competence_id,
                    color,
                  };
                });

                return (
                  <Card key={item.id} className="border-slate-200">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="text-base font-semibold text-slate-900">
                              {item.nom} {item.prenom}
                            </p>
                            <Badge variant={item.statut === 'actif' ? 'default' : 'secondary'}>
                              {item.statut || 'inactif'}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            Code postal: <span className="font-medium">{item.code_postal || '-'}</span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Jours travaillés:{' '}
                            <span className="font-medium">
                              {item.jours_travailles?.length
                                ? item.jours_travailles.join(', ')
                                : '-'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => remove(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {displayCompetences.length === 0 ? (
                          <span className="text-sm text-slate-500">Aucune compétence.</span>
                        ) : (
                          displayCompetences.map((entry) => (
                            <span
                              key={entry.id}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${entry.color}`}
                            >
                              {entry.label}
                            </span>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

