import { API_URL } from '../constants';
 const token = localStorage.getItem('token');

export const reclamationService = {



  create: async (reclamationData) => {    
    const formData = new FormData();
    formData.append('espaceNumber', reclamationData.espaceNumber);
    formData.append('service', reclamationData.service);
    formData.append('urgency', reclamationData.urgency);
    formData.append('description', reclamationData.description);
    if (reclamationData.photo) {
        formData.append('photo', reclamationData.photo);
    }

    const response = await fetch(`${API_URL}/reclamations`, {
        method: 'POST',
        headers: {
            // ✅ On passe le token ici
            'Authorization': `Bearer ${token}` 
            // ❌ NE PAS METTRE 'Content-Type': 'multipart/form-data'
        },
        body: formData,
    });
    return await response.json();
}
,


  getAll: async () => {

    const response = await fetch(`${API_URL}/reclamations/getAllReclamations`, {
        headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}
,


assignAgent: async (reclamationId, agentId) => {
    const response = await fetch(`${API_URL}/reclamations/${reclamationId}/assign`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentId })
    });
    return await response.json();
},



getStaffDashboard: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/staff/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error("Erreur service reclamationService:", error);
            throw error;
        }
    }
,



updateStatus: async (id, statusData) => {
    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
      });
      return await response.json();
    } catch (error) {
      console.error("Erreur updateStatus service:", error);
      throw error;
    }

},


  };

export default reclamationService;


