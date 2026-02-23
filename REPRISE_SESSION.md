# REPRISE DE SESSION — Fusion ERP + DocGen Pro

> Lire ce fichier EN PREMIER à chaque reprise de conversation.
> Puis lire ARCHITECTURE_FONDAMENTALE.md pour le contexte complet.

---

## Contexte rapide

Application React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + PocketBase.
Fusion de DocGen Pro (génération documentaire) et ERP Gestion de Projet.
Repo : `C:\Users\Hugo\Desktop\devweb\DocGen Pro\`
PocketBase : `C:\Users\Hugo\Desktop\devweb\pocketbase\pocketbase.exe serve`

---

## Où on en est

**P5 — Wizard prise en charge fusionné — EN COURS**

Le fichier `WorkflowEngine.tsx` est le coeur du wizard. Il a subi beaucoup de modifications et certaines étapes ont été perdues lors d'un git checkout.

### Étapes du wizard — ÉTAT COMMITÉ (commit 21ed98c)
```
1. StepClientInfo        — Terminé
2. StepProjectSelection  — Terminé
3. StepOptions           — Terminé (réintégré)
4. StepQuestions         — Terminé
5. StepPacks             — Terminé (réintégré, crée prestations_projet dans PB)
6. StepReservations      — Terminé (calendrier FR, demi-journées, blocages)
7. StepSummary           — Génération documents DocGen
8. StepSuccess           — Confirmation finale
```

### Prochaines étapes à tester (reprise)

**Test 1 — Parcourir le wizard complet :**
- Créer une prise en charge de A à Z
- Vérifier étape 3 Options : cases à cocher depuis le type de projet
- Vérifier étape 5 Packs : packs du type de projet pré-cochés
- Vérifier étape 6 Réservations : les prestations du pack s'affichent bien
- Vérifier étape 7 : génération des fichiers fonctionne
- Vérifier que le projet et les prestations_projet apparaissent dans PocketBase

**Si les prestations ne s'affichent pas en étape 6 — Prompt C :**
```
Lis src/app/pages/workflow/WorkflowEngine.tsx, src/app/hooks/usePrestationsProjet.ts.
Vérifier que StepReservations charge les prestations_projet depuis PocketBase
filtrées par code_projet courant. Si elles ne s'affichent pas, corriger le chargement.
Fichiers autorisés : WorkflowEngine.tsx uniquement.
Retour : 2 lignes max.
```
**Commiter après validation.**

---

## Règles critiques à rappeler à Claude Code

1. **WorkflowEngine.tsx est très long (2000+ lignes)** — 1 seul composant ou 1 seule logique par prompt, jamais tout réimplémenter
2. **Commiter après chaque prompt validé** — `git add . && git commit -m "description"`
3. **Encodage UTF-8** — écrire directement les caractères accentués, ne jamais utiliser de script de conversion. Si corruption : `git checkout HEAD -- fichier.tsx`
4. **Ne jamais toucher** engine.ts et fileGenerator.ts
5. **PocketBase via hook dédié** — jamais d'appel direct dans les pages

---

## Après P5 — P6

Une fois le wizard complet et stable, P6 :
- Améliorer ProjetDetailPage (src/app/pages/projets/ProjetDetailPage.tsx)
- Réorganiser l'onglet Projets & Commandes dans la fiche client
- Intégration croisée planning/fiche client

---

## PocketBase — Collections existantes

variables, project_types, templates, projets, clients, contacts_clients,
notes_clients, commandes, client_activity_events, client_satisfaction_evaluations,
client_finance_invoices, client_finance_payments, competences, prestations, packs,
consultants, equipes, prestations_projet, reservations, jalons, disponibilites

Toutes avec API Rules vides (accès autorisé users connectés).
