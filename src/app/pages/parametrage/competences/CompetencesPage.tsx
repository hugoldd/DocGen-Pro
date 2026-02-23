import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Layers, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
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
import { useCompetences } from '../../../hooks/useCompetences';
import type { tsCompetence } from '../../../types';

type FormState = {
  label: string;
  categorie: string;
};

const STEPS = [
  { id: 1, label: 'Label', icon: ClipboardList },
  { id: 2, label: 'Categorie', icon: Layers },
];

const emptyForm: FormState = { label: '', categorie: '' };

const categories = ['technique', 'fonctionnel', 'metier', 'soft'] as const;

const StepHeader = ({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) => (
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

export default function CompetencesPage() {
  const { items, loading, error, add, update, remove } = useCompetences();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canProceed = useMemo(() => form.label.trim().length > 0, [form.label]);
  const canSave = useMemo(
    () => form.label.trim().length > 0 && form.categorie.trim().length > 0,
    [form.label, form.categorie]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStep(1);
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<tsCompetence, 'id'> = {
      label: form.label.trim(),
      categorie: form.categorie,
    };
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    resetForm();
  };

  const handleEdit = (item: tsCompetence) => {
    setForm({ label: item.label, categorie: item.categorie });
    setEditingId(item.id);
    setStep(1);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-10">
      <Card className="shadow-xl border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Wizard Competences
          </CardTitle>
          <p className="text-sm text-slate-500">
            Creez une competence en deux etapes.
          </p>
        </CardHeader>
        <CardContent>
          <StepHeader step={step} totalSteps={STEPS.length} />

          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="competence-label">Label *</Label>
                <Input
                  id="competence-label"
                  value={form.label}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Ex: Architecture"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-2">
                <Label>Categorie *</Label>
                <Select
                  value={form.categorie}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, categorie: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Annuler edition
                </Button>
              )}
              {step < STEPS.length ? (
                <Button type="button" onClick={() => canProceed && setStep(2)} disabled={!canProceed}>
                  Suivant
                </Button>
              ) : (
                <Button type="button" onClick={handleSave} disabled={!canSave}>
                  {editingId ? 'Mettre a jour' : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Competences existantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune competence enregistree.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.categorie}</Badge>
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
