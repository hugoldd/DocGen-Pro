# Changelog

## V1.0.0 — Février 2026

### Fonctionnalités
- Dashboard avec stats cliquables, activité récente, notifications et compteur emails mensuels
- Gestion des types de projets : modal plein écran avec sections Identité/Questions/Règles/Planning, conditions sur règles, simulation
- Templates DOCX/XLSX/PDF/EMAIL avec éditeur de variables et doubles accolades
- Workflow de prise en charge en 6 étapes avec génération de fichiers
- Génération DOCX (docxtemplater), PDF (pdfmake lazy-loaded), EMAIL (.eml Outlook)
- Planning multi-types (emails/documents/questions) avec badges colorés, filtres période, état envoyé persisté
- Historique complet avec filtres, recherche et ouverture directe depuis le dashboard
- Bibliothèque de variables avec doubles accolades cohérentes
- Recherche globale dans le header (historique, templates, types de projets, planning)
- Notifications dans la cloche (emails imminents, erreurs de génération)
- Lazy loading pdfmake (-2MB sur le bundle initial)
- Avatar avec initiales, prêt pour connexion auth future

### Corrections
- Encodage UTF-8 corrigé (routes.tsx)
- Délimiteurs docxtemplater alignés sur doubles accolades
- Download refactorisé sans DOM scraping
- Alignement header/sidebar corrigé
- sentEmailIds transmis dans l'historique
- buildGenerationPlan inclut désormais les emailRules
- Extension .eml avec MIME message/rfc822
