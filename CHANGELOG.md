# Changelog

## [V2] - 2026-02-20

### Ajouté
- Login simple hardcodé (credentials dans .env.local)
- Export JSON par type de projet (bouton Exporter sur chaque ligne)
- Re-téléchargement des fichiers depuis le détail de l'historique
- Filtre client dans le planning
- Toggle "Voir les envoyés" dans le planning
- Recherche globale étendue aux interlocuteurs (contact name/email/role)
- Mode suppression historique via raccourci Shift+Alt+H

### Modifié
- Planning : tri par client puis par date, réalignement UI header
- Historique : loader de re-téléchargement par index de fichier

### Supprimé
- Page Paramètres (trop dangereuse, réinitialisation des données retirée)

### En attente — V3
- Feature 5 : insertion de variable depuis le dictionnaire directement 
  dans un template ou dans le questionnaire de prise en charge
  (complexité UI plus élevée, reporté volontairement)
## V1.0.0 â€” FÃ©vrier 2026

### FonctionnalitÃ©s
- Dashboard avec stats cliquables, activitÃ© rÃ©cente, notifications et compteur emails mensuels
- Gestion des types de projets : modal plein Ã©cran avec sections IdentitÃ©/Questions/RÃ¨gles/Planning, conditions sur rÃ¨gles, simulation
- Templates DOCX/XLSX/PDF/EMAIL avec Ã©diteur de variables et doubles accolades
- Workflow de prise en charge en 6 Ã©tapes avec gÃ©nÃ©ration de fichiers
- GÃ©nÃ©ration DOCX (docxtemplater), PDF (pdfmake lazy-loaded), EMAIL (.eml Outlook)
- Planning multi-types (emails/documents/questions) avec badges colorÃ©s, filtres pÃ©riode, Ã©tat envoyÃ© persistÃ©
- Historique complet avec filtres, recherche et ouverture directe depuis le dashboard
- BibliothÃ¨que de variables avec doubles accolades cohÃ©rentes
- Recherche globale dans le header (historique, templates, types de projets, planning)
- Notifications dans la cloche (emails imminents, erreurs de gÃ©nÃ©ration)
- Lazy loading pdfmake (-2MB sur le bundle initial)
- Avatar avec initiales, prÃªt pour connexion auth future

### Corrections
- Encodage UTF-8 corrigÃ© (routes.tsx)
- DÃ©limiteurs docxtemplater alignÃ©s sur doubles accolades
- Download refactorisÃ© sans DOM scraping
- Alignement header/sidebar corrigÃ©
- sentEmailIds transmis dans l'historique
- buildGenerationPlan inclut dÃ©sormais les emailRules
- Extension .eml avec MIME message/rfc822

