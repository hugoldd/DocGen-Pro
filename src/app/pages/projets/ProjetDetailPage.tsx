import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useProjets } from '../../hooks/useProjets';
import { usePrestationsProjet } from '../../hooks/usePrestationsProjet';
import { useReservations } from '../../hooks/useReservations';
import { useConsultants } from '../../hooks/useConsultants';

type ReservationForm = {
  id?: string;
  prestation_projet_id: string;
  consultant_id: string;
  date_debut: string;
  nb_jours: number;
  mode: string;
  avec_trajet_aller: boolean;
  avec_trajet_retour: boolean;
  commentaire: string;
};

const modeBadge = (mode: string) =>
  mode === 'distanciel'
    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

const statusBadge = (statut: string) => {
  if (statut === 'success') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (statut === 'error') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-slate-200 text-slate-700 border-slate-300';
};

export default function ProjetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recordsById } = useProjets();
  const { items: prestationsProjet } = usePrestationsProjet();
  const { items: reservations, add: addReservation, update: updateReservation, remove: removeReservation } = useReservations();
  const { items: consultants } = useConsultants();

  const projet = id ? recordsById.get(id) : undefined;
  const codeProjet = projet?.codeProjet || projet?.id || '';

  const prestations = useMemo(
    () => prestationsProjet.filter((p) => p.code_projet === codeProjet),
    [prestationsProjet, codeProjet]
  );

  const reservationsByPrestation = useMemo(() => {
    const map = new Map<string, typeof reservations>();
    reservations
      .filter((r) => r.code_projet === codeProjet)
      .forEach((r) => {
        const list = map.get(r.prestation_projet_id) || [];
        map.set(r.prestation_projet_id, [...list, r]);
      });
    return map;
  }, [reservations, codeProjet]);

  const consultantById = useMemo(
    () => new Map(consultants.map((c) => [c.id, c])),
    [consultants]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ReservationForm>({
    prestation_projet_id: '',
    consultant_id: '',
    date_debut: '',
    nb_jours: 1,
    mode: 'sur_site',
    avec_trajet_aller: false,
    avec_trajet_retour: false,
    commentaire: '',
  });

  if (!projet) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="text-lg font-semibold">Projet introuvable</div>
            <Button onClick={() => navigate('/clients')}>Retour aux clients</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openAdd = (prestationId: string) => {
    setForm({
      prestation_projet_id: prestationId,
      consultant_id: '',
      date_debut: '',
      nb_jours: 1,
      mode: 'sur_site',
      avec_trajet_aller: false,
      avec_trajet_retour: false,
      commentaire: '',
    });
    setModalOpen(true);
  };

  const openEdit = (prestationId: string, reservation: ReservationForm) => {
    setForm({ ...reservation, prestation_projet_id: prestationId });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.prestation_projet_id || !form.date_debut) return;
    const payload = {
      code_projet: codeProjet,
      prestation_projet_id: form.prestation_projet_id,
      consultant_id: form.consultant_id,
      date_debut: form.date_debut,
      nb_jours: form.nb_jours,
      mode: form.mode,
      avec_trajet_aller: form.avec_trajet_aller,
      avec_trajet_retour: form.avec_trajet_retour,
      commentaire: form.commentaire,
    };
    if (form.id) {
      await updateReservation(form.id, payload);
    } else {
      await addReservation(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">Projet</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Code projet</Badge>
            <span className="text-lg font-semibold text-slate-900">{codeProjet}</span>
            <Badge className={statusBadge(projet.status || '')}>
              {projet.status || 'n/a'}
            </Badge>
            <span className="text-sm text-slate-500">
              Déploiement : {projet.deploymentDate || '-'}
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {prestations.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-6 text-sm text-slate-500">Aucune prestation.</CardContent>
          </Card>
        ) : (
          prestations.map((prestation) => {
            const list = reservationsByPrestation.get(prestation.id) || [];
            const planned = list.reduce((acc, r) => acc + (r.nb_jours || 0), 0);
            const total = prestation.jours_prevus + prestation.jours_supplementaires;
            const remaining = total - planned;

            return (
              <Card key={prestation.id} className="border-slate-200">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {prestation.label || prestation.prestation_id}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        Prévu {total.toFixed(1)} j
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        Planifié {planned.toFixed(1)} j
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        Restant {remaining.toFixed(1)} j
                      </Badge>
                    </div>
                  </div>
                  <Button type="button" onClick={() => openAdd(prestation.id)}>
                    <Plus className="w-4 h-4" />
                    Ajouter une réservation
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {list.length === 0 ? (
                    <div className="text-sm text-slate-500">Aucune réservation.</div>
                  ) : (
                    list.map((r) => {
                      const consultant = consultantById.get(r.consultant_id);
                      return (
                        <div key={r.id} className="rounded-lg border border-slate-200 px-3 py-2 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                              {consultant ? `${consultant.prenom} ${consultant.nom}` : 'Non assigné'}
                            </div>
                            <Badge className={modeBadge(r.mode)}>{r.mode === 'distanciel' ? 'Distanciel' : 'Sur site'}</Badge>
                          </div>
                          <div className="text-xs text-slate-500">
                            Date : {r.date_debut || '-'} · {r.nb_jours} j
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(prestation.id, r)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Modifier
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeReservation(r.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier la réservation' : 'Ajouter une réservation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Consultant</Label>
              <Select
                value={form.consultant_id || 'none'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, consultant_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un consultant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {consultants.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.prenom} {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date début</Label>
                <Input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_debut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nb jours</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={form.nb_jours}
                  onChange={(e) => setForm((prev) => ({ ...prev, nb_jours: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={form.mode} onValueChange={(value) => setForm((prev) => ({ ...prev, mode: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sur_site">Sur site</SelectItem>
                  <SelectItem value="distanciel">Distanciel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Commentaire</Label>
              <Textarea
                value={form.commentaire}
                onChange={(e) => setForm((prev) => ({ ...prev, commentaire: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
