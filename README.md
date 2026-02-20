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
- Accès protégé par login hardcodé (configurable via .env.local)

### Types de projets
- Création et édition via une modal plein écran multi-sections (Identité, Questions prérequis, Règles documents & emails, Planning)
- Options configurables par projet (ex. : assurance, support 24/7)
- Conditions sur les règles et questions : déclenchement selon les options sélectionnées
- Bouton **Simuler** : visualisation en temps réel des règles et questions activées selon les options cochées
- Publication / brouillon avec badge de statut

### Templates
- Types supportés : **DOCX**, **XLSX**, **PDF**, **EMAIL**
- Éditeur avec variables `{{variable}}` et autocomplétion
- Import de fichier base64 (DOCX/XLSX/PDF existants)
- Duplication et gestion du statut (brouillon / publié)

### Workflow de génération
- Prise en charge en 6 étapes guidées : sélection du type de projet, options, questions, génération, planning, confirmation
- Génération DOCX via docxtemplater, PDF via pdfmake, EMAIL au format `.eml` (MIME `message/rfc822`)
- Les emailRules sont incluses dans le plan de génération au même titre que les documentRules

### Planning
- Planning multi-types : **emails**, **documents**, **questions**
- Vue calendaire avec badges colorés et filtres par période (7j / 30j / 90j)
- Filtre client sur les éléments planifiés
- Toggle "Voir les envoyés" pour inclure/exclure les entrées déjà envoyées
- État "envoyé" persisté par entrée dans l'historique
- Marquage / démarquage individuel ou en masse

### Dashboard
- Statistiques cliquables (projets actifs, templates publiés, générations du mois, emails planifiés)
- Activité récente avec accès direct aux enregistrements
- Cloche de notifications : emails imminents, erreurs de génération
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

L'application est accessible sur `http://localhost:5173`.

### Build de production

```bash
npm run build
```

Les fichiers compilés sont générés dans le dossier `dist/`.

### Déploiement GitHub Pages

```bash
npm run deploy
```

Publie automatiquement le contenu de `dist/` sur la branche `gh-pages`.

---

## Structure du projet

```
src/
├── app/
│   ├── components/       # Composants réutilisables (UI shadcn, PlanningView…)
│   ├── context/          # AppContext — état global + localStorage
│   ├── layout/           # DashboardLayout (sidebar + header)
│   ├── pages/            # Pages : Dashboard, Templates, Config, History, Planning, Workflow
│   ├── types/            # Types TypeScript (Template, ProjectType, GenerationRecord…)
│   └── utils/            # engine.ts (logique métier), fileGenerator.ts (génération fichiers)
├── lib/                  # Utilitaires (cn / twMerge)
└── styles/               # CSS global, Tailwind, thème
```

---

⚠️ Ne pas commiter .env.local — contient les credentials d'accès

## Licence

Projet privé — tous droits réservés.
