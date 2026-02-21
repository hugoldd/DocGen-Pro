# Changelog

## \[V2] - 2026-02-20

### Ajouté

* Login simple hardcodé (credentials dans .env.local)
* Export JSON par type de projet (bouton Exporter sur chaque ligne)
* Re-téléchargement des fichiers depuis le détail de l'historique
* Filtre client dans le planning
* Toggle "Voir les envoyés" dans le planning
* Recherche globale étendue aux interlocuteurs (contact name/email/role)
* Mode suppression historique via raccourci Shift+Alt+H

### Modifié

* Planning : tri par client puis par date, réalignement UI header
* Historique : loader de re-téléchargement par index de fichier

### Supprimé

* Page Paramètres (trop dangereuse, réinitialisation des données retirée)

### En attente — V3

* Feature 5 : insertion de variable depuis le dictionnaire directement
  dans un template ou dans le questionnaire de prise en charge
  (complexité UI plus élevée, reporté volontairement)

## V1.0.0 â€” FÃ©vrier 2026

### FonctionnalitÃ©s

* Dashboard avec stats cliquables, activitÃ© rÃ©cente, notifications et compteur emails mensuels
* Gestion des types de projets : modal plein Ã©cran avec sections IdentitÃ©/Questions/RÃ¨gles/Planning, conditions sur rÃ¨gles, simulation
* Templates DOCX/XLSX/PDF/EMAIL avec Ã©diteur de variables et doubles accolades
* Workflow de prise en charge en 6 Ã©tapes avec gÃ©nÃ©ration de fichiers
* GÃ©nÃ©ration DOCX (docxtemplater), PDF (pdfmake lazy-loaded), EMAIL (.eml Outlook)
* Planning multi-types (emails/documents/questions) avec badges colorÃ©s, filtres pÃ©riode, Ã©tat envoyÃ© persistÃ©
* Historique complet avec filtres, recherche et ouverture directe depuis le dashboard
* BibliothÃ¨que de variables avec doubles accolades cohÃ©rentes
* Recherche globale dans le header (historique, templates, types de projets, planning)
* Notifications dans la cloche (emails imminents, erreurs de gÃ©nÃ©ration)
* Lazy loading pdfmake (-2MB sur le bundle initial)
* Avatar avec initiales, prÃªt pour connexion auth future

### Corrections

* Encodage UTF-8 corrigÃ© (routes.tsx)
* DÃ©limiteurs docxtemplater alignÃ©s sur doubles accolades
* Download refactorisÃ© sans DOM scraping
* Alignement header/sidebar corrigÃ©
* sentEmailIds transmis dans l'historique
* buildGenerationPlan inclut dÃ©sormais les emailRules
* Extension .eml avec MIME message/rfc822



  # Changelog
