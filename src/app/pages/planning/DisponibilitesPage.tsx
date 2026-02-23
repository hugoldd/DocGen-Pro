import React, { useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useDisponibilites } from '../../hooks/useDisponibilites';
import { useConsultants } from '../../hooks/useConsultants';

const typeBadge = (type: string) => {
  if (type === 'conges') return 'bg-red-100 text-red-700 border-red-200';
  if (type === 'formation') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-200 text-slate-600 border-slate-300';
};

export default function DisponibilitesPage() {
  const { items: disponibilites, add, remove } = useDisponibilites();
  const { items: consultants } = useConsultants();
  const [filterConsultant, setFilterConsultant] = useState('');
  const [form, setForm] = useState({
    consultant_id: '',
    type: 'intercontrat',
    date_debut: '',
    date_fin: '',
    commentaire: '',
  });

  const filtered = useMemo(() => {
    if (!filterConsultant) return disponibilites;
    return disponibilites.filter((d) => d.consultant_id === filterConsultant);
  }, [disponibilites, filterConsultant]);

  const consultantName = (id: string) => {
    const c = consultants.find((x) => x.id === id);
    return c ? `${c.prenom} ${c.nom}`.trim() : id;
  };

  const handleAdd = async () => {
    if (!form.consultant_id || !form.date_debut || !form.date_fin) return;
    await add({ ...form });
    setForm({ consultant_id: '', type: 'intercontrat', date_debut: '', date_fin: '', commentaire: '' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">Disponibilités consultants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={form.consultant_id} onValueChange={(value) => setForm((s) => ({ ...s, consultant_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Consultant" />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.type} onValueChange={(value) => setForm((s) => ({ ...s, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conges">congés</SelectItem>
                <SelectItem value="formation">formation</SelectItem>
                <SelectItem value="intercontrat">intercontrat</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={form.date_debut} onChange={(e) => setForm((s) => ({ ...s, date_debut: e.target.value }))} />
            <Input type="date" value={form.date_fin} onChange={(e) => setForm((s) => ({ ...s, date_fin: e.target.value }))} />
            <Input placeholder="Commentaire" value={form.commentaire} onChange={(e) => setForm((s) => ({ ...s, commentaire: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleAdd}>Nouvelle disponibilité</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Liste des disponibilités</CardTitle>
          <div className="w-64">
            <Label>Filtrer par consultant</Label>
            <Select value={filterConsultant} onValueChange={setFilterConsultant}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 px-2">Consultant</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Date début</th>
                  <th className="py-2 px-2">Date fin</th>
                  <th className="py-2 px-2">Commentaire</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="py-2 px-2">{consultantName(d.consultant_id)}</td>
                    <td className="py-2 px-2">
                      <Badge className={typeBadge(d.type)}>{d.type}</Badge>
                    </td>
                    <td className="py-2 px-2">{d.date_debut}</td>
                    <td className="py-2 px-2">{d.date_fin}</td>
                    <td className="py-2 px-2">{d.commentaire || '-'}</td>
                    <td className="py-2 px-2">
                      <Button type="button" variant="destructive" size="sm" onClick={() => remove(d.id)}>
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-sm text-slate-500 mt-3">Aucune disponibilité.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
