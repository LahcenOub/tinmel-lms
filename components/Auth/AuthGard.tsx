import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, UserRole } from '../../types';

interface AuthGuardProps {
    user: User | null;
    requiredRole: UserRole;
    children: React.ReactNode;
}

/**
 * Composant de protection des routes (AuthGuard).
 * Vérifie si l'utilisateur est connecté et possède le rôle requis.
 * Sinon, redirige vers la page d'accueil.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ user, requiredRole, children }) => {
    // 1. Pas connecté -> Redirection Login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 2. Mauvais Rôle -> Redirection Accueil (ou page d'erreur 403)
    if (user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    // 3. Autorisé -> Rendu du contenu
    return <>{children}</>;
};

export default AuthGuard;
