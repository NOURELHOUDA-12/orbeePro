import React from 'react';
import { fmt, STATUT_META } from './devisUtils';

const DevisList = ({ devis, onView, onDelete }) => {
const safeDevis = Array.isArray(devis) ? devis : [];



  return (   

    <div className="fade-in">

      

      {/* Tableau */}
      <div style={{ background: "#fff", padding: 24, borderRadius: 20, border: "1px solid #e2e8f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>

            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Numéro</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Fournisseur</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Total TTC</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Statut</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
            </tr>
            
          </thead>
          <tbody>
            {safeDevis.map(d => (
              <tr key={d.id} onClick={() => onView(d)} style={{ cursor: 'pointer', borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: 12, fontWeight: 700, color: "#3b6fd4" }}>{d.numero}</td>
                <td style={{ padding: 12 }}>{d.nom_entreprise}</td>
                <td style={{ padding: 12, fontWeight: 700 }}>{fmt(d.total_ttc)}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: STATUT_META[d.statut]?.bg }}>
                    {STATUT_META[d.statut]?.label}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(d.id); }} style={{ color: 'red', border: 'none', background: 'none' }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DevisList;