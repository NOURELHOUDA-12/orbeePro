const PDFDocument = require('pdfkit');

/**
 * Génère un PDF de commande et le pipe dans res (Express Response)
 */
function generateCommandePDF(commande, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // ── Headers HTTP ──────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="commande-${commande.reference}.pdf"`
  );
  doc.pipe(res);

  // ── Couleurs ──────────────────────────────────────────────────────────────
  const COLOR_PRIMARY  = '#1D4ED8';
  const COLOR_DARK     = '#1F2937';
  const COLOR_GRAY     = '#6B7280';
  const COLOR_LIGHT    = '#F3F4F6';
  const COLOR_BORDER   = '#E5E7EB';

  const pageW   = doc.page.width  - 100; // largeur utile (marges 50 de chaque côté)
  let   y       = 50;

  // ── HEADER : logo + titre ─────────────────────────────────────────────────
  // Logo (si le fichier existe)
  const logoPath = `${__dirname}/../uploads/logo.png`;
  const fs = require('fs');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, y, { height: 50 });
  }

  doc
    .fontSize(22).fillColor(COLOR_PRIMARY).font('Helvetica-Bold')
    .text('COMMANDE FOURNISSEUR', 200, y, { align: 'right', width: pageW - 150 });

  doc
    .fontSize(11).fillColor(COLOR_GRAY).font('Helvetica')
    .text(`Référence : ${commande.reference}`, 200, y + 28, { align: 'right', width: pageW - 150 });

  y += 70;
  doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor(COLOR_BORDER).lineWidth(1).stroke();
  y += 16;

  // ── INFOS : fournisseur à gauche, commande à droite ───────────────────────
  const col1X = 50;
  const col2X = 310;

  // — Bloc fournisseur —
  doc.fontSize(9).fillColor(COLOR_GRAY).font('Helvetica-Bold')
     .text('FOURNISSEUR', col1X, y);
  y += 14;

  doc.fontSize(11).fillColor(COLOR_DARK).font('Helvetica-Bold')
     .text(commande.fournisseurNom || '—', col1X, y);
  y += 14;

  if (commande.fournisseurEmail) {
    doc.fontSize(10).fillColor(COLOR_GRAY).font('Helvetica')
       .text(commande.fournisseurEmail, col1X, y);
    y += 13;
  }
  if (commande.fournisseurTelephone) {
    doc.fontSize(10).fillColor(COLOR_GRAY).font('Helvetica')
       .text(commande.fournisseurTelephone, col1X, y);
    y += 13;
  }
  if (commande.fournisseurAdresse) {
    doc.fontSize(10).fillColor(COLOR_GRAY).font('Helvetica')
       .text(commande.fournisseurAdresse, col1X, y, { width: 230 });
    y += 26;
  }

  // — Bloc commande (colonne droite, même niveau) —
  const infoY = y - 80; // on remonte pour aligner avec le début du bloc fournisseur
  doc.fontSize(9).fillColor(COLOR_GRAY).font('Helvetica-Bold')
     .text('DÉTAILS DE LA COMMANDE', col2X, infoY);

  const rows = [
    ['Statut',      commande.statut.charAt(0).toUpperCase() + commande.statut.slice(1)],
    ['Date',        new Date(commande.createdAt).toLocaleDateString('fr-FR')],
    ['Envoyée le',  commande.dateEnvoi ? new Date(commande.dateEnvoi).toLocaleDateString('fr-FR') : '—'],
  ];
  rows.forEach(([label, value], i) => {
    const rowY = infoY + 16 + i * 16;
    doc.fontSize(9).fillColor(COLOR_GRAY).font('Helvetica')
       .text(label, col2X, rowY);
    doc.fontSize(9).fillColor(COLOR_DARK).font('Helvetica-Bold')
       .text(value, col2X + 80, rowY);
  });

  y += 20;
  doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor(COLOR_BORDER).lineWidth(1).stroke();
  y += 20;

  // ── TABLEAU DES LIGNES ────────────────────────────────────────────────────
  const colW = {
    num:   30,
    desc:  pageW - 30 - 70 - 80 - 70,
    qte:   70,
    prix:  80,
    total: 70,
  };

  // En-tête tableau
  doc.rect(50, y, pageW, 22).fill(COLOR_PRIMARY);
  const headers = [
    { text: '#',           x: 50,                                              align: 'center', w: colW.num  },
    { text: 'Désignation', x: 50 + colW.num,                                   align: 'left',   w: colW.desc },
    { text: 'Qté',         x: 50 + colW.num + colW.desc,                       align: 'center', w: colW.qte  },
    { text: 'Prix unit.',  x: 50 + colW.num + colW.desc + colW.qte,            align: 'right',  w: colW.prix },
    { text: 'Total',       x: 50 + colW.num + colW.desc + colW.qte + colW.prix, align: 'right', w: colW.total},
  ];
  headers.forEach(h => {
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text(h.text, h.x + 4, y + 7, { width: h.w - 8, align: h.align });
  });
  y += 22;

  // Lignes
  (commande.lignes || []).forEach((l, i) => {
    const rowH  = 22;
    const bgColor = i % 2 === 0 ? '#FFFFFF' : COLOR_LIGHT;
    doc.rect(50, y, pageW, rowH).fill(bgColor);

    const cells = [
      { text: String(i + 1),                  x: 50,                                               align: 'center', w: colW.num  },
      { text: l.designation,                  x: 50 + colW.num,                                    align: 'left',   w: colW.desc },
      { text: `${l.quantite} ${l.unite}`,     x: 50 + colW.num + colW.desc,                        align: 'center', w: colW.qte  },
      { text: `${l.prixUnitaire.toFixed(3)}`, x: 50 + colW.num + colW.desc + colW.qte,             align: 'right',  w: colW.prix },
      { text: `${l.totalLigne.toFixed(3)}`,   x: 50 + colW.num + colW.desc + colW.qte + colW.prix, align: 'right',  w: colW.total},
    ];
    cells.forEach(c => {
      doc.fontSize(9).fillColor(COLOR_DARK).font('Helvetica')
         .text(c.text, c.x + 4, y + 7, { width: c.w - 8, align: c.align });
    });

    // bordure basse
    doc.moveTo(50, y + rowH).lineTo(50 + pageW, y + rowH)
       .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
    y += rowH;
  });

  y += 20;

  // ── TOTAUX ────────────────────────────────────────────────────────────────
  const totalBoxW = 220;
  const totalBoxX = 50 + pageW - totalBoxW;

  const totaux = [
    ['Total HT',            `${commande.totalHT.toFixed(3)} TND`],
    [`TVA (${commande.tauxTva}%)`, `${commande.totalTva.toFixed(3)} TND`],
  ];
  totaux.forEach(([label, value]) => {
    doc.fontSize(10).fillColor(COLOR_GRAY).font('Helvetica')
       .text(label, totalBoxX, y, { width: totalBoxW / 2 });
    doc.fontSize(10).fillColor(COLOR_DARK).font('Helvetica-Bold')
       .text(value, totalBoxX + totalBoxW / 2, y, { width: totalBoxW / 2, align: 'right' });
    y += 18;
  });

  // Total TTC encadré
  doc.rect(totalBoxX, y, totalBoxW, 28).fill(COLOR_PRIMARY);
  doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
     .text('Total TTC', totalBoxX + 10, y + 8, { width: totalBoxW / 2 });
  doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
     .text(`${commande.totalTTC.toFixed(3)} TND`, totalBoxX + totalBoxW / 2, y + 8,
           { width: totalBoxW / 2 - 10, align: 'right' });
  y += 40;

  // ── NOTES ─────────────────────────────────────────────────────────────────
  if (commande.notes) {
    doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor(COLOR_BORDER).lineWidth(1).stroke();
    y += 14;
    doc.fontSize(9).fillColor(COLOR_GRAY).font('Helvetica-Bold').text('NOTES', 50, y);
    y += 13;
    doc.fontSize(9).fillColor(COLOR_DARK).font('Helvetica')
       .text(commande.notes, 50, y, { width: pageW });
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.fontSize(8).fillColor(COLOR_GRAY).font('Helvetica')
     .text(
       `Document généré le ${new Date().toLocaleDateString('fr-FR')} — OrbeePro`,
       50, doc.page.height - 40,
       { width: pageW, align: 'center' }
     );

  doc.end();
}

module.exports = { generateCommandePDF };