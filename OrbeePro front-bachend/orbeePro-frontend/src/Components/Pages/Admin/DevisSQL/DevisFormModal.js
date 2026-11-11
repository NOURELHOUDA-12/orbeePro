import React, { useState } from 'react';
import { 
  FilePlus, 
  Building2, 
  Trash2, 
  X, 
  Send, 
  CheckCircle2, 
  Info, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  Calculator
} from 'lucide-react';
import { fmt } from './devisUtils';
import DevisService from '../../../../services/DevisService';
import styles from './devis.module.css';


const DevisFormModal = ({ 
  showAddModal, 
  onClose,
  onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [form, setForm] = useState({
    nom_entreprise: '',
    email_fournisseur: '',
    tel_fournisseur: '',
    validite_jours: 30,
    notes: ''
  });

  const [lignes, setLignes] = useState([
    { nom_produit: '', quantite: 1, prix_unitaire: 0, remise: 0, total_ligne: 0 }
  ]);

  // --- Logique de calcul ---
  const updateLigne = (index, field, value) => {
    const newLignes = [...lignes];
    const ligne = { ...newLignes[index], [field]: value };

    const qte = parseFloat(ligne.quantite) || 0;
    const pu = parseFloat(ligne.prix_unitaire) || 0;
    const rem = parseFloat(ligne.remise) || 0;
    
    ligne.total_ligne = +(qte * pu * (1 - rem / 100)).toFixed(2);
    newLignes[index] = ligne;
    setLignes(newLignes);
  };

  const sousTotal = lignes.reduce((s, l) => s + l.total_ligne, 0);
  const tva = sousTotal * 0.20;
  const totalTTC = sousTotal + tva;

  // --- Actions ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nom_entreprise) return alert("Le nom de l'entreprise est requis.");
    
    setIsSubmitting(true);
    try {
      const devisComplet = {
        ...form,
        lignes,
        sous_total: sousTotal,
        tva: tva,
        total_ttc: totalTTC
      };

      const result = await DevisService.create(devisComplet);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          closeAndReset();
          onSuccess();
        }, 2500);
      }
    } catch (error) {
      alert("Erreur : " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAndReset = () => {
    onClose();
    setForm({ nom_entreprise: '', email_fournisseur: '', tel_fournisseur: '', validite_jours: 30, notes: '' });
    setLignes([{ nom_produit: '', quantite: 1, prix_unitaire: 0, remise: 0, total_ligne: 0 }]);
    setShowSuccess(false);
  };

  if (!showAddModal) return null;

  

  const ajouterLigne = () => {
    setLignes([
      ...lignes, 
      { nom_produit: '', quantite: 1, prix_unitaire: 0, remise: 0, total_ligne: 0 }
    ]);
  };

  const supprimerLigne = (index) => {
    if (lignes.length > 1) {
      const newLignes = lignes.filter((_, i) => i !== index);
      setLignes(newLignes);
    } else {
      alert("Le devis doit contenir au moins un article.");
    }
  };

return (
    <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.modalHeader}>
                <div className={styles.headerTitle}>
                    <div className={styles.headerIcon}>
                        <FilePlus size={32} />
                    </div>
                    <div>
                        <h1 style={{fontSize: '1.8rem', fontWeight: '800'}}>Nouveau Devis</h1>
                        <p style={{opacity: 0.8, fontSize: '0.9rem'}}>Édition d'une proposition commerciale</p>
                    </div>
                </div>
                <button onClick={onClose} style={{position:'absolute', right: '30px', top: '40px', background:'none', border:'none', color:'white', cursor:'pointer'}}>
                    <X size={28} />
                </button>
            </div>

            <div className={styles.formBody}>
                <form onSubmit={handleSave}>
                    {/* Section Fournisseur */}
                    <div className={styles.formSection}>
                        <label className={styles.labelPremium}><Building2 size={18}/> Coordonnées Fournisseur</label>
                        <div className={styles.grid}>
                            <input className={styles.inputPremium} placeholder="Nom Entreprise *" required value={form.nom_entreprise} onChange={e => setForm({...form, nom_entreprise: e.target.value})} />
                            <input className={styles.inputPremium} placeholder="Email" type="email" value={form.email_fournisseur} onChange={e => setForm({...form, email_fournisseur: e.target.value})} />
                            <input className={styles.inputPremium} placeholder="Téléphone / WhatsApp" value={form.tel_fournisseur} onChange={e => setForm({...form, tel_fournisseur: e.target.value})} />
                        </div>
                    </div>

                    {/* Section Items */}
                    <div className={styles.formSection}>
                        <label className={styles.labelPremium}><Calculator size={18}/> Détails des articles</label>
                        {lignes.map((l, i) => (
                            <div key={i} className={styles.itemRow}>
                                <input className={styles.inputPremium} placeholder="Désignation du produit" value={l.nom_produit} onChange={e => updateLigne(i, "nom_produit", e.target.value)} />
                                <input className={styles.inputPremium} style={{textAlign:'center'}} type="number" value={l.quantite} onChange={e => updateLigne(i, "quantite", e.target.value)} />
                                <input className={styles.inputPremium} type="number" value={l.prix_unitaire} onChange={e => updateLigne(i, "prix_unitaire", e.target.value)} />
                                <div style={{fontWeight:'800', color:'#3b82f6', textAlign:'right', paddingRight:'10px'}}>{fmt(l.total_ligne)}</div>
                                <button type="button" onClick={() => supprimerLigne(i)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><Trash2 size={20}/></button>
                            </div>
                        ))}
                        <button type="button" onClick={ajouterLigne} className={styles.btnAddItem}>+ Ajouter un article</button>
                    </div>

                    {/* Footer / Totaux */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'3rem'}}>
                        {/* <div className={styles.summaryCard}>
                            <div className={styles.summaryRow}><span>Sous-total HT</span><span>{fmt(sousTotal)}</span></div>
                            <div className={styles.summaryRow}><span>TVA (20%)</span><span>{fmt(tva)}</span></div>
                            <div className={styles.summaryTotal}><span>TOTAL TTC</span><span>{fmt(totalTTC)}</span></div>
                        </div>
                         */}
                        <div style={{display:'flex', gap:'15px'}}>
                            <button type="button" onClick={onClose} className={styles.btnAddItem} style={{width:'auto', borderStyle:'solid', padding:'14px 25px'}}>Annuler</button>
                            <button type="submit" className={styles.btnPrimary}>
                                <Send size={20} /> Valider le Devis
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
);
};

export default DevisFormModal;