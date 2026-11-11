export const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2 }) + " dinar";

export const todayFr = () => new Date().toLocaleDateString("fr-FR");

export const STATUT_META = {
  brouillon: { color: "#64748b", bg: "#f1f5f9", label: "Brouillon" },
  envoyé: { color: "#2563eb", bg: "#eff6ff", label: "Envoyé" },
  accepté: { color: "#16a34a", bg: "#f0fdf4", label: "Accepté" },
  refusé: { color: "#dc2626", bg: "#fef2f2", label: "Refusé" },
};

export const printDevis = (devis) => {
  const w = window.open("", "_blank");
  w.document.write(`
    <html>
      <head>
        <title>Devis ${devis.numero}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 20px; }
          .brand { font-size: 28px; font-weight: bold; }
          .supplier { margin: 30px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #3b6fd4; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1e293b; color: white; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .totals { margin-left: auto; width: 250px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #1e293b; margin-top: 10px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">ProDevis</div>
          <div style="text-align:right">
            <strong>${devis.numero}</strong><br/>
            Date: ${todayFr()}
          </div>
        </div>
        <div class="supplier">
          <strong>Fournisseur:</strong><br/>
          ${devis.nom_entreprise}<br/>
          ${devis.email_fournisseur || ""}<br/>
          ${devis.tel_fournisseur || ""}
        </div>
        <table>
          <thead>
            <tr><th>Produit</th><th>Qté</th><th>Prix Unit.</th><th>Total HT</th></tr>
          </thead>
          <tbody>
            ${devis.lignes.map(l => `
              <tr>
                <td>${l.nom_produit}</td>
                <td>${l.quantite}</td>
                <td>${fmt(l.prix_unitaire)}</td>
                <td>${fmt(l.total_ligne)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Sous-total HT</span><span>${fmt(devis.sous_total)}</span></div>
          <div class="total-row"><span>TVA (20%)</span><span>${fmt(devis.tva)}</span></div>
          <div class="total-row grand-total"><span>Total TTC</span><span>${fmt(devis.total_ttc)}</span></div>
        </div>
      </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 500);
};


