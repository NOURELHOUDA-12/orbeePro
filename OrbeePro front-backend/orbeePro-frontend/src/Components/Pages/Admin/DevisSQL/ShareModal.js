import React, { useState } from 'react';
import { X, MessageCircle, Mail, Send, CheckCircle } from 'lucide-react';
import DevisService from '../../../../services/DevisService';
import { fmt } from './devisUtils';
import styles from './devis.module.css';

const ShareModal = ({ devis, onClose }) => {
    const [isSending, setIsSending] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null); // 'idle' | 'sending' | 'success'

   

    // --- Envoi Email via Backend (SMTP) ---
    const handleEmailSend = async () => {
        if (!devis.email_fournisseur) {
            alert("Ce fournisseur n'a pas d'adresse email renseignée.");
            return;
        }

        setIsSending(true);
        setEmailStatus('sending');
        try {
            // On envoie l'objet devis complet au backend
            const response = await DevisService.sendByEmail(devis);
            
            if (response.success) {
                setEmailStatus('success');
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            alert("Erreur lors de l'envoi de l'email via le serveur.");
            setEmailStatus('idle');
        } finally {
            setIsSending(false);
        }
    };


    const sendWhatsapp = () => {
    // 1. Nettoyer le numéro de téléphone (garder uniquement les chiffres)
    const phone = devis.tel_fournisseur?.replace(/\D/g, '');

    if (!phone) {
        alert("Le numéro de téléphone du fournisseur est manquant ou invalide.");
        return;
    }

    // 2. Préparer le message formaté (WhatsApp supporte le gras avec *)
    const message = encodeURIComponent(
        `*OFFRE COMMERCIALE - OrbeePro*\n\n` +
        `Bonjour,\n` +
        `Veuillez trouver ci-dessous les détails de notre commande pour *${devis.nom_entreprise}* :\n\n` +
        `*Référence :* ${devis.numero}\n` +
        `*Montant Total :* ${devis.total_ttc} MAD\n\n` +
        `*Détails des articles :*\n` +
        devis.lignes.map(l => `- ${l.nom_produit} (x${l.quantite})`).join('\n') +
        `\n\nMerci de nous confirmer la réception et de nous envoyer votre facture proforma.`
    );

    // 3. Ouvrir WhatsApp (API universelle)
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
};
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
                <div className={styles.modalHeader} style={{ padding: '1.5rem', borderRadius: '28px 28px 0 0' }}>
                    <div className={styles.headerTitle}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Partager le Devis</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.formBody} style={{ padding: '2rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Référence : <strong>{devis.numero}</strong> pour <strong>{devis.nom_entreprise}</strong>
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Option WhatsApp */}
                        <button onClick={sendWhatsapp} className={styles.btnAddItem} style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            gap: '10px', borderStyle: 'solid', borderColor: '#25D366', color: '#128C7E' 
                        }}>
                            <MessageCircle size={20} /> Partager via WhatsApp
                        </button>

                        {/* Option Email SMTP */}
                        <button 
                            onClick={handleEmailSend} 
                            disabled={isSending}
                            className={styles.btnPrimary} 
                            style={{ justifyContent: 'center', background: emailStatus === 'success' ? '#10B981' : '#3b82f6' }}
                        >
                            {emailStatus === 'sending' ? (
                                <>Envoi en cours...</>
                            ) : emailStatus === 'success' ? (
                                <><CheckCircle size={20} /> Email Envoyé !</>
                            ) : (
                                <><Mail size={20} /> Envoyer par Email au fournisseur</>
                            )}
                        </button>
                    </div>

                    {devis.email_fournisseur && (
                        <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                            Destinataire : {devis.email_fournisseur}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;