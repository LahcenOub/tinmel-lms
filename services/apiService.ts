
import { User, QuizResult } from '../types';
import { StorageService } from './storageService';

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}

export const ApiService = {
    // Vérifier si l'application est installée (Admin existe)
    checkInstallStatus: async (): Promise<boolean> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); 

        try {
            const res = await fetch('/api/setup/status', { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error("API Unreachable");
            const data = await res.json();
            return data.installed;
        } catch (e) {
            return StorageService.hasAdmin(); 
        }
    },

    // Installer l'application
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

    // Connexion via API (HttpOnly Cookies)
    login: async (username: string, password?: string): Promise<User | null> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            
            if (!res.ok) throw new Error('Login failed');
            
            const user = await res.json();
            return user;
        } catch (e) {
            console.error("Erreur Connexion API", e);
            return null;
        }
    },

    // Vérifier la session active
    checkSession: async (): Promise<User | null> => {
        try {
            const res = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include'
            });
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    // Déconnexion
    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error("Erreur Logout API", e);
        }
    },

    // Legacy method (fetches all, mostly for fallback)
    getUsers: async (school?: string, city?: string): Promise<User[]> => {
        try {
            let url = '/api/users?';
            if (school) url += `school=${encodeURIComponent(school)}&`;
            if (city) url += `city=${encodeURIComponent(city)}`;
            
            const res = await fetch(url);
            const response = await res.json();
            return response.data || response; // Handle both paginated structure and simple array
        } catch (e) {
            return StorageService.getUsers(); // Fallback Local
        }
    },

    // NEW: Paginated Fetch
    getUsersPaginated: async (params: { page: number, limit: number, q?: string, role?: string, school?: string }): Promise<PaginatedResponse<User>> => {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('page', params.page.toString());
            searchParams.append('limit', params.limit.toString());
            if (params.q) searchParams.append('q', params.q);
            if (params.role) searchParams.append('role', params.role);
            if (params.school) searchParams.append('school', params.school);

            const res = await fetch(`/api/users?${searchParams.toString()}`);
            if (!res.ok) throw new Error("Fetch failed");
            return await res.json();
        } catch (e) {
            console.warn("API Paginated Fetch failed, falling back to local simulation", e);
            
            // Offline/Local Simulation of Pagination & Search
            let allUsers = StorageService.getUsers();
            
            if (params.role) allUsers = allUsers.filter(u => u.role === params.role);
            if (params.school) allUsers = allUsers.filter(u => u.school === params.school);
            if (params.q) {
                const q = params.q.toLowerCase();
                allUsers = allUsers.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
            }

            const start = (params.page - 1) * params.limit;
            const end = start + params.limit;
            
            return {
                data: allUsers.slice(start, end),
                meta: {
                    total: allUsers.length,
                    page: params.page,
                    limit: params.limit
                }
            };
        }
    },
    
    createUser: async (user: User): Promise<boolean> => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            return res.ok;
        } catch (e) {
            StorageService.saveUser(user);
            return true;
        }
    },

    submitQuiz: async (payload: { quizId: string, studentId: string, studentName: string, answers: any, timeSpent: number, essayScores: any }): Promise<QuizResult | null> => {
        try {
            const res = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) throw new Error("Submission Failed");
            return await res.json();
        } catch (e) {
            console.warn("Backend submit failed, using fallback:", e);
            return null;
        }
    },

    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                return data.url;
            }
            throw new Error('Server upload failed');
        } catch (e) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
            });
        }
    }
};
