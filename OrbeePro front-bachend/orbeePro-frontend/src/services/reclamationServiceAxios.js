import api from './api';
import {API_URL} from '../constants'



const reclamationService = {
    // Récupérer les tâches actives et l'historique d'un employé
    getEmployeeData: async (userId) => {
        const response = await api.get(`${API_URL}/reclamations/employee/${userId}`);
        return response.data; // Retourne { success, data: { active, history } }
    },

    // Mettre à jour le statut d'une réclamation (En cours, Résolu, etc.)
    updateStatus: async (reclamationId, statusData) => {
        // statusData peut contenir { status, reason, userId }
        const response = await api.put(`/reclamations/${reclamationId}/status`, statusData);
        return response.data;
    },

    // Créer une nouvelle réclamation
    create: async (reclamationData) => {
        const response = await api.post('/reclamations', reclamationData);
        return response.data;
    },

    // Récupérer la hiérarchie des lieux (Espaces/Sous-espaces)
    getLocations: async () => {
        const response = await api.get('/locations/hierarchy');
        return response.data;
    }

    ,
    getEmployeeDataByRole: async (role) => {
    const response = await api.get(`${API_URL}/reclamations/service/${role}`);
    return response.data;
},


 // axiosService.js
updateReclamationStatus: async (reclamationId, newStatus, agentId, pauseReason = null) => {
    const payload = { 
        status: newStatus, 
        agentId: agentId,
        pauseReason: pauseReason // Sera null sauf si on clique sur Pause
    };

    const response = await api.put(`${API_URL}/reclamations/updateStatus/${reclamationId}`, payload);
    return response.data;
}
};

export default reclamationService;