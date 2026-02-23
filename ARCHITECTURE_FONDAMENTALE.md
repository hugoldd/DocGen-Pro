# ARCHITECTURE FONDAMENTALE — App Unifiée ERP + DocGen Pro
> Document de référence permanent · Toute décision technique doit être cohérente avec ce fichier

---

## 1. Identité du projet

Application web unifiée qui fusionne :
- **ERP Gestion de Projet** (clients, consultants, équipes, planning, réservations)
- **DocGen Pro** (génération documentaire, templates, planning d'envoi emails)

Une seule application, une seule base de données, un seul login.

---

## 2. Stack technique — IMMUABLE

| Couche | Technologie | Raison |
|--------|-------------|--------|
| Framework | React 18 + TypeScript | Base DocGen Pro, stable |
| Build | Vite 6 | Idem |
| Routing | React Router 7 | Idem |
| Styles | TailwindCSS 4 | Idem |
| Composants UI | shadcn/ui + Radix UI | Idem — MUI (ERP) est abandonné |
| Backend | **PocketBase** | Zéro infra, tout-en-un |
| Icônes | Lucide React | Idem |
| Génération DOCX | docxtemplater + PizZip | Idem |
| Génération PDF | pdfmake | Idem |
| Génération XLSX | ExcelJS | Idem |

### Règles stack
- ❌ Ne pas introduire Next.js, Redux, MUI, Zustand
- ❌ Ne pas utiliser localStorage pour les données métier (migration totale vers PocketBase)
- ✅ localStorage autorisé uniquement pour préférences UI (thème, colonnes)
- ✅ sessionStorage autorisé uniquement pour le token d'auth temporaire

---

## 3. Identifiants universels — CLÉ DE VOÛTE

### `code_client` — identifiant métier universel du client
- Provient de Salesforce, saisi manuellement par l'utilisateur
- Format libre mais unique (ex: `C-2026-042`)
- **C'est la clé qui relie toutes les entités dans toute l'application**
- Saisi obligatoirement à la création du client (étape 1 du wizard client)
- Aucune entité liée à un client ne peut exister sans `code_client` valide

### `code_projet` — identifiant métier universel du projet
- Généré automatiquement à la création du projet
- Format : `{code_client}-{YYYY}-{séquence}` (ex: `C-2026-042-2026-001`)
- Lien explicite avec le client via `code_client`

### Règle absolue
> Toute table PocketBase qui concerne un client doit avoir un champ `code_client`.  
> Toute table qui concerne un projet doit avoir un champ `code_projet`.  
> Les jointures se font sur ces codes métier, pas uniquement sur les UUIDs PocketBase.

---

## 4. Structure PocketBase — Collections

### Entité centrale — `projets`
> `GenerationRecord` (DocGen Pro) et `Projet` (ERP) sont la **même entité**.  
> DocGen Pro génère les documents dessus. L'ERP planifie les ressources dessus.  
> Les deux modules travaillent sur le même enregistrement.

| Champ | Origine | Description |
|-------|---------|-------------|
| `code_client` | Les deux | Clé métier client (Salesforce, saisie manuelle) |
| `code_projet` | Les deux | Identifiant unique du projet |
| `project_type_id` | DocGen Pro | Lien vers le paramétrage (options, règles, templates) |
| `statut` | ERP | `bannette / affecte / en_cours / termine / cloture` |
| `deployment_date` | DocGen Pro | Date de déploiement pour calcul planning |
| `selected_option_ids` | DocGen Pro | Options cochées lors du workflow |
| `answers` | DocGen Pro | Réponses aux questions prérequis |
| `files_generated` | DocGen Pro | Fichiers générés (JSON) |
| `scheduled_emails` | DocGen Pro | Planning emails (JSON) |
| `scheduled_documents` | DocGen Pro | Planning documents (JSON) |
| `scheduled_questions` | DocGen Pro | Planning questions (JSON) |
| `sent_email_ids` | DocGen Pro | IDs emails marqués envoyés |
| `contacts` | Les deux | Interlocuteurs du projet |
| `generation_status` | DocGen Pro | `success / error` |

### Module Clients
| Collection | Champs clés |
|------------|-------------|
| `clients` | `code_client` (unique, required), `nom`, `type_structure`, `ville`, `statut`, `data_salesforce` |
| `contacts_clients` | `code_client`, `nom`, `prenom`, `email`, `telephone`, `role`, `ordre` (Number 1-3) — les 3 premiers par ordre mappent automatiquement sur `contact_1_*`, `contact_2_*`, `contact_3_*` dans les templates DocGen |
| `notes_clients` | `code_client`, `contenu`, `tags[]` |
| `commandes` | `code_client`, `code_projet`, `statut` |

### Module Planning
| Collection | Champs clés |
|------------|-------------|
| `prestations_projet` | `code_projet`, `prestation_id`, `label`, `jours_prevus`, `jours_supplementaires`, `annule` (Bool), `forfait` (Bool), `mode_defaut` (sur_site/distanciel) |
| `reservations` | `code_projet`, `prestation_projet_id`, `consultant_id`, `date_debut`, `nb_jours` (min 0.5), `mode` (sur_site/distanciel), `avec_trajet_aller` (Bool), `avec_trajet_retour` (Bool), `commentaire` |
| `jalons` | `code_projet`, `type` (jalon/phase/livrable), `label`, `date_prevue`, `date_reelle`, `statut` (en_attente/atteint/retard) |
| `disponibilites` | `consultant_id`, `type` (conges/formation/intercontrat), `date_debut`, `date_fin`, `commentaire` |

### Règles métier planning
- `prestations` catalogue → ajouter `forfait` (Bool) + `competences_requises` (JSON `[{ competence_id, niveau_min }]`)
- Reste à planifier = `(jours_prevus + jours_supplementaires) - somme(reservations.nb_jours)` — calculé côté React
- Découpage réservation minimum 0.5j
- Jours supplémentaires = jours non vendus mais nécessaires, ajoutables en cours de projet
- Trajet auto 0.5j aller + 0.5j retour si temps trajet > 3h (OpenRouteService en P7)
- Disponibilités saisies par DP, chef d'équipe et consultant (rôles gérés en P7)
- Alertes reste à planifier visibles sur dashboard et fiche client onglet Projets
- Planning magique (algorithme optimisation) prévu en P7
- Vues : tableau (P4) → calendaire → Gantt → Kanban (versions ultérieures)

### Module DocGen — Paramétrages
| Collection | Champs clés |
|------------|-------------|
| `templates` | `name`, `type` (DOCX/XLSX/PDF/EMAIL), `project_type_id`, `content`, `file` (PocketBase file storage), `status` |
| `project_types` | `name`, `code` (saisi manuellement), `options` (JSON), `questions` (JSON), `document_rules` (JSON), `email_rules` (JSON), `schedules` (JSON), `status` |
| `variables` | `key` (unique), `label` |

### Module Auth
| Collection | Champs clés |
|------------|-------------|
| `users` | PocketBase natif — email, password, role (`admin`) |

---

---

## 5. Zones fonctionnelles — Structure UI

### ZONE 1 — Paramétrage (fusionné DocGen + Ressources)
| Section | Contenu | Statut |
|---------|---------|--------|
| Templates | DOCX, XLSX, PDF, EMAIL — éditeur + import base64 | Terminé |
| Types de projet | Options, questions, règles docs/emails, planning, packs associés | Terminé |
| Variables | Dictionnaire {{variable}} | Terminé |
| Compétences | Catalogue compétences (technique, fonctionnel, métier, soft) | Terminé |
| Prestations | Catalogue prestations unitaires + forfait (Bool) + competences_requises | Terminé |
| Packs de prestations | Regroupement de prestations avec quantités de jours + montants | Terminé |
| Consultants | Profils, compétences, jours_travailles, disponibilité | Terminé |
| Équipes | Groupes de consultants avec responsable | Terminé |

### ZONE 2 — Wizard prise en charge (WorkflowEngine.tsx) — ORDRE FINAL VALIDÉ

| Etape | Contenu | Statut |
|-------|---------|--------|
| 1 | Informations client (sélection client existant, contacts pré-chargés) | Terminé |
| 2 | Type de projet | Terminé |
| 3 | Options du projet | A réintégrer |
| 4 | Questions prérequis | Terminé |
| 5 | Packs (sélection + création prestations_projet dans PocketBase) | A réintégrer |
| 6 | Réservations (consultants, calendrier demi-journées FR, blocages jours) | En cours |
| 7 | Génération documents DocGen | A réintégrer |
| 8 | Récapitulatif / Confirmation | Terminé |

**RÈGLES CRITIQUES WorkflowEngine.tsx :**
- Fichier très long (2000+ lignes) — 1 seul composant ou 1 seule logique par prompt
- Ne JAMAIS réimplémenter tout le fichier en un seul prompt (timeout Codex garanti)
- Commiter après CHAQUE prompt validé
- L'étape 5 (Packs) crée les prestations_projet dans PocketBase — sans cette étape l'étape 6 (Réservations) n'a rien à afficher
- Toujours vérifier la liste des étapes avant et après modification

### ZONE 3 — Vues opérationnelles

| Vue | Route | Statut |
|-----|-------|--------|
| Dashboard | /dashboard | Existant |
| Fiche client | /clients/:id (7 onglets) | Terminé |
| Fiche projet | /projets/:id (réservations + jalons) | Créé (à améliorer en P6) |
| Planning envois DocGen | /planning/docgen | Terminé |
| Planning projets | /planning/projets | Terminé |
| Historique | /history | Terminé |

---

## 6. Architecture React — Fichiers clés

```
src/
├── lib/pb.ts                          # Client PocketBase singleton
├── app/
│   ├── App.tsx                        # AuthGate + Router
│   ├── routes.tsx                     # Toutes les routes
│   ├── context/
│   │   ├── AuthContext.tsx            # Auth PocketBase
│   │   └── AppContext.tsx             # État global (project_types, variables)
│   ├── types/index.ts                 # TOUS les types TS — source de vérité unique
│   ├── utils/
│   │   ├── engine.ts                  # Logique métier DocGen — NE PAS TOUCHER
│   │   └── fileGenerator.ts          # Génération fichiers — NE PAS TOUCHER
│   ├── hooks/
│   │   ├── useClients.ts
│   │   ├── useProjets.ts              # inclut upsert() et generateCodeProjet()
│   │   ├── useTemplates.ts
│   │   ├── useProjectTypes.ts
│   │   ├── useVariables.ts
│   │   ├── useCompetences.ts
│   │   ├── usePrestations.ts
│   │   ├── usePacks.ts
│   │   ├── useConsultants.ts
│   │   ├── useEquipes.ts
│   │   ├── usePrestationsProjet.ts
│   │   ├── useReservations.ts
│   │   ├── useJalons.ts
│   │   ├── useDisponibilites.ts
│   │   ├── useContactsClients.ts
│   │   ├── useNotesClients.ts
│   │   ├── useClientActivity.ts
│   │   ├── useClientSatisfaction.ts
│   │   └── useClientFinance.ts
│   ├── layout/DashboardLayout.tsx     # Sidebar + header
│   └── pages/
│       ├── dashboard/
│       ├── workflow/
│       │   └── WorkflowEngine.tsx    # Wizard fusionné — fichier critique
│       ├── history/History.tsx
│       ├── clients/
│       │   ├── ClientsPage.tsx
│       │   ├── NouveauClientPage.tsx
│       │   └── ClientDetailPage.tsx
│       ├── projets/
│       │   └── ProjetDetailPage.tsx
│       ├── planning/
│       │   ├── PlanningDocGenPage.tsx
│       │   └── PlanningProjetsPage.tsx
│       └── parametrage/
│           ├── competences/
│           ├── prestations/
│           ├── packs/
│           ├── consultants/
│           └── equipes/
```

---

## 7. Principe UX — WIZARD PARTOUT

- Création client → wizard 3 étapes (code_client, infos, contacts)
- Prise en charge projet → wizard fusionné 8 étapes (WorkflowEngine.tsx)
- Création consultant → wizard 4 étapes
- Création pack → wizard 3 étapes

Règle : aucun formulaire monolithique. Indicateurs d'étapes : `max-w-md mx-auto`.

---

## 8. Auth — Phases

### Phase 1 (actuelle)
- Compte admin unique PocketBase
- Login via PocketBase Auth natif
- Accès total à tout

### Phase 2 (P7)
- Comptes supplémentaires en dur dans PocketBase admin
- Champ `role` : admin / dp / chef_equipe / consultant
- Filtrage UI selon le rôle

---

## 9. Règles de développement — PERMANENTES

1. **Encodage UTF-8** — écrire directement les caractères accentués. Ne JAMAIS utiliser de script automatique de conversion. En cas de corruption : `git checkout HEAD -- fichier.tsx`
2. **Commiter après chaque prompt validé** — `git add . && git commit -m "description"`. Ne jamais laisser plus d'un prompt non commité.
3. **Lire avant d'écrire** — Claude Code lit les fichiers existants avant toute modification
4. **Un prompt = une chose** — sur WorkflowEngine.tsx : maximum 1 composant ou 1 logique par prompt
5. **Ne pas toucher ce qui fonctionne** — engine.ts et fileGenerator.ts sont intouchables
6. **Types d'abord** — tout nouveau modèle dans types/index.ts avant d'être codé
7. **PocketBase via hook dédié** — jamais d'appel PocketBase direct dans les pages
8. **code_client obligatoire** — aucune entité client sans ce champ
9. **Pas de MUI** — shadcn/ui uniquement
10. **contacts_clients = source de vérité unique** — interlocuteurs lus depuis contacts_clients, triés par ordre (1,2,3), mappés sur contact_1_*, contact_2_*, contact_3_*
11. **Upsert pour les projets** — useProjets.upsert() vérifie toujours si le projet existe (code_client + code_projet) avant de créer

---

## 10. Ordre de développement

| Phase | Statut | Contenu |
|-------|--------|---------|
| P0 | Terminé | Setup PocketBase + client React + Auth admin |
| P1 | Terminé | Migration DocGen Pro vers PocketBase |
| P2 | Terminé | Paramétrage ressources : compétences, prestations, packs, consultants, équipes |
| P3 | Terminé | Fiche client unifiée 7 onglets |
| P4 | Terminé | Module Planning ressources : vue tableau |
| P5 | En cours | Wizard prise en charge fusionné — voir section 11 |
| P6 | A faire | Fiche projet détaillée + intégration croisée planning/fiche client |
| P7 | A faire | Auth multi-utilisateurs |
| P8 | A faire | Planning magique (algorithme optimisation) |
| P9 | A faire | OpenRouteService (calcul distances/trajets) |

---

## 11. P5 — État exact au moment de la pause + reprise

### Ce qui fonctionne (à ne pas retoucher)
- Étape 1 : sélection client avec contacts pré-chargés depuis contacts_clients
- Étape 2 : sélection type de projet
- Étape 4 : questions prérequis
- Étape 8 : récapitulatif / confirmation
- Création projet via upsert (pas de doublons)
- Code projet auto-généré : {code_client}-P001, P002...
- Redirect après génération via navigate() React Router

### Ce qui manque — à réintégrer en P5 (DANS CET ORDRE)

**Prompt A — Réintégrer étape Options (étape 3) :**
Lire WorkflowEngine.tsx. Ajouter l'étape Options entre Type de projet et Questions prérequis. Afficher les options du project_type sélectionné avec cases à cocher. Stocker dans selected_option_ids.
1 seul fichier : WorkflowEngine.tsx. Commiter après validation.

**Prompt B — Réintégrer étape Packs (étape 5) :**
Lire WorkflowEngine.tsx, usePacks.ts, usePrestationsProjet.ts.
Ajouter l'étape Packs entre Questions et Réservations :
- Afficher packs associés au type de projet (project_type.pack_ids) pré-cochés
- Permettre ajout d'autres packs
- A la validation : créer les prestations_projet dans PocketBase pour chaque ligne de chaque pack sélectionné
1 seul fichier : WorkflowEngine.tsx. Commiter après validation.

**Prompt C — Vérifier étape Réservations :**
Lire WorkflowEngine.tsx, usePrestationsProjet.ts, useReservations.ts.
Vérifier que l'étape Réservations charge bien les prestations_projet filtrées par code_projet depuis PocketBase.
Si vide : corriger le chargement. Commiter après validation.

**Prompt D — Réintégrer étape Génération documents (étape 7) :**
Lire WorkflowEngine.tsx, engine.ts (lecture seule), fileGenerator.ts (lecture seule).
Réintégrer la logique de génération DocGen entre Réservations et Récapitulatif.
1 seul fichier : WorkflowEngine.tsx. Commiter après validation.

### Bugs connus à corriger après P5
- Doublons lignes projet dans l'historique (useProjets.upsert à vérifier)
- ProjetDetailPage : UX à améliorer (P6)

### Collections PocketBase créées (toutes avec API Rules vides)
variables, project_types, templates, projets, clients, contacts_clients, notes_clients, commandes, client_activity_events, client_satisfaction_evaluations, client_finance_invoices, client_finance_payments, competences, prestations, packs, consultants, equipes, prestations_projet, reservations, jalons, disponibilites

