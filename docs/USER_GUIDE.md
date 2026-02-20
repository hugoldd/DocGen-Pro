# Guide utilisateur — DocGen Pro

## 1. Présentation de l’outil
DocGen Pro permet de **générer automatiquement des documents et emails** à partir de templates et d’informations client. L’outil centralise la configuration (variables, templates, types de projets) et propose un assistant en 5 étapes pour produire des fichiers en quelques minutes.

**Formats pris en charge :**
- DOCX
- XLSX
- PDF
- EMAIL (HTML)

## 2. Navigation
- **Tableau de bord** : vue d’ensemble des statistiques et accès rapide.
- **Templates** : création, gestion et aperçu des modèles de documents/emails.
- **Configuration** : paramétrage des types de projets (options, questions, règles).
- **Variables** : dictionnaire des variables utilisables dans les templates.
- **Workflow** : assistant de prise en charge client et génération.
- **Historique** : suivi des générations passées, export CSV, regénération.
- **Paramètres** : zone réservée (placeholder).

## 3. Paramétrage initial (à faire une fois)

### 3.1 Dictionnaire de variables
Les variables sont des **balises** insérées dans les templates, par exemple `{{nom_client}}`. Elles sont remplacées automatiquement lors de la génération.

**Variables système (non supprimables)** :
- `nom_client`
- `numero_client`
- `contact_name`
- `contact_email`
- `type_projet`

**Ajouter une variable**
1. Ouvrez la page **Variables**.
2. Saisissez une **clé** (ex: `date_debut`) et un **libellé** (ex: `Date de début`).
3. Cliquez sur **Ajouter**.

### 3.2 Bibliothèque de templates
Un template contient du texte et des variables.

**Créer un template**
1. Allez dans **Templates** → **+ Nouveau template**.
2. Renseignez :
   - Nom : `Contrat de prestation`
   - Type : `DOCX`
   - Type de projet associé : par exemple `Produit A — Premium`
   - Contenu :
```
Contrat de prestation
Client : {{nom_client}}
Projet : {{type_projet}}
```
3. Cliquez sur **Aperçu** pour vérifier le rendu.
4. Cliquez sur **Enregistrer**.

### 3.3 Configuration des types de projets
Un type de projet décrit **comment et quand** générer des documents.

**Étapes recommandées**
1. **Identité**
   - Nom : `Produit A — Premium`
   - Code : `PROD_A_PREM`
   - Description, tags
2. **Options**
   - Ex: `Assurance annulation`, `Support 24/7`
3. **Questions prérequis**
   - Exemple : “Avez-vous besoin de l’assurance annulation ?”
   - Condition : “Afficher si l’option Assurance est cochée”
4. **Règles de documents**
   - Template : `Contrat cadre v2`
   - Pattern : `{{nom_client}}_{{type_projet}}_contrat`
   - Destination : `/Projets/2026/Contrats`
5. **Règles d’emails**
   - Template email
   - Destinataire : `{{contact_email}}`

**Simulation**
Utilisez **Simuler** pour visualiser les questions et documents déclenchés selon les options sélectionnées.

**Publication**
Cliquez sur **Publier** pour rendre le type disponible dans le workflow.

## 4. Utilisation au quotidien — Prise en charge client

L’assistant **Workflow** guide la génération en 5 étapes.

### Étape 1 — Informations client
- Renseignez : nom client, numéro client.
- Ajoutez un ou plusieurs interlocuteurs.

*Exemple visuel* : formulaire avec deux champs en haut, puis cartes “Interlocuteur”.

### Étape 2 — Type de projet
- Sélectionnez un type publié (ex: `Produit A — Premium`).
- Cochez les options nécessaires.

*Exemple visuel* : tuiles de sélection + checklist d’options.

### Étape 3 — Questions prérequis
- Répondez aux questions affichées.

*Exemple visuel* : formulaire dynamique, champs texte/choix.

### Étape 4 — Récapitulatif
- Vérifiez les infos client/projet.
- Ajustez les chemins de destination si besoin.

*Exemple visuel* : tableau “Documents à générer”.

### Étape 5 — Terminé
- Téléchargez chaque document généré.

*Exemple visuel* : liste des fichiers avec bouton “Télécharger”.

## 5. Historique
- Accédez à l’historique depuis le menu.
- Filtrez par client, type de projet ou statut.
- **Voir le détail** : affiche les fichiers générés.
- **Regénérer** : réouvre le workflow prérempli.
- **Exporter CSV** : exporte la liste filtrée (compatible Excel).

## 6. Bonnes pratiques de paramétrage
- Nommez les templates de façon claire (ex: `Contrat cadre v2`).
- Utilisez des codes projet lisibles (`PROD_A_PREM`, `CONSULT_STD`).
- Respectez une convention de pattern : `{{nom_client}}_{{type_projet}}_document`.
- Toujours **simuler** avant de publier.
- Ordre recommandé : **variables → templates → types de projets**.

## 7. Cas d’usage complet — exemple fil rouge

### Objectif
Créer un type de projet **“Formation — Intra-entreprise”** et générer un dossier pour **Groupe Martin**.

### Étapes
1. **Variables**
   - Ajouter `date_formation` → “Date de formation”.
2. **Templates**
   - Créer un DOCX “Contrat formation” avec `{{nom_client}}`, `{{date_formation}}`.
3. **Type de projet**
   - Nom : `Formation — Intra-entreprise`
   - Code : `FORMA_INTRA`
   - Question : “Date de formation ?” (obligatoire)
   - Règle doc : Template “Contrat formation”, pattern `{{nom_client}}_Contrat_Formation`
4. **Simulation**
   - Vérifier la question et la règle déclenchées.
5. **Publication**
   - Publier le type de projet.
6. **Workflow**
   - Client : `Groupe Martin`
   - Numéro : `C-2026-101`
   - Réponse : `12/03/2026`
   - Générer et télécharger le contrat.
```
