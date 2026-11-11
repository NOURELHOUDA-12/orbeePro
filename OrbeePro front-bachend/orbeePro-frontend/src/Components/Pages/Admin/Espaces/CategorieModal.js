import React, { useState } from 'react';
import { 
    Close, Public, Business, Room, Wc, 
    Restaurant, Kitchen, Shower, MeetingRoom 
} from '@mui/icons-material';
import { spaceService } from '../../../../services/EspaceServices';

const CategorieModal = ({ show, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        type: 'public',
        couleur: '#3B82F6',
        icone: 'public'
    });

    // Liste des icônes disponibles pour le choix
    const availableIcons = [
        { name: 'public', component: <Public /> },
        { name: 'business', component: <Business /> },
        { name: 'room', component: <Room /> },
        { name: 'wc', component: <Wc /> },
        { name: 'restaurant', component: <Restaurant /> },
        { name: 'kitchen', component: <Kitchen /> },
        { name: 'shower', component: <Shower /> },
        { name: 'meeting_room', component: <MeetingRoom /> }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nom) return alert("Le nom est obligatoire");

        setIsSubmitting(true);
        try {
            // Appel au service MySQL
            await spaceService.saveCategorie({
                ...formData,
                is_custom: 1 // On marque que c'est une catégorie créée par l'utilisateur
            });
            
            alert('✅ Catégorie créée avec succès !');
            onSuccess(); // Rafraîchir la liste dans le parent
            onClose();   // Fermer la modale
            setFormData({ nom: '', type: 'public', couleur: '#3B82F6', icone: 'public' });
        } catch (error) {
            alert("Erreur lors de la création : " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={titleStyle}>Nouvelle Catégorie</h2>
                    <button onClick={onClose} style={closeBtnStyle}><Close /></button>
                </div>

                <form onSubmit={handleSubmit} style={formStyle}>
                    {/* Nom */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Nom de la catégorie *</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Espace Wellness, Zone VIP..."
                            value={formData.nom}
                            onChange={(e) => setFormData({...formData, nom: e.target.value})}
                            style={inputStyle}
                            required
                        />
                    </div>

                    {/* Type & Couleur */}
                    <div style={rowStyle}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Type d'accès</label>
                            <select 
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                style={inputStyle}
                            >
                                <option value="public">Public (Clients)</option>
                                <option value="professionnel">Professionnel (Staff)</option>
                            </select>
                        </div>
                        <div style={{ width: '100px' }}>
                            <label style={labelStyle}>Couleur</label>
                            <input 
                                type="color" 
                                value={formData.couleur}
                                onChange={(e) => setFormData({...formData, couleur: e.target.value})}
                                style={colorInputStyle}
                            />
                        </div>
                    </div>

                    {/* Sélecteur d'Icônes */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Choisir une icône</label>
                        <div style={iconGridStyle}>
                            {availableIcons.map((icon) => (
                                <div 
                                    key={icon.name}
                                    onClick={() => setFormData({...formData, icone: icon.name})}
                                    style={{
                                        ...iconBoxStyle,
                                        backgroundColor: formData.icone === icon.name ? '#FBBF24' : '#F3F4F6',
                                        color: formData.icone === icon.name ? 'white' : '#6B7280',
                                        borderColor: formData.icone === icon.name ? '#cb9b23' : 'transparent'
                                    }}
                                >
                                    {icon.component}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelBtnStyle}>Annuler</button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            style={isSubmitting ? disabledBtnStyle : submitBtnStyle}
                        >
                            {isSubmitting ? 'Création...' : 'Créer la catégorie'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// === STYLES ===
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, backdropFilter: 'blur(4px)' };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' };
const titleStyle = { fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '14px', fontWeight: '600', color: '#374151' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '2px solid #E5E7EB', fontSize: '15px', outline: 'none', transition: 'border 0.2s' };
const colorInputStyle = { width: '100%', height: '45px', border: '2px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer', background: 'none', padding: '2px' };
const rowStyle = { display: 'flex', gap: '15px' };
const iconGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '5px' };
const iconBoxStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' };
const footerStyle = { display: 'flex', gap: '12px', marginTop: '10px' };
const cancelBtnStyle = { flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#F3F4F6', color: '#4B5563', fontWeight: '700', cursor: 'pointer' };
const submitBtnStyle = { flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FBBF24 0%, #cb9b23 100%)', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)' };
const disabledBtnStyle = { ...submitBtnStyle, opacity: 0.6, cursor: 'not-allowed' };

export default CategorieModal;