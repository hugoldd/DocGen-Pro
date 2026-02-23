import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useContactsClients } from '../../hooks/useContactsClients';
import { useClients } from '../../hooks/useClients';

type ContactForm = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
};

const STEPS = [
  { id: 1, label: 'Identité' },
  { id: 2, label: 'Contacts' },
  { id: 3, label: 'Récapitulatif' },
];

const emptyContact = (): ContactForm => ({
  id: Math.random().toString(36).slice(2, 10),
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  poste: '',
});

export default function NouveauClientPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [codeClient, setCodeClient] = useState('');
  const [nom, setNom] = useState('');
  const [contacts, setContacts] = useState<ContactForm[]>([emptyContact()]);
  const [syncedCode, setSyncedCode] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [codeClientError, setCodeClientError] = useState<string | null>(null);
  const { items, loading, error, fetchByCode, replaceForCode } = useContactsClients();
  const { add, existsByCode } = useClients();

  useEffect(() => {
    const code = codeClient.trim();
    if (!code) {
      setSyncedCode('');
      return;
    }
    void fetchByCode(code);
  }, [codeClient, fetchByCode]);

  useEffect(() => {
    const code = codeClient.trim();
    if (!code || loading) return;
    if (syncedCode === code) return;
    const next = items.length
      ? items.map((item) => ({
          id: item.id,
          nom: item.nom,
          prenom: item.prenom,
          email: item.email,
          telephone: item.telephone,
          poste: item.poste,
        }))
      : [emptyContact()];
    setContacts(next);
    setSyncedCode(code);
  }, [items, loading, syncedCode, codeClient]);

  const canProceedStep1 = useMemo(() => codeClient.trim() && nom.trim(), [codeClient, nom]);
  const canProceedStep2 = useMemo(
    () => contacts.length > 0 && contacts.every((c) => c.nom.trim() || c.prenom.trim()),
    [contacts]
  );

  const updateContact = (id: string, updates: Partial<ContactForm>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeContact = (id: string) => {
    setContacts((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  const addContact = () => {
    setContacts((prev) => [...prev, emptyContact()]);
  };

  const syncContacts = async () => {
    const code = codeClient.trim();
    if (!code) return;
    const payload = contacts.map((c) => ({
      code_client: code,
      nom: c.nom.trim(),
      prenom: c.prenom.trim(),
      email: c.email.trim(),
      telephone: c.telephone.trim(),
      poste: c.poste.trim(),
    }));
    await replaceForCode(code, payload);
  };

  const handleNext = async () => {
    setSubmitError(null);
    if (step === 1) {
      setCodeClientError(null);
      const exists = await existsByCode(codeClient);
      if (exists) {
        setCodeClientError('Ce code client existe déjà');
        return;
      }
    }
    if (step === 2 && canProceedStep2) {
      await syncContacts();
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleFinish = async () => {
    setSubmitError(null);
    try {
      const createdId = await add({
        code_client: codeClient.trim(),
        nom: nom.trim(),
        type_structure: '',
        ville: '',
        statut: 'prospect',
        data_salesforce: null,
      });
      if (!createdId) {
        setSubmitError('Impossible de créer le client.');
        return;
      }
      await syncContacts();
      navigate(`/clients/${createdId}`);
    } catch (err) {
      setSubmitError('Impossible de créer le client.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Card className="shadow-xl border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Nouveau client</CardTitle>
          <p className="text-sm text-slate-500">
            Le code client est l’identifiant unique partagé avec le workflow DocGen.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              {STEPS.map((s, idx) => {
                const isDone = step > s.id;
                const isActive = step === s.id;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border text-xs font-semibold',
                        isDone
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : isActive
                          ? 'border-indigo-600 text-indigo-700'
                          : 'border-slate-300 text-slate-400'
                      )}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={cn('text-xs', isActive ? 'text-indigo-700 font-semibold' : 'text-slate-500')}>
                      {s.label}
                    </span>
                    {idx < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200" />}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Code client *</Label>
                <Input
                  value={codeClient}
                  onChange={(e) => {
                    setCodeClient(e.target.value);
                    setCodeClientError(null);
                  }}
                  placeholder="C-2026-001"
                />
                {codeClientError && (
                  <div className="text-sm text-red-600">{codeClientError}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Entreprise SAS" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-sm font-semibold text-slate-900">Interlocuteurs</span>
                <Button type="button" variant="outline" onClick={addContact}>
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </div>

              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-slate-200 p-4 space-y-4">
                  {contacts.length > 1 && (
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(contact.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input value={contact.nom} onChange={(e) => updateContact(contact.id, { nom: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input value={contact.prenom} onChange={(e) => updateContact(contact.id, { prenom: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={contact.email} onChange={(e) => updateContact(contact.id, { email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={contact.telephone} onChange={(e) => updateContact(contact.id, { telephone: e.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Poste</Label>
                      <Input value={contact.poste} onChange={(e) => updateContact(contact.id, { poste: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Code client</div>
                <div className="text-lg font-semibold text-slate-900">{codeClient || '-'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Nom</div>
                <div className="text-lg font-semibold text-slate-900">{nom || '-'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500 mb-2">Interlocuteurs</div>
                <div className="space-y-2 text-sm">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex flex-wrap gap-2 text-slate-700">
                      <span className="font-medium">{[c.prenom, c.nom].filter(Boolean).join(' ') || '-'}</span>
                      <span className="text-slate-400">·</span>
                      <span>{c.poste || '-'}</span>
                      <span className="text-slate-400">·</span>
                      <span>{c.email || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1}>
              Retour
            </Button>
            <Button
              type="button"
              onClick={() => (step === STEPS.length ? void handleFinish() : void handleNext())}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            >
              {step === STEPS.length ? 'Terminer' : 'Suivant'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

