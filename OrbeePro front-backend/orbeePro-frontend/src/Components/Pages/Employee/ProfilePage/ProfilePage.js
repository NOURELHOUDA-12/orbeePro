import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot, limit } from 'firebase/firestore';
// Nouveaux imports pour Firebase Storage
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from '../../../../firebaseConfig'; 
import { useAuth } from '../../../../context/AuthContext';
import { Phone, Person, Email, Work, Save, Image } from '@mui/icons-material';
import './ProfilePage.css'; 

// Fonction utilitaire (inchangée)
const getRoleLabel = (role) => {
    const roleLabels = { 'admin': 'Administrateur', 'chef-maintenance': 'Chef Maintenance', 'maintenance': 'Maintenance', 'menage': 'Ménage', 'receptionniste': 'Réceptionniste' };
    return roleLabels[role] || role;
};

const ProfilePage = () => {
    const { currentUser } = useAuth();
    
    // État pour les données du formulaire (ce que l'utilisateur modifie)
    const [formData, setFormData] = useState({
        name: '',
        tel: '',
        profileImage: '' // Garde l'URL de l'image actuelle
    });
    
    // NOUVEAUX états pour l'upload
    const [imageFile, setImageFile] = useState(null); // Le fichier sélectionné
    const [uploadProgress, setUploadProgress] = useState(0); // Progrès de l'upload
    
    // État pour les données fixes (email, rôle)
    const [profileInfo, setProfileInfo] = useState({ email: '', role: '' });
    const [staffDocId, setStaffDocId] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Renommé pour plus de clarté
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Effet pour charger les données de l'utilisateur connecté (inchangé)
    useEffect(() => {
        if (!currentUser) { setLoading(false); setError("Vous devez être connecté."); return; }
        setLoading(true);
        const q = query(collection(db, "staff"), where("uid", "==", currentUser.uid), limit(1));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                setError("Profil utilisateur introuvable.");
                setProfileInfo({ email: currentUser.email, role: 'Inconnu' });
                setLoading(false);
            } else {
                const staffDoc = querySnapshot.docs[0];
                const data = staffDoc.data();
                setFormData({
                    name: data.name || '',
                    tel: data.tel || '',
                    profileImage: data.profileImage || '' // URL de l'image
                });
                setProfileInfo({ email: data.email, role: data.role });
                setStaffDocId(staffDoc.id);
                setLoading(false);
                setError('');
            }
        }, (err) => {
            console.error(err);
            setError("Erreur lors du chargement du profil.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Gère les changements dans les champs texte
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // NOUVEAU : Gère la sélection du fichier image
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Vérification simple du type de fichier
            if (!file.type.startsWith("image/")) {
                setError("Veuillez sélectionner un fichier image (jpeg, png, etc.).");
                return;
            }
            setImageFile(file);
            setError('');
        }
    };

    // Fonction pour mettre à jour Firestore
    const updateProfileInFirestore = async (dataToUpdate) => {
        if (!staffDocId) {
            setError("ID de profil introuvable.");
            setIsSubmitting(false);
            return;
        }
        const staffDocRef = doc(db, "staff", staffDocId);
        try {
            await updateDoc(staffDocRef, dataToUpdate);
            setSuccess("Profil mis à jour avec succès !");
            setImageFile(null); // Réinitialise le fichier
            setUploadProgress(0); // Réinitialise la progression
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la sauvegarde du profil.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // MODIFIÉ : Gère la soumission (avec ou sans upload d'image)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        // Données texte à sauvegarder
        const dataToUpdate = {
            name: formData.name,
            tel: formData.tel,
        };

        // Cas 1 : Un nouveau fichier a été sélectionné
        if (imageFile) {
            // Créer une référence unique pour l'image
            const storageRef = ref(storage, `profileImages/${currentUser.uid}/${imageFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, imageFile);

            // Écouter les événements d'upload
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Mettre à jour la progression
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (uploadError) => {
                    // Gérer l'erreur d'upload
                    console.error("Erreur d'upload:", uploadError);
                    setError("Erreur lors du téléversement de l'image.");
                    setIsSubmitting(false);
                },
                async () => {
                    // Upload terminé, on récupère l'URL
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        // Ajoute la nouvelle URL aux données à sauvegarder
                        dataToUpdate.profileImage = downloadURL;
                        // Met à jour le document Firestore
                        await updateProfileInFirestore(dataToUpdate);
                    } catch (urlError) {
                        console.error("Erreur getDownloadURL:", urlError);
                        setError("Erreur lors de la récupération de l'URL de l'image.");
                        setIsSubmitting(false);
                    }
                }
            );
        
        // Cas 2 : Aucun nouveau fichier, mise à jour des infos texte uniquement
        } else {
            await updateProfileInFirestore(dataToUpdate);
        }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <p>Chargement de votre profil...</p>
        </div>
    );

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>Mon Profil</h2>
                    <p>Mettez à jour vos informations personnelles.</p>
                </div>

                {error && (<div className="alert alert-error"><span className="alert-icon">⚠️</span>{error}<button className="alert-close" onClick={() => setError('')}>×</button></div>)}
                {success && (<div className="alert alert-success"><span className="alert-icon">✓</span>{success}<button className="alert-close" onClick={() => setSuccess('')}>×</button></div>)}

                <form className="profile-body" onSubmit={handleSubmit}>
                    
                    {/* Infos non modifiables */}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-with-icon"><Email className="input-icon" /><input type="email" id="email" value={profileInfo.email} disabled /></div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Rôle</label>
                        <div className="input-with-icon"><Work className="input-icon" /><input type="text" id="role" value={getRoleLabel(profileInfo.role)} disabled /></div>
                    </div>

                    {/* Champ Nom (Modifiable) */}
                    <div className="form-group">
                        <label htmlFor="name">Nom Complet</label>
                        <div className="input-with-icon"><Person className="input-icon" /><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Votre nom complet" /></div>
                    </div>

                    {/* Champ Téléphone (Modifiable) */}
                    <div className="form-group">
                        <label htmlFor="tel">Téléphone</label>
                        <div className="input-with-icon"><Phone className="input-icon" /><input type="tel" id="tel" name="tel" value={formData.tel} onChange={handleChange} placeholder="Votre numéro de téléphone" /></div>
                    </div>

                    {/* --- MODIFICATION : Champ Image --- */}
                    <div className="form-group">
                        <label htmlFor="profileImage">Image de profil</label>
                        <div className="profile-image-upload-area">
                            {/* Aperçu de l'image actuelle ou de la nouvelle */}
                            <img 
                                src={imageFile ? URL.createObjectURL(imageFile) : formData.profileImage || 'https://via.placeholder.com/100?text=Profil'} 
                                alt="Aperçu du profil" 
                                className="profile-image-preview"
                            />
                            <input 
                                type="file" 
                                id="fileInput" 
                                className="file-input-hidden" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                                disabled={isSubmitting}
                            />
                            <label htmlFor="fileInput" className="file-input-label">
                                <Image />
                                <span>{imageFile ? imageFile.name : "Changer l'image"}</span>
                            </label>
                        </div>
                        {/* Barre de progression */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                    
                    {/* Bouton de soumission */}
                    <div className="profile-footer">
                        <button type="submit" className="save-btn" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                  <span className="spinner-btn"></span>
                                  Enregistrement...
                                </>
                            ) : (
                                <>
                                  <Save />
                                  Enregistrer les modifications
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ProfilePage;