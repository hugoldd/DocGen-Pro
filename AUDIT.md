# AUDIT — DocGen Pro · Web App for Document Management
> Généré le 2026-02-23 · React 18 / Vite 6 / React Router 7 / localStorage only

---

## 1. Arborescence `src/`

```
src/
├── main.tsx
├── lib/
│   └── utils.ts                    # Utilitaire classnames (clsx + tailwind-merge)
└── app/
    ├── App.tsx                     # Racine avec AuthGate
    ├── routes.tsx                  # Configuration React Router
    ├── context/
    │   ├── AppContext.tsx          # État global (templates, projets, variables, records)
    │   └── AuthContext.tsx         # État auth (sessionStorage)
    ├── types/
    │   └── index.ts                # Toutes les interfaces & types TS
    ├── utils/
    │   ├── engine.ts               # Résolution templates + règles de conditions
    │   ├── fileGenerator.ts        # Génération DOCX / XLSX / PDF / EMAIL
    │   └── settingsExport.ts       # Export JSON paramètres
    ├── hooks/
    │   └── useInsertAtCursor.ts    # Insertion texte au curseur dans textarea
    ├── layout/
    │   └── DashboardLayout.tsx     # Layout principal + navigation latérale
    ├── components/
    │   ├── PlanningView.tsx        # Visualisation planning réutilisable
    │   ├── VariablePickerButton.tsx# Sélecteur de variable pour templates
    │   ├── figma/
    │   │   └── ImageWithFallback.tsx
    │   └── ui/                     # 50+ composants shadcn/ui (forms, dialogs…)
    └── pages/
        ├── Dashboard.tsx
        ├── LoginPage.tsx
        ├── templates/
        │   ├── TemplateList.tsx
        │   └── TemplateEditor.tsx
        ├── config/
        │   ├── ProjectConfig.tsx
        │   ├── ProjectWizard.tsx
        │   └── VariablesPage.tsx
        ├── workflow/
        │   └── WorkflowEngine.tsx
        ├── history/
        │   └── History.tsx
        └── planning/
            └── PlanningPage.tsx
```

---

## 2. Types TypeScript (`src/app/types/index.ts`)

| Type | Champs clés |
|------|------------|
| `TemplateType` | `'DOCX' \| 'XLSX' \| 'PDF' \| 'EMAIL'` |
| `Template` | id, name, type, projectTypeId, content, emailSubject?, fileBase64?, variables[], linkedTemplateIds[], status |
| `ProjectOption` | id, label, subConfig? |
| `PrerequisiteQuestion` | id, label, answerType, required, condition?, dropdownOptions[] |
| `DocumentRule` | id, condition?, templateId, outputPattern, destinationPath, active |
| `EmailRule` | étend DocumentRule + recipient |
| `EmailScheduleRule` | id, emailRuleId, daysBeforeDeployment, generateOnWorkflow?, requiresAction? |
| `DocumentScheduleRule` | id, documentRuleId, daysBeforeDeployment, requiresAction, generateOnWorkflow? |
| `QuestionScheduleRule` | id, questionId, daysBeforeDeployment, requiresAction, generateOnWorkflow? |
| `ProjectType` | id, name, code, tags[], options[], questions[], documentRules[], emailRules[], emailSchedule?, documentSchedule?, questionSchedule?, status |
| `GeneratedFile` | name, type, templateId, destinationPath |
| `GenerationRecord` | id, date, clientName, clientNumber, projectTypeId, filesGenerated[], deploymentDate?, scheduledEmails?, contacts?, answers?, selectedOptionIds?, sentEmailIds?, status |

---

## 3. Données persistées

### localStorage (géré par `AppContext`)
| Clé | Contenu |
|-----|---------|
| `docgen_version` | Version schéma (actuellement `"3"`) |
| `docgen_templates` | `Template[]` — tous les modèles de documents |
| `docgen_projectTypes` | `ProjectType[]` — types de projets configurés |
| `docgen_variables` | `Record<key, label>` — variables personnalisées |
| `docgen_records` | `GenerationRecord[]` — historique des générations |

### sessionStorage (géré par `AuthContext`)
| Clé | Contenu |
|-----|---------|
| `docgen_auth` | `boolean` — flag d'authentification |

