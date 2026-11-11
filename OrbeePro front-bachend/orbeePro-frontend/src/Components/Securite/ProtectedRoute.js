import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // 1. Si pas de token, redirection vers Login

    if (!token) {
        return <Navigate to="/Login" replace />;
    }

    // 2. Si le rôle de l'utilisateur n'est pas dans la liste des rôles autorisés
    // On peut rediriger vers une page "Accès refusé" ou vers le login
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/Login" replace />;
    }

    // 3. Si tout est OK, on affiche les composants enfants (grâce à Outlet)
    return <Outlet />;
};

export default ProtectedRoute;