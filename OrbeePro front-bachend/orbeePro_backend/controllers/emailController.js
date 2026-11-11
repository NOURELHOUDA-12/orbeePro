
const db = require('../config/db');
const nodemailer = require('nodemailer');

// ─── Configurer votre transporteur SMTP ──────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT), 
  secure: process.env.SMTP_SECURE === 'true', // Force la conversion en booléen
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



// ─── Envoyer ─────────────────────────────────────────────────────────────────
exports.sendEmail = async (req, res) => {
  const { fromUserId, fromAddress, to, cc, bcc, subject, body, bodyType = 'text', templateId } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insérer l'email
    const [result] = await conn.query(
      `INSERT INTO emails (from_user_id, from_address, subject, body, body_type, template_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
      [fromUserId || null, fromAddress, subject, body, bodyType, templateId || null]
    );
    const emailId = result.insertId;

    // 2. Insérer les destinataires
    const recipients = [
      ...(Array.isArray(to)  ? to  : [to]).map(a => [emailId, 'to',  a]),
      ...(cc  ? (Array.isArray(cc)  ? cc  : [cc]).map(a  => [emailId, 'cc',  a]) : []),
      ...(bcc ? (Array.isArray(bcc) ? bcc : [bcc]).map(a => [emailId, 'bcc', a]) : []),
    ];

    for (const [eid, type, address] of recipients) {
      // Chercher si l'adresse correspond à un utilisateur interne
      const [[user]] = await conn.query(`SELECT id FROM staff WHERE email = ?`, [address]);
      await conn.query(
        `INSERT INTO email_recipients (email_id, type, address, user_id) VALUES (?, ?, ?, ?)`,
        [eid, type, address, user?.id || null]
      );
    }

    // 3. Envoyer via SMTP
    await transporter.sendMail({
      from:    fromAddress,
      to:      Array.isArray(to) ? to.join(', ') : to,
      cc:      cc  || undefined,
      bcc:     bcc || undefined,
      subject,
      [bodyType === 'html' ? 'html' : 'text']: body,
    });

    await conn.commit();
    res.json({ success: true, emailId });
  } catch (err) {
    await conn.rollback();
    console.error('sendEmail:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  } finally {
    conn.release();
  }
};

// ─── Boîte de réception ──────────────────────────────────────────────────────
exports.getInbox = async (req, res) => {
  const { userId, page = 1, limit = 30, onlyUnread } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [emails] = await db.query(
      `SELECT
         v.*,
         (SELECT GROUP_CONCAT(filename SEPARATOR ',')
          FROM email_attachments a WHERE a.email_id = v.email_id) AS attachments
       FROM view_inbox v
       WHERE v.recipient_user_id = ?
         AND v.is_deleted = FALSE
         AND v.recipient_type = 'to'
         ${onlyUnread === 'true' ? 'AND v.is_read = FALSE' : ''}
       ORDER BY v.sent_at DESC
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM view_inbox
       WHERE recipient_user_id = ? AND is_deleted = FALSE AND recipient_type = 'to'`,
      [userId]
    );

    const [[{ unreadCount }]] = await db.query(
      `SELECT COUNT(*) AS unreadCount FROM email_recipients
       WHERE user_id = ? AND is_read = FALSE AND is_deleted = FALSE`,
      [userId]
    );

    res.json({ emails, total, unreadCount });
  } catch (err) {
    console.error('getInbox:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── Emails envoyés ──────────────────────────────────────────────────────────
exports.getSent = async (req, res) => {
  const { userId, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [emails] = await db.query(
      `SELECT * FROM view_sent WHERE from_user_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?`,
      [userId, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM emails WHERE from_user_id = ?`, [userId]
    );
    res.json({ emails, total });
  } catch (err) {
    console.error('getSent:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── Détail d'un email ───────────────────────────────────────────────────────
exports.getEmail = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    const [[email]] = await db.query(`SELECT * FROM emails WHERE id = ?`, [id]);
    if (!email) return res.status(404).json({ error: 'Email introuvable' });

    const [recipients]   = await db.query(`SELECT * FROM email_recipients  WHERE email_id = ?`, [id]);
    const [attachments]  = await db.query(`SELECT * FROM email_attachments WHERE email_id = ?`, [id]);

    // Marquer comme lu si destinataire
    await db.query(
      `UPDATE email_recipients SET is_read = TRUE, read_at = NOW()
       WHERE email_id = ? AND user_id = ? AND is_read = FALSE`,
      [id, userId]
    );

    res.json({ email, recipients, attachments });
  } catch (err) {
    console.error('getEmail:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── Marquer lu / non lu ─────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await db.query(
    `UPDATE email_recipients SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true });
};

exports.markAsUnread = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await db.query(
    `UPDATE email_recipients SET is_read = FALSE, read_at = NULL WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true });
};

// ─── Archiver ────────────────────────────────────────────────────────────────
exports.archive = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await db.query(
    `UPDATE email_recipients SET is_archived = TRUE WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true });
};

exports.unarchive = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await db.query(
    `UPDATE email_recipients SET is_archived = FALSE WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true });
};

// ─── Corbeille ───────────────────────────────────────────────────────────────
exports.moveToTrash = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await db.query(
    `UPDATE email_recipients SET is_deleted = TRUE WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true });
};

exports.getTrash = async (req, res) => {
  const { userId } = req.query;
  const [emails] = await db.query(
    `SELECT * FROM view_inbox WHERE recipient_user_id = ? AND is_deleted = TRUE ORDER BY sent_at DESC`,
    [userId]
  );
  res.json({ emails });
};

// ─── Nombre de non lus ───────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  const { userId } = req.query;
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) AS count FROM email_recipients
     WHERE user_id = ? AND is_read = FALSE AND is_deleted = FALSE`,
    [userId]
  );
  res.json({ count });
};

// ─── Templates ───────────────────────────────────────────────────────────────
exports.getTemplates = async (req, res) => {
  const [templates] = await db.query(`SELECT * FROM email_templates ORDER BY created_at DESC`);
  res.json(templates);
};

exports.createTemplate = async (req, res) => {
  const { name, category, subject, body, createdBy } = req.body;
  const [result] = await db.query(
    `INSERT INTO email_templates (name, category, subject, body, created_by) VALUES (?, ?, ?, ?, ?)`,
    [name, category, subject, body, createdBy || null]
  );
  const [[template]] = await db.query(`SELECT * FROM email_templates WHERE id = ?`, [result.insertId]);
  res.json(template);
};

exports.updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { name, category, subject, body } = req.body;
  await db.query(
    `UPDATE email_templates SET name = ?, category = ?, subject = ?, body = ? WHERE id = ?`,
    [name, category, subject, body, id]
  );
  const [[template]] = await db.query(`SELECT * FROM email_templates WHERE id = ?`, [id]);
  res.json(template);
};

exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  await db.query(`DELETE FROM email_templates WHERE id = ?`, [id]);
  res.json({ success: true });
};