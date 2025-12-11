
# 🏛️ Tinmel - LMS Open Source Marocain 🇲🇦

![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Status](https://img.shields.io/badge/Status-Beta-yellow)

> **Tinmel** (تينمل) est une plateforme de gestion de l'apprentissage (LMS) nouvelle génération, conçue pour les écoles. Elle intègre l'Intelligence Artificielle pour automatiser la création de contenu pédagogique et la correction.

🌐 **Site du Projet :** [Découvrir le projet](https://sites.google.com/view/tinmel-project/home)

## 📖 Pourquoi Tinmel ?
Le nom **"Tinmel"** puise son inspiration dans le berceau historique de la dynastie Almohade. Tout comme la **Mosquée de Tinmel** fut un centre de savoir, cette plateforme aspire à devenir un pilier numérique souverain pour l'éducation moderne.

Ce projet est une réponse "Proof of Concept" (PoC) pour démontrer qu'un LMS puissant, intégrant l'IA générative, peut être construit avec des technologies web modernes et légères.

## ✨ Fonctionnalités Clés

### 🧠 Intelligence Artificielle (Gemini 2.5)
*   **Génération de Quiz Avancée :** Création automatique de tout genre de quiz à partir d'un simple sujet (QCM, Vrai/Faux, Questions ouvertes, Appariement, QCM Image).
*   **Correction Assistée :** Analyse sémantique des réponses courtes et des essais par l'IA pour un gain de temps précieux.

### 🏫 Gestion Scolaire
*   **Architecture Multi-Niveaux :**
    *   🛡️ **Admin :** Gestion globale, facturation, déploiement.
    *   👔 **Coordinateur :** Gestion des emplois du temps, des classes et du corps professoral.
    *   🎓 **Professeur :** Création de cours, quiz, suivi des résultats.
    *   🎒 **Élève :** Interface gamifiée (XP, Badges), passage de quiz, messagerie.

### 🛡️ Sécurité & Confidentialité
*   **Séparation des Portails :** Accès Admin (`/tinmelad`) isolé de l'accès public.
*   **Détection de Décrochage :** Algorithme identifiant les élèves à risque (absentéisme + baisse de résultats).

## 🛠️ Stack Technique

*   **Frontend :** React 18, TypeScript, Tailwind CSS, Lucide Icons.
*   **Build Tool :** Vite.
*   **Backend (Hybride) :** 
    *   *Mode Démo :* `LocalStorage` pour une persistance immédiate sans serveur.
    *   *Mode Prod :* Node.js (Express) + SQLite (Migration en cours vers PostgreSQL).
*   **AI :** Google Generative AI SDK (`@google/genai`).

## 🚀 Installation (Développeur)

### Prérequis
*   Node.js (v18+)
*   Une clé API Google Gemini (Gratuite sur [Google AI Studio](https://aistudio.google.com/))

### Démarrage Rapide (Mode Développement)
Utilisez cette commande pour coder. Le serveur redémarre à chaque modification.

```bash
# 1. Cloner le dépôt
git clone https://github.com/LahcenOub/tinmel-lms.git
cd tinmel-lms

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
# Créez un fichier .env à la racine et ajoutez :
# REACT_APP_GEMINI_API_KEY=votre_cle_api

# 4. Lancer (Frontend + Backend en parallèle)
npm run dev
```

Ouvrez **http://localhost:3000**.
*   **Admin par défaut :** `admin` / `password123`

### Tester le Build de Production
Pour simuler l'environnement de production (fichiers minifiés servis par Express) :

```bash
# 1. Compiler le React (crée le dossier /dist)
npm run build

# 2. Lancer le serveur Node uniquement
npm start
```
L'application sera accessible sur **http://localhost:3001**.

## 🤝 Contribution & Hacktoberfest

Nous cherchons activement des contributeurs pour passer du prototype à la production !

**Domaines prioritaires :**
1.  **Backend :** Sécurisation complète de l'API Node.js et JWT HttpOnly.
2.  **Performance :** Implémentation de la pagination serveur et virtualisation des listes.
3.  **Features :** Support de la langue Amazigh (Tifinagh).

Consultez le [ROADMAP.md](./ROADMAP.md) pour voir les tâches disponibles.

## 📄 Licence

Distribué sous la licence **MIT**. Voir `LICENSE` pour plus d'informations.

---
*Construit avec ❤️ au Maroc.*