### Variables système prédéfinies (14)
`nom_client`, `numero_client`, `type_projet` + contacts 1–3 : `contact_N_nom`, `contact_N_email`, `contact_N_role`, `contact_N_telephone`

### Données initiales embarquées
- 2 `ProjectType` (produit Premium, consulting Standard)
- 4 `Template` (contrats, assurance, lettre de mission, email de bienvenue)
- 2 `GenerationRecord` d'exemple

---

## 4. Pages & rôles fonctionnels

| Route | Page | Rôle |
|-------|------|------|
| `/` (pré-auth) | `LoginPage` | Authentification email/password via variables `.env.local` |
| `/` | `Dashboard` | Stats globales (templates, projets, générations, emails en attente) + accès rapides |
| `/templates` | `TemplateList` | Liste, création, duplication, publication/brouillon des templates |
| `/templates/:id` | `TemplateEditor` | Éditeur WYSIWYG avec sélecteur de variables et prévisualisation |
| `/configuration` | `ProjectConfig` | Liste des types de projet avec statuts et actions |
| `/configuration/nouveau` | `ProjectWizard` | Éditeur multi-sections (identité, options, questions, règles, planning) |
| `/configuration/:id/modifier` | `ProjectWizard` | Modification d'un type de projet existant |
| `/variables` | `VariablesPage` | Gestion des variables personnalisées au-delà des 14 système |
| `/workflow` | `WorkflowEngine` | Assistant 5 étapes : infos client → choix projet → prérequis → récap → génération |
| `/history` | `History` | Historique paginé des générations, recherche/filtres, export CSV, suppression |
| `/planning` | `PlanningPage` | Timeline hebdomadaire des emails/documents/questions planifiés avec statut envoi |

---

## 5. API & Services externes

**Aucun appel API externe.** Architecture 100% client-side (SPA + localStorage).

| Service | Usage |
|---------|-------|
| `docxtemplater` + `pizzip` | Rendu templates DOCX avec substitution de variables |
| `exceljs` | Génération fichiers XLSX |
| `pdfmake` | Génération PDF |
| Blob / URL API native | Téléchargement des fichiers générés |
| `.env.local` | Stockage des credentials de login (côté client uniquement) |

> Pas de backend, pas de base de données, pas d'emails réellement envoyés en v1.

---

## 6. Dépendances npm notables

| Package | Version | Rôle |
|---------|---------|------|
| `react` | 18.3.1 | UI library |
| `react-router` | 7.13.0 | Routing SPA |
| `vite` | 6.3.5 | Bundler / dev server |
| `typescript` | — | Typage statique |
| `tailwindcss` | 4.1.12 | Styling utilitaire |
| `@radix-ui/*` | 40+ packages | Composants accessibles (base shadcn/ui) |
| `framer-motion` | 12.34.2 | Animations |
| `lucide-react` | 0.487.0 | Icônes |
| `sonner` | 2.0.3 | Notifications toast |
| `recharts` | 2.15.2 | Graphiques |
| `react-hook-form` | 7.55.0 | Gestion formulaires |
| `docxtemplater` | 3.68.2 | Moteur templates Word |
| `exceljs` | 4.4.0 | Génération Excel |
| `pdfmake` | 0.3.4 | Génération PDF |
| `pizzip` | 3.2.0 | Manipulation ZIP (DOCX = ZIP) |
| `@mui/material` | 7.3.5 | Composants Material UI (usage ponctuel) |
| `date-fns` | 3.6.0 | Formatage de dates |

---

## Observations clés

- **Pas de backend** : toute la donnée vit dans le navigateur. Risque de perte si localStorage vidé.
- **Auth factice** : login via variables `.env.local` côté client — pas de vrai système d'auth.
- **Migration de schéma** : clé `docgen_version` indique un mécanisme de migration prévu.
- **Emails non envoyés** : le planning programme des envois mais aucun service d'envoi n'est branché.
- **MUI + shadcn/ui** : deux systèmes de composants coexistent (risque de dette UI).
- **Export JSON** : `settingsExport.ts` permet de sauvegarder/restaurer la config complète.
