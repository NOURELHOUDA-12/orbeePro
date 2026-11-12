import { API_URL } from '../constants';
const token = localStorage.getItem('token'); 

export const taskService = {


getTaskManagerData: async () => {

    const response = await fetch(`${API_URL}/tasks/manager-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (response.status === 401) {
      // Si le token est expiré, on peut forcer un logout
      console.error("Session expirée");
    }

    return await response.json();
  },




getAll: async () => {
    const response = await fetch(`${API_URL}/tasks/getAll`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json(); 
  }

,



// Créer une nouvelle tâche
    create: async (taskData) => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        return await response.json();
    },
 



    // Mettre à jour le statut d'une tâche
  update: async (id, taskData) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    return await response.json();
  },


delete: async (id) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
},



updateStatus: async (id, newStatus) => {
  try {
    const response = await fetch(`${API_URL}/tasks/updateStatus/${id}`, {
      method: 'PUT', // Méthode standard pour la mise à jour
      headers: {
        'Content-Type': 'application/json',
      },
      // On envoie le nouveau statut dans le corps de la requête
      body: JSON.stringify({ status: newStatus }), 
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur dans taskService:", error);
    return { success: false, message: error.message };
  }
}   ,  



pause: async (id, reason) => {
    try {
      const response = await fetch(`${API_URL}/tasks/pause/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }) 
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },


 
resume: async (id) => {
    try {
      const response = await fetch(`${API_URL}/tasks/resume/${id}`, {
        method: 'PUT'
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },



  getHistory: async (id) => {
    try {
        const response = await fetch(`${API_URL}/tasks/history/${id}`);
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
},

};

export default taskService;