import  api from './api';

const DevisService = {
    /**
     * Récupère la liste de tous les devis depuis MySQL
     */
    getAll: async () => {
        try {
            const response = await api.get('/devis/getAll');
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des devis:", error);
            throw error;
        }

    },

    /**
     * Récupère un devis spécifique par son ID (avec ses lignes)
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/devis/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du devis ${id}:`, error);
            throw error;
        }
    },

    /**
     * Crée un nouveau devis (Entête + Lignes de produits)
     * @param {Object} devisData - { nom_entreprise, email, lignes: [...] }
     */
    create: async (devisData) => {
        try {
            const response = await api.post('/devis', devisData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création du devis:", error);
            throw error;
        }
    },

    /**
     * Met à jour le statut d'un devis (ex: de 'brouillon' à 'envoyé')
     */
    updateStatus: async (id, status) => {
        try {
            const response = await api.put(`/devis/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error);
            throw error;
        }
    },

    /**
     * Supprime un devis de la base de données
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/devis/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression du devis:", error);
            throw error;
        }
    },

   // DevisService.js

sendByEmail: async (devis) => {
    // On extrait l'ID et l'email de l'objet devis reçu en paramètre
    const { id, email_fournisseur } = devis;
    
    
    try {
        // L'URL doit correspondre à la route backend : /api/devis/:id/send-email
        // On envoie aussi l'objet complet 'devis' pour que le backend ait les lignes (items)
        const response = await api.post(`/devis/${id}/send-email`, { 
            email: email_fournisseur,
            devis: devis 
        });
        return response.data;
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        throw error;
    }
}
  
};

export default DevisService;