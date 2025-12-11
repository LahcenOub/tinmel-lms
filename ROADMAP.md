
# 🗺️ Roadmap Technique - Tinmel LMS

Ce document trace la route entre le prototype actuel (PoC) et une version de production robuste.

## 🔴 Priorité Haute : Architecture & Sécurité (Q2 2025)

L'objectif est de sécuriser l'application et de sortir de la dépendance au `localStorage`.

- [ ] **Routing Professionnel**
    - [x] Implémentation History API (Fait).
    - [ ] Migration vers `react-router-dom` v6 pour une gestion native des routes imbriquées et des loaders.
    - [x] Protection des routes (`AuthGuard`) coté client.

- [ ] **Backend First (Sécurité)**
    - [x] Déplacer la logique de validation des Quiz du Frontend vers le Backend (Node.js).
    - [x] Remplacer le stockage de Token dans `localStorage` par des **Cookies HttpOnly** (protection XSS).
    - [x] Hashage des mots de passe coté serveur (Bcrypt) obligatoire.

- [ ] **Gestion des Fichiers**
    - [x] Remplacer le stockage d'images Base64 (lourd pour la BDD) par un système d'upload de fichiers.
    - [x] Intégration de `Multer` (Node.js) et stockage local ou S3.

## 🟡 Priorité Moyenne : Performance & Scalabilité (Q3 2025)

Préparer l'application pour supporter 2000+ élèves simultanés.

- [ ] **Optimisation des Données**
    - [x] Implémenter la **Pagination** coté serveur pour les listes d'élèves et de résultats.
    - [ ] Mettre en place `TanStack Query` (React Query) pour le cache et la gestion des états serveur.

- [ ] **Temps Réel**
    - [ ] Remplacer le "polling" (vérification toutes les 5s) par des **WebSockets** (Socket.io).
    - [ ] Chat en direct et Notifications instantanées.

## 🟢 Priorité Basse : Fonctionnalités & UX (Q4 2025)

- [ ] **Offline First (PWA)**
    - [ ] Rendre l'application installable sur mobile.
    - [ ] Permettre le passage de quiz sans connexion internet (synchronisation au retour du réseau).

- [ ] **Localisation**
    - [ ] Traduction complète de l'interface en **Amazigh (Tifinagh)**.
    - [ ] Support des dates hégiriennes.

## 💡 Idées Communautaires (Backlog)

*   *Ajout d'un rôle "Parent" pour le suivi des notes.*
*   *Intégration de Jitsi Meet pour les classes virtuelles.*
*   *Export des bulletins de notes au format PDF officiel.*

---
**Envie de contribuer ?**
Choisissez une tâche, forkez le projet et proposez une Pull Request ! Utilisez le tag `hacktoberfest` si applicable.
