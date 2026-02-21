# Règles de travail — Workflow IA & Dev

## Outils

| Outil | Rôle |
|-------|------|
| **Claude** (ce chat) | Product owner / tech lead : specs, règles de gestion, review de code, validation |
| **Claude Code** | Développement principal, lecture et modification directe des fichiers du repo |
| **Codex** | Développement en complément si besoin, sur instruction de Claude |
| **GitHub** | Versionning et déploiement, branche unique `main` |

---

## Workflow standard

```
1. CLARIFICATION
   Claude pose les questions fonctionnelles avant tout dev
   Zéro ambiguïté avant d'écrire le prompt

2. PROMPT
   Claude rédige le prompt précis pour Claude Code ou Codex
   Découpage en sous-tâches si la feature est complexe

3. DEV
   Claude Code exécute sur les fichiers réels du repo
   Retour synthétique en 3 lignes max + fichiers modifiés

4. REVIEW
   Claude reçoit le code produit
   Valide ou demande une correction ciblée

5. VALIDATION
   Test fonctionnel par l'utilisateur
   Si OK → on passe à la feature suivante
   Si KO → correction ciblée, pas de réécriture complète
```

---

## Règles de gestion du code

- **Une seule branche** : `main` — pas de branche de feature, pas de branche de dev
- **Commits atomiques** : un commit = une feature ou une correction
- **Pas de réécriture** de ce qui fonctionne — on touche uniquement ce qui est demandé
- **Toujours lire avant d'écrire** : Claude Code lit les fichiers existants avant de modifier
- **Pas d'hallucination** : si un fichier ou une fonction est inconnu, Claude Code le lit d'abord
- **Contraintes explicites** dans chaque prompt : fichiers autorisés à modifier, fichiers interdits
- **Review obligatoire** : aucun code n'est intégré sans validation de Claude

---

## Déploiement

- **Hébergement** : GitHub Pages (phase de test)
- **CI/CD** : GitHub Actions déclenché sur push `main`
- **Build** : `npm run build` → `dist/` → déployé automatiquement
- **Variables sensibles** : dans GitHub Secrets, jamais dans le code

### Commande de déploiement

```bash
git add .
git commit -m "feat: description de la feature"
git push origin main
```

---

## Workflow de l'application

### 1. Dictionnaire de variables (`/variables`)
Définir toutes les balises dynamiques utilisées dans l'application.
- Variables système (non supprimables) : `nom_client`, `numero_client`, `type_projet`, `contact_1_*` à `contact_3_*`
- Variables personnalisées : ajout/modification/suppression avec détection de doublons
- Utilisées dans les templates avec la syntaxe `{{clé}}`

### 2. Bibliothèque de templates (`/templates`)
Créer les modèles de documents et d'emails.
- Types : DOCX, XLSX, PDF, EMAIL
- Éditeur avec panneau balises (bouton "Balises" → insertion au curseur)
- Import de fichier base64 pour DOCX/XLSX/PDF existants

### 3. Paramétrage projet (`/configuration`)
Wizard 7 étapes en page dédiée :
1. **Identité** : nom, code, description, tags, statut
2. **Options** : options cochables lors de la prise en charge (ex: assurance, support 24/7)
3. **Questions prérequis** : questions posées lors du wizard, avec condition d'affichage par option
4. **Règles documents** : quel template générer, chemin destination, condition d'activation
5. **Règles emails** : quel template EMAIL, condition d'activation
6. **Planning** : J-X avant déploiement, J+X après, "Générer lors de la prise en charge", "Rappel utilisateur"
7. **Simulation** : aperçu planning chronologique + règles activées selon options cochées

### 4. Prise en charge client (`/workflow`)
Wizard 6 étapes pour l'opérateur :
1. **Informations client** : nom, numéro, interlocuteurs (jusqu'à 3 contacts)
2. **Type de projet** : sélection + options + date de déploiement
3. **Questions prérequis** : réponses aux questions configurées
4. **Récapitulatif** : liste des documents à générer
5. **Planning** : aperçu chronologique (emails + documents + questions planifiés)
6. **Confirmation** : téléchargement des fichiers générés

Le panneau "Balises" (bouton en haut à droite) affiche toutes les balises disponibles avec leurs valeurs résolues en temps réel.

### 5. Planning (`/planning`)
Vue consolidée de tous les éléments planifiés :
- Emails, documents et questions planifiés
- Filtres : période (7j / 30j / 90j), client
- Toggle "Voir les envoyés"
- Marquage individuel ou en masse

### 6. Historique (`/history`)
- Liste de toutes les générations avec statut
- Re-téléchargement des fichiers générés
- Mode suppression : Shift+Alt+H

---

## À venir — Phase 1 (PocketBase)

- Remplacement du localStorage par PocketBase (auto-hébergé)
- Migration clients et contacts
- Auth PocketBase en remplacement du login hardcodé
- VPS Hetzner pour la mise en production