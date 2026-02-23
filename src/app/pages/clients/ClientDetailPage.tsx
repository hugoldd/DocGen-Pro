import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Plus, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { useClients } from '../../hooks/useClients';
import { useContactsClients } from '../../hooks/useContactsClients';
import { useNotesClients } from '../../hooks/useNotesClients';
import { useClientSatisfaction } from '../../hooks/useClientSatisfaction';
import { useClientFinance } from '../../hooks/useClientFinance';
import { useProjets } from '../../hooks/useProjets';

const statusBadge = (statut: string) => {
  if (statut === 'actif') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (statut === 'prospect') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (statut === 'inactif') return 'bg-slate-200 text-slate-600 border-slate-300';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const starRow = (score: number) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className="w-4 h-4"
        fill={s <= score ? '#f59e0b' : 'none'}
        stroke={s <= score ? '#f59e0b' : '#cbd5f5'}
      />
    ))}
  </div>
);

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: clients, update: updateClient } = useClients();
  const client = clients.find((c) => c.id === id);

  const codeClient = client?.code_client ?? '';
  const { items: contacts, add: addContact, remove: removeContact } = useContactsClients(codeClient);
  const { items: notes, add: addNote } = useNotesClients(codeClient);
  const { items: evaluations, add: addEvaluation } = useClientSatisfaction(codeClient);
  const { invoices, payments, commandes } = useClientFinance(codeClient);
  const { getByClient } = useProjets();

  const [contactForm, setContactForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
  });
  const [noteForm, setNoteForm] = useState({ contenu: '', tags: '' });
  const [evaluationForm, setEvaluationForm] = useState({ score: 5, periode: '', commentaire: '' });

  const filteredProjets = useMemo(() => getByClient(codeClient), [getByClient, codeClient]);

  const activeAlertes = useMemo(() => {
    const list: Array<{ id: string; message: string; niveau: 'danger' | 'warning' | 'info' }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(today.getDate() + 7);

    filteredProjets.forEach((p) => {
      if (p.status === 'error') {
        list.push({
          id: `gen-${p.id}`,
          message: 'Erreur de génération',
          niveau: 'danger',
        });
      }

      (p.scheduledEmails || []).forEach((email) => {
        if (p.sentEmailIds?.includes(email.id)) return;
        const d = new Date(email.date);
        if (Number.isNaN(d.getTime())) return;
        if (d < today) {
          list.push({
            id: `email-late-${p.id}-${email.id}`,
            message: 'En retard',
            niveau: 'warning',
          });
        } else if (d <= soon) {
          list.push({
            id: `email-soon-${p.id}-${email.id}`,
            message: 'Imminent',
            niveau: 'info',
          });
        }
      });

      (p.scheduledDocuments || []).forEach((doc) => {
        if (p.sentDocumentIds?.includes(doc.id)) return;
        const d = new Date(doc.date);
        if (Number.isNaN(d.getTime())) return;
        if (d < today) {
          list.push({
            id: `doc-late-${p.id}-${doc.id}`,
            message: 'En retard',
            niveau: 'warning',
          });
        } else if (d <= soon) {
          list.push({
            id: `doc-soon-${p.id}-${doc.id}`,
            message: 'Imminent',
            niveau: 'info',
          });
        }
      });
    });

    return list;
  }, [filteredProjets]);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const aOrdre = (a as { ordre?: number }).ordre ?? 999;
      const bOrdre = (b as { ordre?: number }).ordre ?? 999;
      return aOrdre - bOrdre;
    });
  }, [contacts]);

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="text-lg font-semibold">Client introuvable</div>
            <Button onClick={() => navigate('/clients')}>Retour aux clients</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddContact = async () => {
    if (!codeClient) return;
    await addContact({
      code_client: codeClient,
      nom: contactForm.nom.trim(),
      prenom: contactForm.prenom.trim(),
      email: contactForm.email.trim(),
      telephone: contactForm.telephone.trim(),
      poste: contactForm.poste.trim(),
    });
    setContactForm({ nom: '', prenom: '', email: '', telephone: '', poste: '' });
  };

  const handleAddNote = async () => {
    if (!codeClient || !noteForm.contenu.trim()) return;
    const tags = noteForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await addNote({ code_client: codeClient, contenu: noteForm.contenu.trim(), tags });
    setNoteForm({ contenu: '', tags: '' });
  };

  const handleAddEvaluation = async () => {
    if (!codeClient) return;
    await addEvaluation({
      code_client: codeClient,
      score: evaluationForm.score,
      periode: evaluationForm.periode.trim(),
      commentaire: evaluationForm.commentaire.trim(),
    });
    setEvaluationForm({ score: 5, periode: '', commentaire: '' });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Fiche client</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Code client</Badge>
            <span className="text-lg font-semibold text-slate-900">{client.code_client}</span>
            <Badge className={statusBadge(client.statut)}>{client.statut || 'n/a'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xl font-semibold text-slate-900">{client.nom}</div>
          <div className="text-sm text-slate-500">{client.ville || 'Ville non renseignée'}</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="synthese" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="projets">Projets & Commandes</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="documents">Documents & Notes</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500">Projets</div>
                <div className="text-2xl font-semibold">{filteredProjets.length}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500">Contacts</div>
                <div className="text-2xl font-semibold">{contacts.length}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500">Commandes</div>
                <div className="text-2xl font-semibold">{commandes.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Alertes actives</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlertes.length === 0 ? (
                <div className="text-sm text-slate-500">Aucune alerte active.</div>
              ) : (
                <div className="space-y-2">
                  {activeAlertes.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium">{a.message}</span>
                      <Badge
                        className={
                          a.niveau === 'danger'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : a.niveau === 'warning'
                            ? 'bg-orange-100 text-orange-700 border-orange-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }
                      >
                        {a.niveau === 'danger' ? 'Erreur' : a.niveau === 'warning' ? 'En retard' : 'Imminent'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identite" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={client.nom}
                  onChange={(e) => updateClient(client.id, { nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={client.ville}
                  onChange={(e) => updateClient(client.id, { ville: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type structure</Label>
                <Input
                  value={client.type_structure}
                  onChange={(e) => updateClient(client.id, { type_structure: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Input
                  value={client.statut}
                  onChange={(e) => updateClient(client.id, { statut: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Interlocuteurs</CardTitle>
                <p className="text-sm text-slate-500">Ordre 1-3 utilisé pour DocGen.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddContact}>
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Nom" value={contactForm.nom} onChange={(e) => setContactForm((s) => ({ ...s, nom: e.target.value }))} />
                <Input placeholder="Prénom" value={contactForm.prenom} onChange={(e) => setContactForm((s) => ({ ...s, prenom: e.target.value }))} />
                <Input placeholder="Poste" value={contactForm.poste} onChange={(e) => setContactForm((s) => ({ ...s, poste: e.target.value }))} />
                <Input placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm((s) => ({ ...s, email: e.target.value }))} />
                <Input placeholder="Téléphone" value={contactForm.telephone} onChange={(e) => setContactForm((s) => ({ ...s, telephone: e.target.value }))} />
              </div>

              {sortedContacts.length === 0 ? (
                <div className="text-sm text-slate-500">Aucun contact.</div>
              ) : (
                <div className="space-y-2">
                  {sortedContacts.map((c, idx) => (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="text-sm">
                        <span className="font-semibold">{[c.prenom, c.nom].filter(Boolean).join(' ') || '-'}</span>
                        <span className="text-slate-400"> Ã‚· </span>
                        <span>{c.poste || '-'}</span>
                        <span className="text-slate-400"> Ã‚· </span>
                        <span>{c.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Ordre {idx + 1}</Badge>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeContact(c.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projets" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Projets</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProjets.length === 0 ? (
                <div className="text-sm text-slate-500">Aucun projet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                        <th className="py-2 px-2">Code projet</th>
                        <th className="py-2 px-2">Statut</th>
                        <th className="py-2 px-2">Génération</th>
                        <th className="py-2 px-2">Déploiement</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjets.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100">
                          <td className="py-2 px-2">{p.codeProjet || p.id}</td>
                          <td className="py-2 px-2">-</td>
                          <td className="py-2 px-2">{p.status}</td>
                          <td className="py-2 px-2">{p.deploymentDate || '-'}</td>
                          <td className="py-2 px-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/projets/${p.id}`)}
                            >
                              Ouvrir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              {commandes.length === 0 ? (
                <div className="text-sm text-slate-500">Aucune commande.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                        <th className="py-2 px-2">Code projet</th>
                        <th className="py-2 px-2">Statut</th>
                        <th className="py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commandes.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100">
                          <td className="py-2 px-2">{c.code_projet || '-'}</td>
                          <td className="py-2 px-2">{c.statut}</td>
                          <td className="py-2 px-2">{c.total.toFixed(2)} Ã¢€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning">
          <Card className="border-slate-200">
            <CardContent className="p-6 text-sm text-slate-500">
              Planning disponible prochainement.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter une note..."
                  value={noteForm.contenu}
                  onChange={(e) => setNoteForm((s) => ({ ...s, contenu: e.target.value }))}
                />
                <Input
                  placeholder="Tags (séparés par des virgules)"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm((s) => ({ ...s, tags: e.target.value }))}
                />
                <Button type="button" onClick={handleAddNote}>
                  Ajouter la note
                </Button>
              </div>
              {notes.length === 0 ? (
                <div className="text-sm text-slate-500">Aucune note.</div>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-slate-200 px-3 py-2">
                      <div className="text-sm">{n.contenu}</div>
                      {n.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {n.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Fichiers générés</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProjets.flatMap((p) => p.filesGenerated || []).length === 0 ? (
                <div className="text-sm text-slate-500">Aucun fichier généré.</div>
              ) : (
                <div className="space-y-2">
                  {filteredProjets.flatMap((p) => p.filesGenerated || []).map((file, idx) => (
                    <div key={`${file.templateId}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-slate-500">{file.destinationPath}</div>
                      </div>
                      <Badge variant="outline">{file.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-sm text-slate-500">Aucune facture.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                        <th className="py-2 px-2">Montant</th>
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((f) => (
                        <tr key={f.id} className="border-b border-slate-100">
                          <td className="py-2 px-2">{f.montant.toFixed(2)} Ã¢€</td>
                          <td className="py-2 px-2">{f.date || '-'}</td>
                          <td className="py-2 px-2">
                            <Badge className={statusBadge(f.statut)}>{f.statut || 'n/a'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-sm text-slate-500">Aucun paiement.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                        <th className="py-2 px-2">Montant</th>
                        <th className="py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100">
                          <td className="py-2 px-2">{p.montant.toFixed(2)} Ã¢€</td>
                          <td className="py-2 px-2">{p.date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Ajouter une évaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={evaluationForm.score}
                  onChange={(e) => setEvaluationForm((s) => ({ ...s, score: Number(e.target.value) }))}
                  placeholder="Score"
                />
                <Input
                  value={evaluationForm.periode}
                  onChange={(e) => setEvaluationForm((s) => ({ ...s, periode: e.target.value }))}
                  placeholder="Période"
                />
                <Input
                  value={evaluationForm.commentaire}
                  onChange={(e) => setEvaluationForm((s) => ({ ...s, commentaire: e.target.value }))}
                  placeholder="Commentaire"
                />
              </div>
              <Button type="button" onClick={handleAddEvaluation}>
                Ajouter
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Évaluations</CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-sm text-slate-500">Aucune évaluation.</div>
              ) : (
                <div className="space-y-3">
                  {evaluations.map((e) => (
                    <div key={e.id} className="rounded-lg border border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{e.periode || 'Période'}</div>
                        {starRow(e.score)}
                      </div>
                      {e.commentaire && <div className="text-sm text-slate-600 mt-1">{e.commentaire}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}