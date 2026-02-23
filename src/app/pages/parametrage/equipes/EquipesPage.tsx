import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Users, Pencil, Trash2 } from 'lucide-react';
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
import { useEquipes } from '../../../hooks/useEquipes';
import { useConsultants } from '../../../hooks/useConsultants';
import type { Equipe } from '../../../types';

type FormState = {
  label: string;
  responsable_id: string;
  membres: string[];
};

const STEPS = [
  { id: 1, label: 'Identité', icon: ClipboardList },
  { id: 2, label: 'Membres', icon: Users },
];

const emptyForm: FormState = {
  label: '',
  responsable_id: '',
  membres: [],
};

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

export default function EquipesPage() {
  const { items, loading, error, add, update, remove } = useEquipes();
  const { items: consultants } = useConsultants();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeConsultants = useMemo(
    () => consultants.filter((consultant) => consultant.statut === 'actif'),
    [consultants]
  );

  const canProceed = form.label.trim().length > 0;
  const canSave = form.label.trim().length > 0;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStep(1);
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<Equipe, 'id'> = {
      label: form.label.trim(),
      responsable_id: form.responsable_id,
      membres: form.membres,
    };
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    resetForm();
  };

  const handleEdit = (item: Equipe) => {
    setForm({
      label: item.label || '',
      responsable_id: item.responsable_id || '',
      membres: item.membres || [],
    });
    setEditingId(item.id);
    setStep(1);
  };

  const toggleMember = (id: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      membres: checked ? [...prev.membres, id] : prev.membres.filter((m) => m !== id),
    }));
  };

  const handleResponsableChange = (id: string) => {
    setForm((prev) => ({
      ...prev,
      responsable_id: id,
      membres: prev.membres.includes(id) ? prev.membres : [...prev.membres, id],
    }));
  };

  const getConsultantName = (id: string) => {
    const item = consultants.find((consultant) => consultant.id === id);
    if (!item) return id;
    return `${item.nom} ${item.prenom}`.trim();
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-10">
      <Card className="shadow-xl border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Équipes</CardTitle>
          <p className="text-sm text-slate-500">Créez une équipe en deux étapes.</p>
        </CardHeader>
        <CardContent>
          <StepHeader step={step} totalSteps={STEPS.length} />

          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="equipe-label">Label *</Label>
                <Input
                  id="equipe-label"
                  value={form.label}
                  onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder="Ex: Équipe Delivery"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select value={form.responsable_id} onValueChange={handleResponsableChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeConsultants.map((consultant) => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.nom} {consultant.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Membres</Label>
                {activeConsultants.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun consultant actif disponible.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeConsultants.map((consultant) => {
                      const checked = form.membres.includes(consultant.id);
                      return (
                        <label
                          key={consultant.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => toggleMember(consultant.id, value === true)}
                          />
                          {consultant.nom} {consultant.prenom}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <Button type="button" onClick={() => canProceed && setStep(2)} disabled={!canProceed}>
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
          <CardTitle className="text-lg font-semibold text-slate-900">Équipes existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune équipe enregistrée.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>{getConsultantName(item.responsable_id) || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(item.membres || []).length === 0 ? (
                          <span className="text-sm text-slate-500">Aucun membre</span>
                        ) : (
                          item.membres.map((memberId) => {
                            const consultant = consultants.find((c) => c.id === memberId);
                            const status = consultant?.statut || 'inactif';
                            return (
                              <Badge
                                key={memberId}
                                variant={status === 'actif' ? 'default' : 'secondary'}
                              >
                                {consultant
                                  ? `${consultant.nom} ${consultant.prenom}`.trim()
                                  : memberId}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


