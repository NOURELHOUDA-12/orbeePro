import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle 
} from 'lucide-react';
import { fmt, STATUT_META, printDevis } from './devisUtils';
import styles from './devis.module.css';
import { Diversity1 } from '@mui/icons-material';

const DevisDetail = ({ devis, onBack, onShare }) => {

  const meta = STATUT_META[devis.statut] || STATUT_META.brouillon;


const user = localStorage.getItem('userRole');

console.log("lignes:", devis.lignes, typeof devis.lignes);

  return (
    <div className="fade-in">


      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center',background: "#fff", padding: "16px 24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div onClick={onBack} className={styles.cancelButton} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
        </div> 
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => printDevis(devis)} className={styles.addButton} style={{ margin: 0, width: 'auto', borderStyle: 'solid', display: 'flex', gap: '8px', }}>
            <Printer size={18} /> Imprimer
          </button>
         
           <button onClick={() => onShare(devis)} className={styles.submitButton}>
            <Share2 size={18} /> Partager
          </button>
        </div>
      </div>

      <div className={styles.card}>
        {/* Header du Devis */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '24px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{devis.numero}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Statut actuel :</span>
              <span style={{ background: meta.bg, color: meta.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {meta.label}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Émis le</div>
            <div style={{ fontWeight: 'bold' }}>{new Date(devis.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* Grille d'infos */}
        <div className={styles.grid} style={{ marginBottom: '32px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
            <div className={styles.sectionTitle} style={{ fontSize: '14px', marginBottom: '8px' }}><User size={16} /> Fournisseur</div>
            <div style={{ fontWeight: 'bold' }}>{devis.nom_entreprise}</div>
            <div style={{ color: '#64748b', fontSize: '13px' }}>{devis.email_fournisseur}</div>
            <div style={{ color: '#64748b', fontSize: '13px' }}>{devis.tel_fournisseur}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
            <div className={styles.sectionTitle} style={{ fontSize: '14px', marginBottom: '8px' }}><Calendar size={16} /> Validité</div>
            <div style={{ fontWeight: 'bold' }}>{devis.validite_jours} Jours</div>
            <div style={{ color: '#64748b', fontSize: '13px' }}>À compter de la date d'émission</div>
          </div>
        </div>

        {/* Table des articles */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>PRODUIT</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>QTÉ</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>PRIX UNIT.</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>TOTAL HT</th>
              </tr>
            </thead>
            <tbody>
              {/* {devis.lignes.map((l, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>{l.nom_produit}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{l.quantite}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{fmt(l.prix_unitaire)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(l.total_ligne)}</td>
                </tr>
              ))} */}

              {Array.isArray(devis.lignes) ? (
  devis.lignes.map((l, i) => (
    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
      <td style={{ padding: '12px' }}>{l.nom_produit}</td>
      <td style={{ padding: '12px', textAlign: 'center' }}>{l.quantite}</td>
      <td style={{ padding: '12px', textAlign: 'right' }}>{fmt(l.prix_unitaire)}</td>
      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(l.total_ligne)}</td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
      Aucune ligne disponible
    </td>
  </tr>
)}
            </tbody>
          </table>
        </div>

        {/* Résumé financier */}
        {/* <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
              <span>Sous-total HT</span>
              <span>{fmt(devis.sous_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b' }}>
              <span>TVA (20%)</span>
              <span>{fmt(devis.tva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #e2e8f0', fontWeight: 'bold', fontSize: '18px', color: '#3b6fd4' }}>
              <span>Total TTC</span>
              <span>{fmt(devis.total_ttc)}</span>
            </div>
          </div>
        </div> */}

        {devis.notes && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>NOTES :</div>
            <div style={{ fontSize: '14px', color: '#78350f' }}>{devis.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevisDetail;