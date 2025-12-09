
# 🚀 Guide d'Installation de Tinmel (Édition Développeur)

Merci de contribuer à **Tinmel**, le premier LMS Open Source 100% Marocain assisté par Intelligence Artificielle.

Ce guide vous explique comment installer l'environnement de développement complet (Frontend + Backend) sur votre machine locale.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :
1.  **Node.js** (v18 ou supérieur) : [Télécharger ici](https://nodejs.org/)
2.  **Git** : [Télécharger ici](https://git-scm.com/)
3.  Une clé API **Google Gemini** (Gratuite) : [Obtenir une clé](https://aistudio.google.com/)

## 🛠️ Installation

### 1. Cloner le dépôt
Ouvrez votre terminal (PowerShell, CMD ou Terminal) :
```bash
git clone https://github.com/LahcenOub/tinmel-lms.git
cd tinmel-lms
```

### 2. Installer les dépendances
Nous utilisons `npm` pour gérer les paquets Frontend (React) et Backend (Express).
```bash
npm install
```
*(Cela peut prendre quelques minutes)*

### 3. Configurer les Variables d'Environnement
Créez un fichier nommé `.env` à la racine du projet et ajoutez-y votre clé IA :
```env
REACT_APP_GEMINI_API_KEY=votre_clé_api_ici_commencant_par_AIza
```

## ▶️ Lancement

Pour démarrer l'application, nous utilisons une seule commande qui lance à la fois :
*   Le serveur Backend (API & Base de données) sur le port 3001.
*   Le serveur Frontend (Interface React) sur le port 3000.

```bash
npm run dev
```

Une fois lancé :
1.  Ouvrez votre navigateur sur **http://localhost:3000**
2.  Le fichier `database.sqlite` sera créé automatiquement à la racine.
3.  Connectez-vous avec le compte Admin par défaut :
    *   **Identifiant :** `admin`
    *   **Mot de passe :** `password123`

## 📂 Structure du Projet

*   `/src` : Code source React (Frontend)
    *   `/components` : Composants UI (Tableaux de bord, Quiz...)
    *   `/services` : Logique métier (`geminiService`, `storageService`, `apiService`)
*   `server.js` : Point d'entrée du Backend (API Express + SQLite)
*   `database.sqlite` : Base de données locale (créée au lancement)

## 🤝 Comment Contribuer ?

Nous avons besoin de vous pour :
1.  Migrer les fonctionnalités du `localStorage` vers la base de données SQL.
2.  Améliorer l'interface utilisateur.
3.  Traduire l'application en Amazigh.
4.  Ajouter de nouvelles fonctionnalités pédagogiques.

**Forkez le projet, codez, et envoyez une Pull Request !**
