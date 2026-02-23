import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Layers, PackagePlus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
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
import { usePacks } from '../../../hooks/usePacks';
import { usePrestations } from '../../../hooks/usePrestations';
import type { Pack, PackLigne, Prestation } from '../../../types';

type FormState = {
  label: string;
  description: string;
  lignes: PackLigne[];
};

const STEPS = [
  { id: 1, label: 'Identite', icon: ClipboardList },
  { id: 2, label: 'Lignes', icon: Layers },
  { id: 3, label: 'Recap', icon: PackagePlus },
];

const emptyForm: FormState = {
  label: '',
  description: '',
  lignes: [],
};

const StepHeader = ({ step, totalSteps }: { step: number; totalSteps: number }) => (
  <div className="mb-8">
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
);

const createLine = (prestation: Prestation | undefined): PackLigne => ({
  prestation_id: prestation?.id || '',
  label: prestation?.label || '',
  jours: 1,
  tarif_unitaire: prestation?.tarif_presentiel ?? 0,
  montant: prestation ? prestation.tarif_presentiel : 0,
});

export default function PacksPage() {
  const { items, loading, error, add, update, remove } = usePacks();
  const { items: prestations } = usePrestations();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canProceed = useMemo(() => form.label.trim().length > 0, [form.label]);
  const canSave = useMemo(
    () => form.label.trim().length > 0 && form.lignes.length > 0,
    [form.label, form.lignes.length]
  );

  const totals = useMemo(() => {
    return form.lignes.reduce(
      (acc, line) => {
        acc.jours += line.jours;
        acc.montant += line.montant;
        return acc;
      },
      { jours: 0, montant: 0 }
    );
  }, [form.lignes]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStep(1);
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<Pack, 'id'> = {
      label: form.label.trim(),
      description: form.description.trim(),
      lignes: form.lignes,
    };
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    resetForm();
  };

  const handleEdit = (item: Pack) => {
    setForm({
      label: item.label,
      description: item.description,
      lignes: item.lignes || [],
    });
    setEditingId(item.id);
    setStep(1);
  };

  const addLine = () => {
    const first = prestations[0];
    setForm((prev) => ({ ...prev, lignes: [...prev.lignes, createLine(first)] }));
  };

  const updateLine = (index: number, patch: Partial<PackLigne>) => {
    setForm((prev) => {
      const lignes = [...prev.lignes];
      const current = lignes[index];
      const next = { ...current, ...patch };
      next.montant = Number(next.jours) * Number(next.tarif_unitaire);
      lignes[index] = next;
      return { ...prev, lignes };
    });
  };

  const handlePrestationChange = (index: number, prestationId: string) => {
    const prestation = prestations.find((p) => p.id === prestationId);
    updateLine(index, {
      prestation_id: prestationId,
      label: prestation?.label || '',
      tarif_unitaire: prestation?.tarif_presentiel ?? 0,
      montant: (prestation?.tarif_presentiel ?? 0) * (form.lignes[index]?.jours || 0),
    });
  };

  const removeLine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lignes: prev.lignes.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-10">
      <Card className="shadow-xl border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Wizard Packs</CardTitle>
          <p className="text-sm text-slate-500">
            Construisez un pack en trois etapes.
          </p>
        </CardHeader>
        <CardContent>
          <StepHeader step={step} totalSteps={STEPS.length} />

          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="pack-label">Label *</Label>
                <Input
                  id="pack-label"
                  value={form.label}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Ex: Pack lancement"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pack-description">Description</Label>
                <Textarea
                  id="pack-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Details du pack"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Lignes</h3>
                <Button type="button" size="sm" onClick={addLine}>
                  Ajouter une ligne
                </Button>
              </div>
              {form.lignes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
                  Aucune ligne ajoutee.
                </div>
              ) : (
                <div className="space-y-4">
                  {form.lignes.map((line, index) => (
                    <Card key={`${line.prestation_id}-${index}`} className="border-slate-200">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Ligne {index + 1}</Badge>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Prestation</Label>
                            <Select
                              value={line.prestation_id}
                              onValueChange={(value) => handlePrestationChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une prestation" />
                              </SelectTrigger>
                              <SelectContent>
                                {prestations.map((prestation) => (
                                  <SelectItem key={prestation.id} value={prestation.id}>
                                    {prestation.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Jours</Label>
                            <Input
                              type="number"
                              value={line.jours}
                              onChange={(event) =>
                                updateLine(index, { jours: Number(event.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tarif unitaire</Label>
                            <Input value={line.tarif_unitaire} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label>Montant</Label>
                            <Input value={line.montant} readOnly />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Recapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Label</p>
                    <p className="text-base font-medium text-slate-900">{form.label}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="text-sm text-slate-700">{form.description || '-'}</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prestation</TableHead>
                        <TableHead>Jours</TableHead>
                        <TableHead>Tarif</TableHead>
                        <TableHead>Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.lignes.map((line, index) => (
                        <TableRow key={`${line.prestation_id}-${index}`}>
                          <TableCell>{line.label || '-'}</TableCell>
                          <TableCell>{line.jours}</TableCell>
                          <TableCell>{line.tarif_unitaire} €</TableCell>
                          <TableCell>{line.montant} €</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-end gap-6">
                    <div className="text-sm text-slate-600">
                      Total jours: <span className="font-semibold text-slate-900">{totals.jours}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Total montant: <span className="font-semibold text-slate-900">{totals.montant} €</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                <Button
                  type="button"
                  onClick={() => canProceed && setStep((prev) => prev + 1)}
                  disabled={!canProceed}
                >
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
            Packs existants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun pack enregistre.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Lignes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                    <TableCell>{item.lignes?.length || 0}</TableCell>
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
