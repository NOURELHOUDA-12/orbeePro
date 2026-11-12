import React, { useState } from 'react';
import { 
  User, Mail, Lock, Phone, Shield, 
  Briefcase, Camera, Upload, Trash2, 
  X, Send, Info, CheckCircle2, UserPlus 
} from 'lucide-react';
import { createPortal } from 'react-dom';
import Staff from '../../../../Models/Staff.js';
     
       
import {API_URL} from '../../../../constants.js' 
import './AddStaffModal.css';
  
const AddStaffModal = ({ onClose, onAdd  }) => {

const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: '', tel: '', specialite: ''
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);


  
  const rolesList = [
    { id: 'receptionniste', nom: 'Réceptionniste', icon: '📞' },
    { id: 'menage', nom: 'Ménage', icon: '🧹' },
    { id: 'maintenance', nom: 'Maintenance', icon: '🔧' },
    { id: 'chef-maintenance', nom: 'Chef Maint.', icon: '👷' },
    { id: 'admin', nom: 'Admin', icon: '🔐' }

  ];

  const specialitesList = [
    'Plomberie', 'Électricité', 'Climatisation', 'Menuiserie', 'Peinture', 'Généraliste'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    await uploadImageToServer(file);
  };

  const uploadImageToServer = async (file) => {
    setUploading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('image', file);
    formDataToSend.append('folder', 'profileImages');
                    
    try {
      const response = await fetch(`${API_URL}/images/upload-profile`, {
        method: 'POST',
        body: formDataToSend 
 });
    
    
    
     
 const data = await response.json();

      if (data.success) {setUploadedImageUrl(data.imageUrl);
      }
      else {
        setError(data.message);
        setImagePreview(null);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setUploading(false);
    }
  };


const handleSubmit = async (e) => {
  e.preventDefault();

  // On crée une instance du modèle avec les données du formulaire
  const newStaff = new Staff({
    ...formData,
    profileImageUrl: uploadedImageUrl
  });
  // Validation avant envoi
  if (!newStaff.isValid()) {
    setError('Données invalides. Vérifiez le nom et l\'email.');
    return;
  }

  try {
    await onAdd(newStaff.toJSON());
    setShowSuccess(true);


  } catch (err) {
    setError(err.message);
  }
};
 


return (
    <div className="modal-overlay">
      <div className="modal-reclamation-modern">
        
        {showSuccess ? (
          <div className="success-modal-enhanced">
            <div className="success-content-enhanced">
              <div className="success-icon-enhanced staff-success">
                <CheckCircle2 size={48} className="text-white" />
              </div>
              <h2 className="success-title">Compte Créé !</h2>
              <p className="success-message">L'utilisateur a été ajouté avec succès à l'équipe.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-header-reclamation staff-header">
              <div className="header-content">
                <div className="header-title">
                  <div className="header-icon"><UserPlus size={32} color="#FFFFFF"/></div>
                  <h1 className="text-2xl font-bold">Nouveau Staff</h1>
                </div>
                <p className="header-subtitle" style={{ color: '#E0E7FF' }}>Créez un accès pour un nouveau membre  
                  
                    </p> </div>
            </div>

            <div className="form-content-reclamation">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Image Upload Zone */}
                <div className="form-section text-center">
                  <div className="photo-upload-zone-enhanced profile-zone">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Aperçu" className="profile-preview-circular" />
                        <button type="button" onClick={() => {setImagePreview(null); setUploadedImageUrl('')}} className="remove-photo-badge">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="profile-placeholder">
                          <Camera size={30} className="text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Photo de profil</p>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {error && <div className="alert-error-mini">{error}</div>}

                {/* Grid Nom / Email */}
                <div className="form-grid-2">
                  <div className="form-section">
                    <label className="form-label-enhanced"><User size={18} /> Nom complet *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Jean Dupont" className="input-enhanced" required />
                  </div>
                  <div className="form-section">
                    <label className="form-label-enhanced"><Mail size={18} /> Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="jean@hotel.com" className="input-enhanced" required />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-section">
                    <label className="form-label-enhanced"><Lock size={18} /> Mot de passe *</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-enhanced" required />
                  </div>
                  <div className="form-section">
                    <label className="form-label-enhanced"><Phone size={18} /> Téléphone</label>
                    <input type="tel" name="tel" value={formData.tel} onChange={handleChange} placeholder="+216 ..." className="input-enhanced" />
                  </div>
                </div>

                {/* Rôles en Grille */}
                <div className="form-section">
                  <label className="form-label-enhanced"><Shield size={18} /> Rôle au sein de l'établissement *</label>
                  <div className="services-grid-enhanced roles-grid">
                    {rolesList.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.id })}
                        className={`service-button-enhanced ${formData.role === role.id ? 'selected' : ''}`}
                      >
                        <span className="service-icon-enhanced">{role.icon}</span>
                        <span className="service-label-enhanced">{role.nom}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spécialités (si maintenance) */}
                {formData.role === 'maintenance' && (
                  <div className="form-section animate-fadeIn">
                    <label className="form-label-enhanced"><Briefcase size={18} /> Spécialité technique *</label>
                    <div className="specialty-chips">
                      {specialitesList.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => setFormData({ ...formData, specialite: spec })}
                          className={`chip-button ${formData.specialite === spec ? 'active' : ''}`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-actions-enhanced">
                  <button type="button" onClick={onClose} className="cancel-button-enhanced">Annuler</button>
                  <button type="submit" disabled={uploading} className="submit-button-enhanced staff-btn">
                    {uploading ? <div className="loading-spinner-enhanced" /> : <Send size={20} />}
                    {uploading ? "Upload..." : "Créer le compte"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      
    </div>
  );
};

export default AddStaffModal;