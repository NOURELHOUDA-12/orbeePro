import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Phone, Shield, 
  Briefcase, Camera, Upload, Trash2, 
  X, Send, CheckCircle2, UserCog 
} from 'lucide-react';

import { API_URL, BASE_URL, UPLOADS_URL } from '../../../../constants.js';

import './EditStaffModal.module.css'; 

const EditStaffModal = ({ staff, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: '', tel: '', specialite: ''
  });
    
  
        
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialisation des données au montage du composant
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        password: '', // On ne pré-remplit pas le mot de passe pour des raisons de sécurité
        role: staff.role || '',
        tel: staff.tel || '',
        specialite: staff.specialite || ''
        
      });


      // Si l'utilisateur a déjà une photo, on prépare l'aperçu
      if (staff.profileImageUrl) {
      console.log(staff.profileImageUrl)

        console.log()
        setImagePreview(`${BASE_URL}${staff.profileImageUrl}`);
           
           console.log()
        setUploadedImageUrl(staff.profileImageUrl);
      }
           
           
    }
  }, [staff]);




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

      if (data.success) {
        setUploadedImageUrl(data.imageUrl);
      } else {
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
    if (!formData.name || !formData.email || !formData.role) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      const updatedData = {
        ...formData,
        id: staff.id, // On garde l'ID original
        specialite: formData.role === 'maintenance' ? formData.specialite : null,
        profileImageUrl: uploadedImageUrl || staff.profileImageUrl
      };
   
      // Si le mot de passe est vide, on le retire pour ne pas écraser l'ancien par du "vide"
      if (!updatedData.password) delete updatedData.password;
                    
                     
      await onUpdate(updatedData);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
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
              <h2 className="success-title">Profil Mis à Jour !</h2>
              <p className="success-message">Les modifications ont été enregistrées avec succès.</p>
            </div>
          </div>
        ) : (
              
          <>
            <div className="modal-header-reclamation staff-header" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
              <div className="header-content">
                <div className="header-title">
                  <div className="header-icon"><UserCog size={32} color="#FFFFFF"/></div>
                  <h1 className="text-2xl font-bold">Modifier le Staff</h1>
                </div>
                <p className="header-subtitle" style={{ color: '#E0E7FF' }}>Mettez à jour les informations de {staff?.name}</p>
              </div>
            </div>

            <div className="form-content-reclamation">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Photo Section */}
                <div className="form-section text-center">
                  <div className="photo-upload-zone-enhanced profile-zone">
                 {imagePreview ? (
  <div className="relative inline-block">
    
    {/* ✅ L'image devient cliquable pour changer */}
    <label className="cursor-pointer">
      <img src={imagePreview} alt="Aperçu" className="profile-preview-circular" />
      
      {/* Overlay au hover */}
      <div className="photo-change-overlay">
        <Camera size={16} color="white" />
        <span>Changer</span>
      </div>
      
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageChange} 
        className="hidden" 
      />
    </label>

    {/* Bouton X pour supprimer */}
    <button 
      type="button" 
      onClick={() => { setImagePreview(null); setUploadedImageUrl(''); }} 
      className="remove-photo-badge"
    >
      <X size={14} />
    </button>

  </div>
) : (
  <label className="cursor-pointer block">
    <div className="profile-placeholder">
      <Camera size={30} className="text-gray-400" />
    </div>
    <p className="text-xs text-gray-500 mt-2">Ajouter une photo</p>
    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
  </label>
)}
                  </div>
                </div>

                {error && <div className="alert-error-mini">{error}</div>}

                <div className="form-grid-2">
                  <div className="form-section">
                    <label className="form-label-enhanced"><User size={18} /> Nom complet *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-enhanced" required />
                  </div>
                  <div className="form-section">
                    <label className="form-label-enhanced"><Mail size={18} /> Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-enhanced" required />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-section">
                    <label className="form-label-enhanced"><Lock size={18} /> Nouveau mot de passe</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Laisser vide si inchangé" className="input-enhanced" />
                  </div>
                  <div className="form-section">
                    <label className="form-label-enhanced"><Phone size={18} /> Téléphone</label>
                    <input type="tel" name="tel" value={formData.tel} onChange={handleChange} className="input-enhanced" />
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label-enhanced"><Shield size={18} /> Rôle actuel *</label>
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
                  <button type="submit" disabled={uploading} className="submit-button-enhanced staff-btn" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
                    {uploading ? <div className="loading-spinner-enhanced" /> : <Send size={20} />}
                    {uploading ? "Upload..." : "Enregistrer les modifications"}
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

export default EditStaffModal;