
# 🗺️ Roadmap Technique - Tinmel LMS

Ce document trace la route entre le **MVP Robuste** actuel et une version de **Production Enterprise**.

## 🟢 Statut Actuel : MVP Robuste (8/10)
L'architecture de base est solide (Abstraction DB, Sécurité, Environnements), mais il reste une dette technique liée à la persistance hybride (LocalStorage/API).

---

## ✨ Fonctionnalités Récemment Ajoutées (Q1 2025)

- [x] **Intégration LoRaWAN (Off-grid)** : Architecture backend (MQTT, Webhooks), configuration des scénarios (Interne/Externe), et payload configurator scriptable en JS pour l'ingestion des réponses de quiz via réseaux radio.
- [x] **Modules Interactifs** : Quiz de validation intégrés à la fin des leçons (timers, score minimum).
- [x] **Planification** : Programmation de la disponibilité des cours (Date de début / fin).
- [x] **Monitoring** : Compteur d'élèves en direct sur les cours (Heartbeat system).
- [x] **Suivi** : Marquage automatique des leçons comme "Terminées" dans le tableau de bord étudiant.
- [x] **Support Multimédia** : Intégration complète de la Vidéo (Upload MP4 & YouTube).

## 🔴 Priorité Haute : Architecture & Stabilité (Q2 2025)

L'objectif est d'éliminer la "Double Source de Vérité" et de finaliser la sécurité.

- [x] **Sécurité & Backend (Hardening)**
    - [x] Audit de sécurité des dépendances (`npm audit`).
    - [x] Mise en place de `Helmet` et `Rate Limiting` sur Express.
    - [x] Authentification via **Cookies HttpOnly** (remplacement du localStorage).
    - [x] Hashage des mots de passe (Bcrypt) côté serveur.
    - [x] Gestion des uploads de fichiers via `Multer` (Fin du Base64 en BDD).

- [ ] **Unification des Données (Dette Technique Critique)** 🚨
    - [ ] **Migration Totale vers SQL** : Supprimer le stockage `localStorage` pour les Quiz, Leçons, Messages et Événements. Tout doit passer par l'API.
    - [ ] Centraliser la logique métier dans les Services Backend (ne plus calculer les scores côté client uniquement).

- [ ] **Refactoring Frontend**
    - [ ] Découper les "God Components" (`ProfessorDashboard.tsx`, `StudentDashboard.tsx`) en sous-composants atomiques.
    - [ ] Standardiser les appels API via un custom hook ou React Query.

## 🟡 Priorité Moyenne : Scalabilité & Cloud (Q3 2025)

Préparer l'application pour le déploiement réel (Docker/Cloud).

- [ ] **Stockage & Persistance**
    - [ ] Adapter l'upload de fichiers pour le Cloud (AWS S3 ou Cloudinary) au lieu du disque local.
    - [ ] Migrer `SQLite` vers `PostgreSQL` pour la production (via l'abstraction `db.js`).

- [ ] **Optimisation des Performances**
    - [x] Pagination coté serveur pour les utilisateurs.
    - [ ] Mettre en place `TanStack Query` (React Query) pour le cache et la gestion des états serveur.

- [ ] **Temps Réel (WebSockets)**
    - [ ] Remplacer le "polling" actuel (Heartbeat toutes les 10s) par `Socket.io`.
    - [ ] Chat en direct et Notifications instantanées réelles.

## 🟢 Priorité Basse : Fonctionnalités & UX (Q4 2025)

- [ ] **Offline First (PWA)**
    - [ ] Rendre l'application installable sur mobile.
    - [ ] Mode hors-ligne pour les zones à faible connectivité.

- [ ] **Localisation & Accessibilité**
    - [ ] Traduction complète en **Amazigh (Tifinagh)**.
    - [ ] Support complet des lecteurs d'écran (ARIA).

## 💡 Idées Communautaires (Backlog)

*   *Ajout d'un rôle "Parent" pour le suivi des notes.*
*   *Intégration de Jitsi Meet pour les classes virtuelles.*
*   *Export des bulletins de notes au format PDF officiel.*

---
**Envie de contribuer ?**
Attaquez-vous à la **Migration Totale vers SQL**, c'est la priorité n°1 !
