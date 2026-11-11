import React, { useState } from 'react';
import { 
  Wrench, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  Send, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

import reclamationService from '../../../../services/ReclamationService';
import './reclamationModal.css';


const ReclamationModal = ({ 
  showAddModal, 
  onClose,
  onSubmit 
}) => {
  const [reclamationForm, setReclamationForm] = useState({
    espaceNumber: '',
    service: '',
    urgency: '',
    description: '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Données pour les services
  const services = [
    { id: 'plomberie', label: 'Plomberie', icon: '💧' },
    { id: 'electricite', label: 'Électricité', icon: '⚡' },
    { id: 'climatisation', label: 'Climatisation', icon: '❄️' },
    { id: 'menager', label: 'Ménager', icon: '🧹' },
    { id: 'technique', label: 'Technique', icon: '🔧' },
    { id: 'autre', label: 'Autre', icon: '📝' }
  ];

  // Niveaux d'urgence
  const urgencyLevels = [
    { 
      id: 'low', 
      label: 'Faible', 
      description: 'Problème non urgent' 
    },
    { 
      id: 'medium', 
      label: 'Moyen', 
      description: 'Problème à traiter sous 24h' 
    },
    { 
      id: 'high', 
      label: 'Élevé', 
      description: 'Intervention rapide nécessaire' 
    },
    { 
      id: 'critical', 
      label: 'Critique', 
      description: 'Urgence - Intervention immédiate' 
    }
  ];

  // Couleurs pour les niveaux d'urgence
  const getUrgencyColor = (urgency) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626'
    };
    return colors[urgency] || '#6B7280';
  };

  // Gestion du changement de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReclamationForm({ ...reclamationForm, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



const submitReclamation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await reclamationService.create(reclamationForm);
    
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeAddModal(); 
      }, 3000);
    } else {
      alert("Erreur : " + result.message);
    }
    setIsSubmitting(false);
};

  // Fermeture de la modale
  const closeAddModal = () => {
    onClose();
    setReclamationForm({
      espaceNumber: '',
      service: '',
      urgency: '',
      description: '',
      photo: null
    });
    setPhotoPreview(null);
    setShowSuccess(false);
  };

  if (!showAddModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-reclamation-modern">
        
        {showSuccess ? (
          <div className="success-modal-enhanced">
            <div className="success-content-enhanced">
              <div className="success-icon-enhanced">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
              <h2 className="success-title">Réclamation Envoyée !</h2>
              <p className="success-message">
                Le service de maintenance a été notifié et interviendra rapidement.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header amélioré */}
            <div className="modal-header-reclamation">
              <div className="header-content">
                <div className="header-title">
                  <div className="header-icon">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold">Nouvelle Réclamation</h1>
                </div>
                <p className="header-subtitle" style={{color:'white'}}>Signaler un problème de maintenance</p>
              </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="form-content-reclamation">
              <form onSubmit={submitReclamation} className="space-y-6">
                
                {/* Numéro de Chambre */}
                <div className="form-section">
                  <label className="form-label-enhanced">
                    <MapPin size={20} />
                    Numéro d'espace  <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reclamationForm.espaceNumber}
                    onChange={(e) => setReclamationForm({ 
                      ...reclamationForm, 
                      espaceNumber: e.target.value 
                    })}
                    placeholder="Ex: 204, Suite 301, Espace Commun..."
                    className="input-enhanced"
                    required
                  />
                </div>

                {/* Service de Maintenance */}
                <div className="form-section">
                  <label className="form-label-enhanced">
                    <Wrench size={20} />
                    Service de Maintenance <span className="text-red-500">*</span>
                  </label>
                  <div className="services-grid-enhanced">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setReclamationForm({ 
                          ...reclamationForm, 
                          service: service.id 
                        })}
                        className={`service-button-enhanced ${
                          reclamationForm.service === service.id ? 'selected' : ''
                        }`}
                      >
                        <div className="service-icon-enhanced">{service.icon}</div>
                        <div className="service-label-enhanced">{service.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Niveau d'Urgence */}
                <div className="form-section">
                  <label className="form-label-enhanced">
                    <AlertTriangle size={20} />
                    Niveau d'Urgence <span className="text-red-500">*</span>
                  </label>
                  <div className="urgency-levels-enhanced">
                    {urgencyLevels.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setReclamationForm({ 
                          ...reclamationForm, 
                          urgency: level.id 
                        })}
                        className={`urgency-button-enhanced ${
                          reclamationForm.urgency === level.id ? `selected text-${level.id}` : ''
                        }`}
                        style={{ 
                          borderColor: reclamationForm.urgency === level.id ? 
                            getUrgencyColor(level.id) : '#e2e8f0'
                        }}
                      >
                        <div className="urgency-info-enhanced">
                          <div 
                            className="urgency-dot-enhanced"
                            style={{ backgroundColor: getUrgencyColor(level.id) }}
                          ></div>
                          <div className="urgency-text-enhanced">
                            <div 
                              className="urgency-label-enhanced"
                              style={{ 
                                color: reclamationForm.urgency === level.id ? 
                                  getUrgencyColor(level.id) : '#374151' 
                              }}
                            >
                              {level.label}
                            </div>
                            <div className="urgency-description-enhanced">
                              {level.description}
                            </div>
                          </div>
                        </div>
                        {reclamationForm.urgency === level.id && (
                          <CheckCircle2 
                            size={24} 
                            style={{ color: getUrgencyColor(level.id) }} 
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-section">
                  <label className="form-label-enhanced">
                    <FileText size={20} />
                    Description du problème
                  </label>
                  <textarea
                    value={reclamationForm.description}
                    onChange={(e) => setReclamationForm({ 
                      ...reclamationForm, 
                      description: e.target.value 
                    })}
                    placeholder="Décrivez le problème en détail... (optionnel)"
                    rows="4"
                    className="input-enhanced resize-none"
                  />
                </div>

                {/* Photo */}
                <div className="form-section">
                  <label className="form-label-enhanced">
                    <Camera size={20} />
                    Photo du problème
                  </label>
                  <div className="photo-upload-zone-enhanced">
                    {photoPreview ? (
                      <div className="text-center">
                        <img 
                          src={photoPreview} 
                          alt="Aperçu" 
                          className="photo-preview-enhanced" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setReclamationForm({ ...reclamationForm, photo: null });
                          }}
                          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={16} className="inline mr-2" />
                          Supprimer la photo
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-semibold text-gray-600 mb-2">
                          Ajouter une photo
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Cliquez pour prendre ou télécharger une photo
                        </p>
                        <div className="px-4 py-2 bg-indigo-500 text-white rounded-lg inline-block hover:bg-indigo-600 transition-colors">
                          <Upload size={16} className="inline mr-2" />
                          Choisir un fichier
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="form-actions-enhanced">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="cancel-button-enhanced"
                  >
                    <X size={20} />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="submit-button-enhanced"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading-spinner-enhanced"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Envoyer la Réclamation
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Info Box améliorée */}
              <div className="info-box-enhanced">
                <div className="info-content-enhanced">
                  <div className="info-icon-enhanced">
                    <Info size={20} className="text-white" />
                  </div>
                  <div className="info-text-enhanced">
                    <p className="info-title-enhanced">💡 Conseil important</p>
                    <p>
                      Prenez une photo claire du problème et décrivez-le précisément 
                      pour aider nos techniciens à intervenir plus efficacement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReclamationModal;






