import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { usePrestationsProjet } from '../../hooks/usePrestationsProjet';
import { useReservations } from '../../hooks/useReservations';
import { useJalons } from '../../hooks/useJalons';
import { useDisponibilites } from '../../hooks/useDisponibilites';
import { useConsultants } from '../../hooks/useConsultants';
import { useCompetences } from '../../hooks/useCompetences';
import { usePrestations } from '../../hooks/usePrestations';
import { useClients } from '../../hooks/useClients';
import { useProjets } from '../../hooks/useProjets';

const modeBadge = (mode: string) =>
  mode === 'distanciel'
    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

const statutBadge = (statut: string) => {
  if (statut === 'atteint') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (statut === 'retard') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const typeBadge = (type: string) => {
  if (type === 'conges') return 'bg-red-100 text-red-700 border-red-200';
  if (type === 'formation') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-200 text-slate-600 border-slate-300';
};

const wizardSteps = ['Projet', 'Prestation', 'Récapitulatif'];

export default function PlanningProjetsPage() {
  const { items: prestationsProjet } = usePrestationsProjet();
  const { items: reservations, add: addReservation } = useReservations();
  const { items: jalons, add: addJalon, update: updateJalon } = useJalons();
  const { items: disponibilites, add: addDisponibilite, remove: removeDisponibilite } = useDisponibilites();
  const { items: consultants } = useConsultants();
  const { items: competences } = useCompetences();
  const { items: prestations } = usePrestations();
  const { items: clients } = useClients();
  const { getByClient } = useProjets();

  const [tab, setTab] = useState('reservations');
  const [filterProjet, setFilterProjet] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterJalonProjet, setFilterJalonProjet] = useState('');
  const [filterDispoConsultant, setFilterDispoConsultant] = useState('');

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProjet, setSelectedProjet] = useState('');
  const [selectedPrestationProjet, setSelectedPrestationProjet] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [nbJours, setNbJours] = useState('1');
  const [mode, setMode] = useState('sur_site');
  const [trajetAller, setTrajetAller] = useState(false);
  const [trajetRetour, setTrajetRetour] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  const [jalonForm, setJalonForm] = useState({ code_projet: '', type: 'jalon', label: '', date_prevue: '' });
  const [dispoForm, setDispoForm] = useState({ consultant_id: '', type: 'intercontrat', date_debut: '', date_fin: '', commentaire: '' });

  const prestationById = useMemo(() => new Map(prestations.map((p) => [p.id, p])), [prestations]);
  const consultantById = useMemo(
    () => new Map(consultants.map((c) => [c.id, c])),
    [consultants]
  );
  const competenceById = useMemo(
    () => new Map(competences.map((c) => [c.id, c.label])),
    [competences]
  );

  const reservationsFiltered = useMemo(() => {
    return reservations.filter((r) => {
      if (filterProjet && !r.code_projet.toLowerCase().includes(filterProjet.toLowerCase())) return false;
      if (filterConsultant && r.consultant_id !== filterConsultant) return false;
      return true;
    });
  }, [reservations, filterProjet, filterConsultant]);

  const jalonsFiltered = useMemo(() => {
    if (!filterJalonProjet) return jalons;
    return jalons.filter((j) => j.code_projet.toLowerCase().includes(filterJalonProjet.toLowerCase()));
  }, [jalons, filterJalonProjet]);

  const disponibilitesFiltered = useMemo(() => {
    if (!filterDispoConsultant) return disponibilites;
    return disponibilites.filter((d) => d.consultant_id === filterDispoConsultant);
  }, [disponibilites, filterDispoConsultant]);

  const projetsDisponibles = useMemo(() => {
    if (!selectedClient) return [];
    const items = getByClient(selectedClient);
    const codes = new Set(items.map((p) => p.codeProjet || p.id).filter(Boolean));
    return Array.from(codes).sort();
  }, [getByClient, selectedClient]);

  const prestationsByProjet = useMemo(
    () => prestationsProjet.filter((p) => p.code_projet === selectedProjet),
    [prestationsProjet, selectedProjet]
  );

  const resteParPrestation = useMemo(() => {
    const map = new Map<string, number>();
    prestationsByProjet.forEach((p) => {
      const reserved = reservations
        .filter((r) => r.prestation_projet_id === p.id)
        .reduce((acc, r) => acc + (r.nb_jours || 0), 0);
      const reste = (p.jours_prevus + p.jours_supplementaires) - reserved;
      map.set(p.id, reste);
    });
    return map;
  }, [prestationsByProjet, reservations]);

  const selectedPrestation = prestationsByProjet.find((p) => p.id === selectedPrestationProjet);

  const resetWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setSelectedClient('');
    setSelectedProjet('');
    setSelectedPrestationProjet('');
    setSelectedConsultant('');
    setDateDebut('');
    setNbJours('1');
    setMode('sur_site');
    setTrajetAller(false);
    setTrajetRetour(false);
    setCommentaire('');
  };

  const handleCreateReservation = async () => {
    if (!selectedProjet || !selectedPrestationProjet || !selectedConsultant) return;
    await addReservation({
      code_projet: selectedProjet,
      prestation_projet_id: selectedPrestationProjet,
      consultant_id: selectedConsultant,
      date_debut: dateDebut,
      nb_jours: Number(nbJours),
      mode,
      avec_trajet_aller: trajetAller,
      avec_trajet_retour: trajetRetour,
      commentaire,
    });
    resetWizard();
  };

  const handleCreateJalon = async () => {
    if (!jalonForm.code_projet || !jalonForm.label || !jalonForm.date_prevue) return;
    await addJalon({
      code_projet: jalonForm.code_projet,
      type: jalonForm.type,
      label: jalonForm.label,
      date_prevue: jalonForm.date_prevue,
      date_reelle: '',
      statut: 'en_attente',
    });
    setJalonForm({ code_projet: '', type: 'jalon', label: '', date_prevue: '' });
  };

  const handleCreateDispo = async () => {
    if (!dispoForm.consultant_id || !dispoForm.date_debut || !dispoForm.date_fin) return;
    await addDisponibilite({ ...dispoForm });
    setDispoForm({ consultant_id: '', type: 'intercontrat', date_debut: '', date_fin: '', commentaire: '' });
  };

  const renderConsultantName = (id: string) => {
    const c = consultantById.get(id);
    return c ? `${c.prenom} ${c.nom}`.trim() : id;
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Planning</CardTitle>
            <p className="text-sm text-slate-500">Réservations, jalons et disponibilités.</p>
          </div>
          <Button type="button" onClick={() => setWizardOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle réservation
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="reservations">Réservations</TabsTrigger>
              <TabsTrigger value="jalons">Jalons</TabsTrigger>
              <TabsTrigger value="disponibilites">Disponibilités</TabsTrigger>
            </TabsList>

            <TabsContent value="reservations" className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label>Filtrer par code projet</Label>
                  <Input value={filterProjet} onChange={(e) => setFilterProjet(e.target.value)} />
                </div>
                <div className="w-full md:w-64">
                  <Label>Consultant</Label>
                  <Select
                    value={filterConsultant || 'all'}
                    onValueChange={(value) => setFilterConsultant(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {consultants.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.prenom} {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 px-2">Code projet</th>
                      <th className="py-2 px-2">Consultant</th>
                      <th className="py-2 px-2">Prestation</th>
                      <th className="py-2 px-2">Date début</th>
                      <th className="py-2 px-2">Jours</th>
                      <th className="py-2 px-2">Mode</th>
                      <th className="py-2 px-2">Trajet</th>
                      <th className="py-2 px-2">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservationsFiltered.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-2 px-2">{r.code_projet}</td>
                        <td className="py-2 px-2">{renderConsultantName(r.consultant_id)}</td>
                        <td className="py-2 px-2">
                          {prestationsProjet.find((p) => p.id === r.prestation_projet_id)?.label ||
                            prestationById.get(r.prestation_projet_id)?.label ||
                            '-'}
                        </td>
                        <td className="py-2 px-2">{r.date_debut || '-'}</td>
                        <td className="py-2 px-2">{r.nb_jours}</td>
                        <td className="py-2 px-2">
                          <Badge className={modeBadge(r.mode)}>{r.mode}</Badge>
                        </td>
                        <td className="py-2 px-2 flex items-center gap-2">
                          {r.avec_trajet_aller && <ArrowRight className="w-4 h-4 text-slate-500" />}
                          {r.avec_trajet_retour && <ArrowLeft className="w-4 h-4 text-slate-500" />}
                          {!r.avec_trajet_aller && !r.avec_trajet_retour && <span className="text-xs text-slate-400">-</span>}
                        </td>
                        <td className="py-2 px-2 text-sm">{r.commentaire || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reservationsFiltered.length === 0 && (
                  <div className="text-sm text-slate-500 mt-3">Aucune réservation.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="jalons" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Code projet"
                  value={filterJalonProjet}
                  onChange={(e) => setFilterJalonProjet(e.target.value)}
                />
                <Input
                  placeholder="Type (jalon/phase/livrable)"
                  value={jalonForm.type}
                  onChange={(e) => setJalonForm((s) => ({ ...s, type: e.target.value }))}
                />
                <Input
                  placeholder="Label"
                  value={jalonForm.label}
                  onChange={(e) => setJalonForm((s) => ({ ...s, label: e.target.value }))}
                />
                <Input
                  type="date"
                  value={jalonForm.date_prevue}
                  onChange={(e) => setJalonForm((s) => ({ ...s, date_prevue: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleCreateJalon}>Nouveau jalon</Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 px-2">Code projet</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Label</th>
                      <th className="py-2 px-2">Date prévue</th>
                      <th className="py-2 px-2">Date réelle</th>
                      <th className="py-2 px-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jalonsFiltered.map((j) => (
                      <tr key={j.id} className="border-b border-slate-100">
                        <td className="py-2 px-2">{j.code_projet}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline">{j.type}</Badge>
                        </td>
                        <td className="py-2 px-2">{j.label}</td>
                        <td className="py-2 px-2">{j.date_prevue}</td>
                        <td className="py-2 px-2">
                          <Input
                            type="date"
                            value={j.date_reelle || ''}
                            onChange={(e) => updateJalon(j.id, { date_reelle: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Select
                            value={j.statut}
                            onValueChange={(value) => updateJalon(j.id, { statut: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en_attente">en_attente</SelectItem>
                              <SelectItem value="atteint">atteint</SelectItem>
                              <SelectItem value="retard">retard</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jalonsFiltered.length === 0 && (
                  <div className="text-sm text-slate-500 mt-3">Aucun jalon.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="disponibilites" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Select value={dispoForm.consultant_id} onValueChange={(value) => setDispoForm((s) => ({ ...s, consultant_id: value }))}>
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
                <Select value={dispoForm.type} onValueChange={(value) => setDispoForm((s) => ({ ...s, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conges">congés</SelectItem>
                    <SelectItem value="formation">formation</SelectItem>
                    <SelectItem value="intercontrat">intercontrat</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={dispoForm.date_debut} onChange={(e) => setDispoForm((s) => ({ ...s, date_debut: e.target.value }))} />
                <Input type="date" value={dispoForm.date_fin} onChange={(e) => setDispoForm((s) => ({ ...s, date_fin: e.target.value }))} />
                <Input placeholder="Commentaire" value={dispoForm.commentaire} onChange={(e) => setDispoForm((s) => ({ ...s, commentaire: e.target.value }))} />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleCreateDispo}>Nouvelle disponibilité</Button>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-64">
                  <Label>Filtrer par consultant</Label>
                  <Select
                    value={filterDispoConsultant || 'all'}
                    onValueChange={(value) => setFilterDispoConsultant(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {consultants.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.prenom} {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    {disponibilitesFiltered.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100">
                        <td className="py-2 px-2">{renderConsultantName(d.consultant_id)}</td>
                        <td className="py-2 px-2">
                          <Badge className={typeBadge(d.type)}>{d.type}</Badge>
                        </td>
                        <td className="py-2 px-2">{d.date_debut}</td>
                        <td className="py-2 px-2">{d.date_fin}</td>
                        <td className="py-2 px-2">{d.commentaire || '-'}</td>
                        <td className="py-2 px-2">
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeDisponibilite(d.id)}>
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {disponibilitesFiltered.length === 0 && (
                  <div className="text-sm text-slate-500 mt-3">Aucune disponibilité.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {wizardOpen && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Nouvelle réservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-md mx-auto flex items-center justify-between">
              {wizardSteps.map((label, index) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold ${wizardStep > index + 1 ? 'bg-indigo-600 text-white border-indigo-600' : wizardStep === index + 1 ? 'border-indigo-600 text-indigo-700' : 'border-slate-300 text-slate-400'}`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs ${wizardStep === index + 1 ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>{label}</span>
                  {index < wizardSteps.length - 1 && <div className="w-6 h-px bg-slate-200" />}
                </div>
              ))}
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={(value) => {
                        setSelectedClient(value);
                        setSelectedProjet('');
                        setSelectedPrestationProjet('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.code_client}>
                            {c.nom} · {c.code_client}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Projet</Label>
                    <Select value={selectedProjet} onValueChange={setSelectedProjet} disabled={!selectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projetsDisponibles.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  {prestationsByProjet.map((p) => {
                    const reste = resteParPrestation.get(p.id) ?? 0;
                    return (
                      <div key={p.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${reste > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
                        <div className="text-sm font-medium">{p.label}</div>
                        <div className="text-xs text-slate-600">
                          Reste à planifier: <span className={reste > 0 ? 'text-amber-700 font-semibold' : 'text-slate-600'}>{reste.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {prestationsByProjet.length === 0 && (
                    <div className="text-sm text-slate-500">Aucune prestation pour ce projet.</div>
                  )}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <Label>Prestation</Label>
                <Select value={selectedPrestationProjet} onValueChange={setSelectedPrestationProjet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une prestation" />
                  </SelectTrigger>
                  <SelectContent>
                    {prestationsByProjet.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={nbJours}
                    onChange={(e) => setNbJours(e.target.value)}
                  />
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sur_site">sur_site</SelectItem>
                      <SelectItem value="distanciel">distanciel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={trajetAller} onChange={(e) => setTrajetAller(e.target.checked)} />
                    Trajet aller
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={trajetRetour} onChange={(e) => setTrajetRetour(e.target.checked)} />
                    Trajet retour
                  </label>
                </div>

                <Textarea placeholder="Commentaire" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />

                <div className="space-y-2">
                  <Label>Consultants & compétences</Label>
                  <div className="space-y-2">
                    {consultants.map((c) => {
                      const competencesList = Array.isArray(c.competences)
                        ? c.competences
                            .map((item: any) => {
                              const label = competenceById.get(item.competence_id) || item.competence_id;
                              return `${label} (${item.niveau ?? '-'})`;
                            })
                            .slice(0, 3)
                            .join(', ')
                        : '';
                      const dispo = disponibilites
                        .filter((d) => d.consultant_id === c.id)
                        .slice(0, 1)
                        .map((d) => `${d.type} ${d.date_debut} → ${d.date_fin}`)
                        .join(', ');
                      return (
                        <label key={c.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${selectedConsultant === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                          <div>
                            <div className="text-sm font-medium">{c.prenom} {c.nom}</div>
                            <div className="text-xs text-slate-500">{competencesList || 'Compétences non renseignées'}</div>
                            <div className="text-xs text-slate-400">{dispo || 'Aucune disponibilité saisie'}</div>
                          </div>
                          <input type="radio" name="consultant" checked={selectedConsultant === c.id} onChange={() => setSelectedConsultant(c.id)} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Projet</div>
                  <div className="text-sm font-semibold">{selectedProjet || '-'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Prestation</div>
                  <div className="text-sm font-semibold">{selectedPrestation?.label || '-'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Consultant</div>
                  <div className="text-sm font-semibold">{renderConsultantName(selectedConsultant)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Dates</div>
                  <div className="text-sm font-semibold">{dateDebut} · {nbJours} jour(s)</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setWizardStep((s) => Math.max(1, s - 1))} disabled={wizardStep === 1}>
                Retour
              </Button>
              {wizardStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setWizardStep((s) => Math.min(3, s + 1))}
                  disabled={wizardStep === 1 ? !selectedClient || !selectedProjet : !selectedPrestationProjet || !selectedConsultant}
                >
                  Suivant
                </Button>
              ) : (
                <Button type="button" onClick={handleCreateReservation}>
                  Confirmer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