* 
* \## \[V2.1] - 2026-02-21
* 
* \### Ajouté
* \- \*\*Feature 5\*\* — Insertion de variable depuis le dictionnaire au curseur dans l'éditeur de templates
* \- \*\*Panneau balises\*\* dans le wizard de prise en charge client : liste des balises disponibles avec recherche, valeurs résolues en temps réel et copie presse-papier
* \- \*\*Panneau balises\*\* dans l'éditeur de templates : bouton toggle "Balises" avec insertion au curseur
* \- \*\*Bouton balises\*\* dans les règles documents et emails du paramétrage projet (insertion au curseur)
* \- \*\*Balises multi-interlocuteurs\*\* : contact\_1\_nom/email/role/telephone, contact\_2\_\*, contact\_3\_\*
* \- \*\*Wizard paramétrage projet\*\* (7 étapes) en page dédiée remplaçant le Dialog dense :
* &nbsp; - Étape 1 — Identité : nom, code, description, tags, statut
* &nbsp; - Étape 2 — Options : ajout/suppression, label + ID généré automatiquement
* &nbsp; - Étape 3 — Questions prérequis : type, obligatoire, condition d'affichage par option
* &nbsp; - Étape 4 — Règles documents : template, chemin destination, condition activation
* &nbsp; - Étape 5 — Règles emails : template EMAIL, condition activation
* &nbsp; - Étape 6 — Planning : J-X/J+X, "Générer lors de la prise en charge", "Rappel utilisateur"
* &nbsp; - Étape 7 — Simulation : aperçu planning chronologique + règles activées selon options cochées
* \- \*\*Planning wizard prise en charge\*\* : affichage des documents et questions planifiés en plus des emails
* \- \*\*Notifications cloche\*\* : détection des documents et questions planifiés imminents (7 jours)
* \- \*\*generateOnWorkflow\*\* : les éléments cochés "Générer lors de la prise en charge" apparaissent dans le planning avec le libellé "À la prise en charge"
* \- Badge \*\*"Rappel utilisateur"\*\* sur les emails planifiés dans PlanningView
* 
* \### Modifié
* \- Dictionnaire de variables : barre de recherche + tri alphabétique + compteur
* \- Variables système multi-contacts non supprimables, groupées "Interlocuteurs"
* \- Suppression des doublons `contact\_name` / `contact\_email` (remplacés par contact\_1\_\*)
* \- Noms de fichiers générés : format automatique `{nom\_client} - {template.name}` si outputPattern vide
* \- IDs techniques masqués dans options, questions et règles du wizard paramétrage
* \- `hasPlanning` et `requiresDeploymentDate` étendus aux documentSchedule et questionSchedule
* \- Notifications : comparaison par jour entier (évite les faux négatifs au démarrage)
* \- Route racine corrigée (basename `/DocGen-Pro/`)
* \- Bouton "Configuration" inutile supprimé de la page types de projets
* 
* \### Supprimé
* \- Bouton `{ } Variable` dans la toolbar des templates (remplacé par panneau balises)
* \- Champs outputPattern et recipient dans le wizard (générés automatiquement)
* \- Affichage des IDs techniques dans le wizard de prise en charge (options)
* 
* ---
* 
* \## \[V2] - 2026-02-20
* 
* \### Ajouté
* \- Login simple hardcodé (credentials dans .env.local)
* \- Export JSON par type de projet (bouton Exporter sur chaque ligne)
* \- Re-téléchargement des fichiers depuis le détail de l'historique
* \- Filtre client dans le planning
* \- Toggle "Voir les envoyés" dans le planning
* \- Recherche globale étendue aux interlocuteurs (contact name/email/role)
* \- Mode suppression historique via raccourci Shift+Alt+H
* 
* \### Modifié
* \- Planning : tri par client puis par date, réalignement UI header
* \- Historique : loader de re-téléchargement par index de fichier
* 
* \### Supprimé
* \- Page Paramètres (trop dangereuse, réinitialisation des données retirée)
* 
* ---
* 
* \## \[V1.0.0] - Février 2026
* 
* \### Fonctionnalités
* \- Dashboard avec stats cliquables, activité récente, notifications et compteur emails mensuels
* \- Gestion des types de projets : modal plein écran avec sections Identité/Questions/Règles/Planning, conditions sur règles, simulation
* \- Templates DOCX/XLSX/PDF/EMAIL avec éditeur de variables et doubles accolades
* \- Workflow de prise en charge en 6 étapes avec génération de fichiers
* \- Génération DOCX (docxtemplater), PDF (pdfmake lazy-loaded), EMAIL (.eml Outlook)
* \- Planning multi-types (emails/documents/questions) avec badges colorés, filtres période, état envoyé persisté
* \- Historique complet avec filtres, recherche et ouverture directe depuis le dashboard
* \- Bibliothèque de variables avec doubles accolades cohérentes
* \- Recherche globale dans le header (historique, templates, types de projets, planning)
* \- Notifications dans la cloche (emails imminents, erreurs de génération)
* \- Lazy loading pdfmake (-2MB sur le bundle initial)
* \- Avatar avec initiales, prêt pour connexion auth future
* 
* \### Corrections
* \- Encodage UTF-8 corrigé (routes.tsx)
* \- Délimiteurs docxtemplater alignés sur doubles accolades
* \- Download refactorisé sans DOM scraping
* \- Alignement header/sidebar corrigé
* \- sentEmailIds transmis dans l'historique
* \- buildGenerationPlan inclut désormais les emailRules
* \- Extension .eml avec MIME message/rfc822
