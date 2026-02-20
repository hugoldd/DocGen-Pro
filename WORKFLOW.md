# Documentation du Workflow DocGen Pro

Cette application permet de configurer des projets, de définir des templates et d'exécuter des processus de génération de documents.

## 1. Gestion des Données (Configuration Initiale)

Avant de configurer un projet, il est nécessaire de définir les briques de base :

### A. Dictionnaire de Variables (`/variables`)
*   **Objectif** : Définir toutes les données dynamiques qui seront utilisées dans l'application.
*   **Fonctionnement** : 
    *   Créez une variable (ex: `client_name`, `montant_projet`).
    *   Définissez son type (Texte, Nombre, Date, etc.).
    *   **Lien** : Ces variables sont ensuite utilisées dans l'**Éditeur de Template** et les **Questions du Projet**.

### B. Bibliothèque de Templates (`/templates`)
*   **Objectif** : Créer les modèles de documents et d'emails.
*   **Fonctionnement** :
    *   Créez un template (Document ou Email).
    *   Utilisez l'éditeur pour insérer du texte et des variables dynamiques (ex: `{{client_name}}`).
    *   Les variables disponibles proviennent du **Dictionnaire de Variables**.

## 2. Configuration de Projet (`/configuration`)

C'est le cœur du module administratif. Un projet relie des questions, des options et des templates.

### Workflow de configuration :
1.  **Identité** : Définissez le nom, le code et la catégorie du projet.
2.  **Options** : Ajoutez des options commerciales (ex: "Assurance", "Support 24/7").
3.  **Questions Prérequis** : 
    *   Définissez les questions à poser à l'utilisateur lors de l'exécution.
    *   **Lien critique** : Associez chaque question à une **Variable** (ex: la réponse à "Quel est le nom du client ?" remplit la variable `client_name`).
4.  **Règles de Documents / Emails** :
    *   Définissez quel template générer et quand.
    *   **Condition** : Utilisez des expressions simples (ex: `opt_assurance == true` ou `ALWAYS`).
    *   **Template** : Sélectionnez un template existant de la bibliothèque.
    *   **Nom de sortie** : Paramétrez le nom du fichier généré (supporte les variables, ex: `{{client_name}}_Contrat.pdf`).

## 3. Exécution (Prise en Charge Client) (`/workflow`)

*(Module d'exécution pour les opérateurs)*

1.  **Sélection** : L'utilisateur choisit un type de projet configuré.
2.  **Saisie** : L'utilisateur répond aux questions définies dans la configuration (Questions prérequis).
3.  **Options** : L'utilisateur sélectionne les options actives.
4.  **Génération** : Le moteur évalue les règles :
    *   Il remplace les variables dans les templates par les réponses saisies.
    *   Il respecte les conditions (génère ou non le document).
    *   Il produit les fichiers finaux.

## État des Liens

*   [x] Tableau de bord (`/`) -> Vue d'ensemble (Mock)
*   [x] Bibliothèque de Templates (`/templates`) -> Liste et Éditeur
*   [x] Configuration (`/configuration`) -> Liste des projets et Éditeur complet
*   [x] Dictionnaire de Variables (`/variables`) -> Gestion CRUD des variables
*   [x] Prise en charge (`/workflow`) -> Simulation du parcours (Données mockées pour l'instant)
*   [ ] Paramètres (`/settings`) -> (placeholder en attente de lien)
*   [ ] Historique (`/history`) -> (Visualisation statique)
