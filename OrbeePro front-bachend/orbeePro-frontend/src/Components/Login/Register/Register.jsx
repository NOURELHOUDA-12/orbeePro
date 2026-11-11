import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../../services/authService'; 
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', password: '', nom: '', prenom: '', tel: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      // Appel au service MVC
      await registerUser(formData, profileImage);

      setSuccess('Inscription réussie ! Redirection vers la connexion...');
      
      // Petit délai pour laisser l'utilisateur voir le message de succès
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
        <img src="https://i.pinimg.com/736x/3a/00/15/3a0015c4e7e12d6887f51f22fc0122d3.jpg" alt="Décoration" />
      </div>

      <div className="auth-form-panel">
        <form onSubmit={handleSubmit} className="register-form">
          <h2>Créer un compte</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="image-upload-zone">
            <label htmlFor="profileImage" className="image-upload-label">
              {previewUrl ? (
                <img src={previewUrl} alt="Aperçu" className="image-preview" />
              ) : (
                <span className="upload-icon">📷</span>
              )}
            </label>
            <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} disabled={uploading} />
            <p>Photo de profil (optionnel)</p>
          </div>

          <div className="input-group">
            <label>Nom</label>
            <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} required disabled={uploading} />
          </div>

          <div className="input-group">
            <label>Prénom</label>
            <input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} required disabled={uploading} />
          </div>

          <div className="input-group">
            <label>Téléphone</label>
            <input type="tel" value={formData.tel} onChange={(e) => setFormData({...formData, tel: e.target.value})} required disabled={uploading} />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={uploading} />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required disabled={uploading} />
          </div>

          <button type="submit" className="register-button" disabled={uploading}>
            {uploading ? 'Inscription en cours...' : "S'inscrire"}
          </button>

          <div className="form-footer">
            <p>Déjà un compte ? <Link to="/login">Connectez-vous</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;