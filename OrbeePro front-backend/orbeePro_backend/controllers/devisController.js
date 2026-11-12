
const Devis    = require('../Models/Devis');
const nodemailer = require('nodemailer');

// ── Config email ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const devisController = {

  getAll: async (req, res) => {
    try {
      const { fournisseurId, statut } = req.query;
      const items = await Devis.findAll({
        fournisseurId: fournisseurId ? parseInt(fournisseurId) : undefined,
        statut,
      });
      res.json({ success: true, data: items, total: items.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getOne: async (req, res) => {
    try {
      const item = await Devis.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Devis introuvable' });
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const item = await Devis.create(req.body);
      res.status(201).json({ success: true, data: item, message: 'Devis créé avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const item = await Devis.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, message: 'Devis introuvable' });
      res.json({ success: true, data: item, message: 'Devis modifié avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const ok = await Devis.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Devis introuvable' });
      res.json({ success: true, message: 'Devis supprimé avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ── Envoyer le devis par email ────────────────────────────────────────────
  envoyer: async (req, res) => {
    try {
      const devis = await Devis.findById(req.params.id);
      if (!devis) return res.status(404).json({ success: false, message: 'Devis introuvable' });

      // Construire le HTML de l'email
      const lignesHtml = devis.lignes.map(l => `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb">${l.designation}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${l.quantite} ${l.unite}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${l.prixUnitaire.toFixed(3)} TND</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${l.totalLigne.toFixed(3)} TND</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:#3B82F6;color:white;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">Devis ${devis.reference}</h2>
            <p style="margin:4px 0 0">Ref: ${devis.reference}</p>
          </div>
          <div style="padding:20px;border:1px solid #e5e7eb;border-top:none">
            <p>Bonjour,</p>
            <p>Veuillez trouver ci-dessous notre devis :</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Désignation</th>
                  <th style="padding:8px;border:1px solid #e5e7eb">Quantité</th>
                  <th style="padding:8px;border:1px solid #e5e7eb">Prix U.</th>
                  <th style="padding:8px;border:1px solid #e5e7eb">Total</th>
                </tr>
              </thead>
              <tbody>${lignesHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:8px;text-align:right;font-weight:bold">Total HT</td>
                  <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${devis.totalHT.toFixed(3)} TND</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding:8px;text-align:right">TVA (${devis.tauxTva}%)</td>
                  <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${devis.totalTva.toFixed(3)} TND</td>
                </tr>
                <tr style="background:#eff6ff">
                  <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;color:#1d4ed8">Total TTC</td>
                  <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;font-weight:bold;color:#1d4ed8">${devis.totalTTC.toFixed(3)} TND</td>
                </tr>
              </tfoot>
            </table>
            ${devis.notes ? `<p><strong>Notes :</strong> ${devis.notes}</p>` : ''}
            <p style="color:#6b7280;font-size:13px">Cordialement,<br>L'équipe HotelNet</p>
          </div>
        </div>
      `;

      // Envoyer l'email
      await transporter.sendMail({
        from:    `"HotelNet" <${process.env.MAIL_USER}>`,
        to:      devis.fournisseurEmail,
        subject: `Devis ${devis.reference} - HotelNet`,
        html,
      });

      // Mettre à jour le statut
      const updated = await Devis.envoyer(req.params.id);
      res.json({ success: true, data: updated, message: 'Devis envoyé avec succès par email' });

    } catch (err) {
      console.error('envoyer devis:', err);
      res.status(500).json({ success: false, message: `Erreur envoi email: ${err.message}` });
    }
  },

  changerStatut: async (req, res) => {
    try {
      const { statut } = req.body;
      const valides = ['brouillon', 'envoye', 'accepte', 'refuse'];
      if (!valides.includes(statut)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }
      const item = await Devis.changerStatut(req.params.id, statut);
      res.json({ success: true, data: item, message: 'Statut mis à jour' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = devisController;