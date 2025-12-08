import { User } from '../types';
import { StorageService } from './storageService';

// Ce service sert de pont vers le Backend Node.js
// Il est destiné à remplacer progressivement le storageService (localStorage)
export const ApiService = {
    // Vérifier si l'application est installée (Admin existe)
    checkInstallStatus: async (): Promise<boolean> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 seconde max pour éviter l'écran blanc

        try {
            const res = await fetch('/api/setup/status', { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error("API Unreachable");
            const data = await res.json();
            return data.installed;
        } catch (e) {
            // Si backend non joignable ou timeout, on vérifie si un admin existe localement
            return StorageService.hasAdmin(); 
        }
    },

    // Installer l'application (Créer premier admin)
    installApp: async (adminData: any): Promise<boolean> => {
        try {
            const res = await fetch('/api/setup/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminData)
            });
            if (!res.ok) throw new Error("API Error");
            return res.ok;
        } catch (e) {
            console.warn("Backend non joignable, installation locale...");
            return StorageService.createAdmin(adminData);
        }
    },

    // Connexion via API
    login: async (username: string, password?: string): Promise<User | null> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!res.ok) throw new Error('Login failed');
            
            const user = await res.json();
            // Stocker le token JWT pour les futures requêtes authentifiées
            localStorage.setItem('tinmel_token', user.token);
            return user;
        } catch (e) {
            console.error("Erreur Connexion API", e);
            return null;
        }
    },

    // Récupérer les utilisateurs depuis la BDD SQL
    getUsers: async (school?: string, city?: string): Promise<User[]> => {
        try {
            let url = '/api/users?';
            if (school) url += `school=${encodeURIComponent(school)}&`;
            if (city) url += `city=${encodeURIComponent(city)}`;
            
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error("Erreur API Users", e);
            return [];
        }
    },
    
    // Créer un utilisateur dans la BDD SQL
    createUser: async (user: User): Promise<boolean> => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            return res.ok;
        } catch (e) {
            console.error("Erreur création utilisateur", e);
            return false;
        }
    }
};