// src/services/spaceService.js
import { API_URL } from '../constants';

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const spaceService = {
    // Tout récupérer (Catégories, Espaces, Sous-espaces)
    getHierarchy: async () => {
        const response = await fetch(`${API_URL}/spaces/hierarchy`, { headers: getHeaders() });
        return response.json(); // Le backend devra renvoyer un objet avec les 3 tableaux
    },



    
    // Sauvegarder une catégorie
    saveCategorie: async (data) => {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
          });
        return response.json();
    },

    // Sauvegarder un Espace Parent
    saveEspace: async (data, id = null) => {
        const url = id ? `${API_URL}/espaces/${id}` : `${API_URL}/espaces`;
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Sauvegarder un Sous-Espace
    saveSousEspace: async (data, id = null) => {
        const url = id ? `${API_URL}/sous-espaces/${id}` : `${API_URL}/sous-espaces`;
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Suppression
    deleteEspace: async (id) => {
        return fetch(`${API_URL}/espaces/${id}`, { method: 'DELETE', headers: getHeaders() });
    }

    ,
    getLocations: async () => {
        try {
          const response = await fetch(`${API_URL}/espaces/formatted-list`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          return await response.json();
        } catch (error) {
          throw error;
        }
      }
    
};

export default spaceService;