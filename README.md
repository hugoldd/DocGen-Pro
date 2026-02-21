# DocGen Pro

Application web de gestion et génération automatisée de documents contractuels, emails et plannings, conçue pour les équipes commerciales et opérationnelles.

🚀 **[Accéder à l'application](https://hugoldd.github.io/DocGen-Pro/)**

---

## Stack technique

| Couche | Technologies |
|---|---|
| Framework | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 6](https://vitejs.dev/) |
| Styles | [TailwindCSS 4](https://tailwindcss.com/) |
| Composants UI | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Routing | [React Router 7](https://reactrouter.com/) |
| Génération DOCX | [docxtemplater](https://docxtemplater.com/) + [PizZip](https://github.com/open-xml-templating/pizzip) |
| Génération PDF | [pdfmake](http://pdfmake.org/) (lazy-loaded) |
| Génération XLSX | [ExcelJS](https://github.com/exceljs/exceljs) |
| Icônes | [Lucide React](https://lucide.dev/) |
| Persistance | localStorage (clé versionnée `docgen_version`) |

---

## Fonctionnalités principales

### Login / Accès
- Accès protégé par login via PocketBase auth (ou hardcodé via `.env.local` en dev)

### Types de projets
- Création et édition via un **wizard 7 étapes** en page dédiée :
  - Identité, Options, Questions prérequis, Règles documents, Règles emails, Planning, Simulation
- Options configurables par projet (ex. : assurance, support 24/7)
- Conditions sur les règles et questions : déclenchement selon les options sélectionnées
- Planning : règles J-X / J+X / "Générer lors de la prise en charge" / "Rappel utilisateur"
- Étape Simulation : aperçu planning chronologique + règles activées selon options cochées
- Publication / brouillon avec badge de statut

### Templates
- Types supportés : **DOCX**, **XLSX**, **PDF**, **EMAIL**
- Éditeur avec panneau balises (bouton toggle) et insertion au curseur
- Import de fichier base64 (DOCX/XLSX/PDF existants)
- Duplication et gestion du statut (brouillon / publié)

### Workflow de génération
- Prise en charge en 6 étapes guidées : informations client, type de projet, questions, récapitulatif, planning, confirmation
- Panneau balises disponibles avec valeurs résolues en temps réel
- Génération DOCX via docxtemplater, PDF via pdfmake, EMAIL au format `.eml` (MIME `message/rfc822`)
- Les emailRules sont incluses dans le plan de génération au même titre que les documentRules
- Noms de fichiers générés automatiquement : `{nom_client} - {nom_template}`

### Planning
- Planning multi-types : **emails**, **documents**, **questions**
- Vue calendaire avec badges colorés et filtres par période (7j / 30j / 90j)
- Filtre client sur les éléments planifiés
- Toggle "Voir les envoyés" pour inclure/exclure les entrées déjà envoyées
- État "envoyé" persisté par entrée dans l'historique
- Marquage / démarquage individuel ou en masse
- Éléments "Générer lors de la prise en charge" visibles dans le planning

### Dashboard
- Statistiques cliquables (projets actifs, templates publiés, générations du mois, emails planifiés)
- Activité récente avec accès direct aux enregistrements
- Cloche de notifications : emails, documents et questions imminents (7 jours)
- Compteur d'emails du mois courant

### Historique
- Liste complète des générations avec statut (succès / erreur)
- Recherche et filtres avancés
- Accès direct depuis le dashboard
- Re-téléchargement des fichiers générés depuis le détail
- Mode suppression via raccourci Shift+Alt+H

### Recherche globale
- Barre de recherche dans le header couvrant : historique, templates, types de projets, planning
- Interlocuteurs inclus dans les résultats (nom / email / rôle)

### Bibliothèque de variables
- Gestion centralisée des variables `{{clé}}` utilisées dans les templates
- Variables système non supprimables : client, interlocuteurs (contact_1/2/3), projet
- Barre de recherche, tri alphabétique, compteur
- Détection de doublons à la création
- Ajout / modification / suppression avec validation

---

## Installation et lancement

### Prérequis
- Node.js >= 18
- npm >= 9

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:5173/DocGen-Pro/`.

### Build de production

```bash
npm run build
```

Les fichiers compilés sont générés dans le dossier `dist/`.

### Déploiement GitHub Pages

```bash
git add .
git commit -m "feat: description"
git push origin main
```

GitHub Actions déclenche automatiquement le build et le déploiement sur `gh-pages`.

---

## Structure du projet

```
src/
├── app/
│   ├── components/       # Composants réutilisables (PlanningView, VariablePickerButton…)
│   ├── context/          # AppContext — état global + localStorage
│   ├── hooks/            # useInsertAtCursor
│   ├── layout/           # DashboardLayout (sidebar + header + notifications)
│   ├── pages/            # Dashboard, Templates, Config, History, Planning, Workflow
│   │   └── config/       # ProjectConfig + ProjectWizard (wizard 7 étapes)
│   ├── types/            # Types TypeScript (Template, ProjectType, GenerationRecord…)
│   └── utils/            # engine.ts (logique métier), fileGenerator.ts (génération fichiers)
├── lib/                  # Utilitaires (cn / twMerge)
└── styles/               # CSS global, Tailwind, thème
```

---

⚠️ Ne pas commiter `.env.local` — contient les credentials d'accès

## Licence

Projet privé — tous droits réservés.