
const API_URL = `${process.env.REACT_APP_API_URL}/auth`;

export const registerUser = async (userData, profileImage) => {
    const formData = new FormData();
    
    formData.append('nom', userData.nom);
    formData.append('prenom', userData.prenom);
    formData.append('tel', userData.tel);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }


    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        body: formData, 
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'inscription");
    }

    return await response.json();
};

export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Erreur de connexion");
    }

    return data; 
};