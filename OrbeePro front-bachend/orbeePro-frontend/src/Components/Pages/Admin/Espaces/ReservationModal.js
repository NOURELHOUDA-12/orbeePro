import React, { useState, useEffect } from 'react';
import { 
    collection, addDoc, updateDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import {
    Close, Event, Person
} from '@mui/icons-material';

const ReservationModal = ({ show, onClose, sousEspaces, onReservationCreated }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservationForm, setReservationForm] = useState({
        sousEspaceId: '',
        clientNom: '',
        clientEmail: '',
        clientTelephone: '',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        statut: 'active',
        prix: '',
        nombreAdultes: 1,
        nombreEnfants: 0,
        notes: ''
    });

    // Réinitialiser le formulaire quand le modal s'ouvre
    useEffect(() => {
        if (show) {
            setReservationForm({
                sousEspaceId: '',
                clientNom: '',
                clientEmail: '',
                clientTelephone: '',
                dateDebut: new Date().toISOString().split('T')[0],
                dateFin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                statut: 'active',
                prix: '',
                nombreAdultes: 1,
                nombreEnfants: 0,
                notes: ''
            });
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reservationForm.sousEspaceId || !reservationForm.clientNom || 
            !reservationForm.dateDebut || !reservationForm.dateFin) {
            alert('Veuillez remplir les champs obligatoires (*)');
            return;
        }

        setIsSubmitting(true);
        try {
            const reservationData = {
                ...reservationForm,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'reservations'), reservationData);
            
            alert('✅ Réservation créée avec succès !');
            onReservationCreated?.(); // Callback pour rafraîchir les données
            onClose();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                        <Event style={{ marginRight: '12px', color: '#EC4899' }} />
                        Nouvelle Réservation
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6B7280',
                            padding: '8px'
                        }}
                    >
                        <Close />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    {/* Informations Client */}
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                            <Person style={{ marginRight: '8px', fontSize: '20px' }} />
                            Informations Client
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={reservationForm.clientNom}
                                    onChange={(e) => setReservationForm({ ...reservationForm, clientNom: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    placeholder="Ex: Jean Dupont"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={reservationForm.clientEmail}
                                    onChange={(e) => setReservationForm({ ...reservationForm, clientEmail: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    placeholder="Ex: client@email.com"
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={reservationForm.clientTelephone}
                                    onChange={(e) => setReservationForm({ ...reservationForm, clientTelephone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    placeholder="Ex: +33123456789"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Prix (€)
                                </label>
                                <input
                                    type="number"
                                    value={reservationForm.prix}
                                    onChange={(e) => setReservationForm({ ...reservationForm, prix: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    placeholder="Ex: 150"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sélection Chambre et Dates */}
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                            📅 Sélection et Dates
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Chambre *
                                </label>
                                <select
                                    value={reservationForm.sousEspaceId}
                                    onChange={(e) => setReservationForm({ ...reservationForm, sousEspaceId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    required
                                >
                                    <option value="">Sélectionnez une chambre</option>
                                    {sousEspaces
                                        .filter(se => se.type === 'chambre' || se.type === 'suite')
                                        .map(sousEspace => (
                                            <option key={sousEspace.id} value={sousEspace.id}>
                                                {sousEspace.numero} - {sousEspace.nom || 'Chambre'}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Statut
                                </label>
                                <select
                                    value={reservationForm.statut}
                                    onChange={(e) => setReservationForm({ ...reservationForm, statut: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="confirmee">Confirmée</option>
                                    <option value="annulee">Annulée</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Date d'arrivée *
                                </label>
                                <input
                                    type="date"
                                    value={reservationForm.dateDebut}
                                    onChange={(e) => setReservationForm({ ...reservationForm, dateDebut: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Date de départ *
                                </label>
                                <input
                                    type="date"
                                    value={reservationForm.dateFin}
                                    onChange={(e) => setReservationForm({ ...reservationForm, dateFin: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Occupants */}
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                            👥 Occupants
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Nombre d'adultes
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={reservationForm.nombreAdultes}
                                    onChange={(e) => setReservationForm({ ...reservationForm, nombreAdultes: parseInt(e.target.value) || 1 })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Nombre d'enfants
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={reservationForm.nombreEnfants}
                                    onChange={(e) => setReservationForm({ ...reservationForm, nombreEnfants: parseInt(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                            📝 Notes et Préférences
                        </label>
                        <textarea
                            value={reservationForm.notes}
                            onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '16px',
                                resize: 'vertical'
                            }}
                            placeholder="Préférences spéciales, allergies, anniversaire, demande particulière..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                background: '#6B7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: isSubmitting ? 0.6 : 1
                            }}
                        >
                            {isSubmitting ? 'Création...' : 'Créer la Réservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationModal;