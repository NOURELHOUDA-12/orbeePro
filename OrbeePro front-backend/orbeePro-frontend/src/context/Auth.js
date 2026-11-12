import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Création du contexte
const AuthContext = createContext();

// 2. Hook personnalisé pour utiliser le contexte facilement
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
};



// 3. Le Fournisseur (Provider)
export const AuthProvider = ({ children }) => {
    // Initialisation synchrone : on lit le localStorage immédiatement
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Erreur de lecture du localStorage", error);
            return null;
        }
    });

    const [loading, setLoading] = useState(true);

    // Fonction pour connecter l'utilisateur
    const login = (userData, token) => {
        // On stocke l'utilisateur et le token JWT
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setCurrentUser(userData);
    };

    // Fonction pour déconnecter l'utilisateur
    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setCurrentUser(null);
    };

    useEffect(() => {
        // Ici, on pourrait ajouter un appel API vers Node.js 
        // pour vérifier si le token est toujours valide (route /me)
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Optionnel : appel vers votre backend pour confirmer le token
                // Si invalide -> logout()
            }
            setLoading(false);
        };

        verifyToken();
    }, []);

    // Valeurs exposées aux autres composants
    const value = {
        currentUser,
        login,
        logout,
        isAuthenticated: !!currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};