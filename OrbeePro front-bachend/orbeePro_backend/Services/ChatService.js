// services/chatService.js
const db = require('../config/db'); // ton pool MySQL (mysql2/promise)

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère toutes les conversations d'un utilisateur,
 * enrichies avec les infos de l'autre participant.
 */
const getConversations = async (userId) => {
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.last_message,
       c.last_message_time,
       c.last_sender_id,
       c.read_by_user1,
       c.read_by_user2,
       c.user1_id,
       c.user2_id,
       -- Infos de l'autre utilisateur
       s.id          AS other_id,
       s.nom         AS other_nom,
       s.prenom      AS other_prenom,
       s.profileImage AS other_photo,
       s.role        AS other_role
     FROM conversations c
     JOIN staff s ON s.id = IF(c.user1_id = ?, c.user2_id, c.user1_id)
     WHERE c.user1_id = ? OR c.user2_id = ?
     ORDER BY c.last_message_time DESC`,
    [userId, userId, userId]
  );

  return rows.map((row) => formatConversation(row, userId));
};

/**
 * Crée une conversation entre deux utilisateurs,
 * ou retourne l'existante.
 */
const createOrGetConversation = async (userId1, userId2) => {
  // On trie les IDs pour respecter la contrainte UNIQUE (user1 < user2)
  const [u1, u2] = [Math.min(userId1, userId2), Math.max(userId1, userId2)];

  // Chercher si elle existe déjà
  const [existing] = await db.query(
    `SELECT c.*,
            s.id AS other_id, s.nom AS other_nom, s.prenom AS other_prenom,
            s.profileImage AS other_photo, s.role AS other_role
     FROM conversations c
     JOIN staff s ON s.id = IF(c.user1_id = ?, c.user2_id, c.user1_id)
     WHERE c.user1_id = ? AND c.user2_id = ?`,
    [userId1, u1, u2]
  );

  if (existing.length > 0) {
    return { conversation: formatConversation(existing[0], userId1), created: false };
  }

  // Créer la nouvelle conversation
  const [result] = await db.query(
    `INSERT INTO conversations (user1_id, user2_id, last_message, last_message_time)
     VALUES (?, ?, '', NOW())`,
    [u1, u2]
  );

  const convId = result.insertId;

  // Récupérer avec les infos enrichies
  const [newConv] = await db.query(
    `SELECT c.*,
            s.id AS other_id, s.nom AS other_nom, s.prenom AS other_prenom,
            s.profileImage AS other_photo, s.role AS other_role
     FROM conversations c
     JOIN staff s ON s.id = IF(c.user1_id = ?, c.user2_id, c.user1_id)
     WHERE c.id = ?`,
    [userId1, convId]
  );

  return { conversation: formatConversation(newConv[0], userId1), created: true };
};

/**
 * Marque une conversation comme lue pour un utilisateur.
 */
const markAsRead = async (conversationId, userId) => {
  const [conv] = await db.query(
    'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
    [conversationId]
  );
  if (!conv.length) return;

  const field = conv[0].user1_id === Number(userId) ? 'read_by_user1' : 'read_by_user2';
  await db.query(`UPDATE conversations SET ${field} = 1 WHERE id = ?`, [conversationId]);
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère tous les messages d'une conversation (non supprimés),
 * avec les infos de l'expéditeur et les réactions groupées.
 */
const getMessages = async (conversationId) => {
  // Messages + expéditeur
  const [messages] = await db.query(
    `SELECT
       m.id,
       m.conversation_id,
       m.sender_id,
       m.text,
       m.created_at,
       s.nom         AS sender_nom,
       s.prenom      AS sender_prenom,
       s.profileImage AS sender_photo,
       s.role        AS sender_role
     FROM messages m
     JOIN staff s ON s.id = m.sender_id
     WHERE m.conversation_id = ?
       AND m.deleted_at IS NULL
     ORDER BY m.created_at ASC`,
    [conversationId]
  );

  if (!messages.length) return [];

  // Réactions pour tous ces messages en une seule requête
  const messageIds = messages.map((m) => m.id);
  const [reactions] = await db.query(
    `SELECT message_id, user_id, emoji
     FROM message_reactions
     WHERE message_id IN (?)`,
    [messageIds]
  );

  // Grouper les réactions par message : { messageId: { emoji: [userId, ...] } }
  const reactionsMap = {};
  for (const r of reactions) {
    if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = {};
    if (!reactionsMap[r.message_id][r.emoji]) reactionsMap[r.message_id][r.emoji] = [];
    reactionsMap[r.message_id][r.emoji].push(String(r.user_id));
  }

  return messages.map((m) => formatMessage(m, reactionsMap[m.id] || {}));
};

/**
 * Envoie un message dans une conversation.
 */
const sendMessage = async (conversationId, senderId, text) => {
  if (!text?.trim()) throw new Error('Le message ne peut pas être vide');

  const [result] = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, text, created_at)
     VALUES (?, ?, ?, NOW())`,
    [conversationId, senderId, text.trim()]
  );

  const messageId = result.insertId;

  // Mettre à jour le résumé de la conversation
  const [conv] = await db.query(
    'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
    [conversationId]
  );

  if (conv.length) {
    const isUser1 = conv[0].user1_id === Number(senderId);
    // Marquer comme non-lu pour l'autre participant
    const unreadField = isUser1 ? 'read_by_user2' : 'read_by_user1';
    const readField   = isUser1 ? 'read_by_user1' : 'read_by_user2';

    await db.query(
      `UPDATE conversations
       SET last_message = ?, last_message_time = NOW(),
           last_sender_id = ?, ${readField} = 1, ${unreadField} = 0
       WHERE id = ?`,
      [text.trim(), senderId, conversationId]
    );
  }

  // Récupérer le message créé avec les infos du sender
  const [rows] = await db.query(
    `SELECT m.*, s.nom AS sender_nom, s.prenom AS sender_prenom,
            s.profileImage AS sender_photo, s.role AS sender_role
     FROM messages m
     JOIN staff s ON s.id = m.sender_id
     WHERE m.id = ?`,
    [messageId]
  );

  return formatMessage(rows[0], {});
};

/**
 * Soft-delete d'un message (on ne supprime pas réellement en BDD).
 */
const deleteMessage = async (messageId, userId) => {
  const [rows] = await db.query(
    'SELECT sender_id FROM messages WHERE id = ? AND deleted_at IS NULL',
    [messageId]
  );

  if (!rows.length) throw new Error('Message introuvable');
  if (rows[0].sender_id !== Number(userId)) throw new Error('Non autorisé');

  await db.query(
    'UPDATE messages SET deleted_at = NOW() WHERE id = ?',
    [messageId]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RÉACTIONS
// ─────────────────────────────────────────────────────────────────────────────

const addReaction = async (messageId, userId, emoji) => {
  // INSERT IGNORE évite l'erreur sur la contrainte UNIQUE
  await db.query(
    `INSERT IGNORE INTO message_reactions (message_id, user_id, emoji)
     VALUES (?, ?, ?)`,
    [messageId, userId, emoji]
  );
};

const removeReaction = async (messageId, userId, emoji) => {
  await db.query(
    `DELETE FROM message_reactions
     WHERE message_id = ? AND user_id = ? AND emoji = ?`,
    [messageId, userId, emoji]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILISATEURS
// ─────────────────────────────────────────────────────────────────────────────

const getUsers = async (excludeUserId) => {
  const [rows] = await db.query(
    `SELECT id, nom, prenom, profileImage, role
     FROM staff
     WHERE id != ?
     ORDER BY nom ASC`,
    [excludeUserId]
  );

  return rows.map((u) => ({
    id:              u.id,
    name:            `${u.nom} ${u.prenom || ''}`.trim(),
    profileImageUrl: u.profileImage,
    role:            u.role,
    online:          false, // à implémenter si besoin
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE FORMATAGE
// ─────────────────────────────────────────────────────────────────────────────

const formatConversation = (row, currentUserId) => ({
  id:              row.id,
  lastMessage:     row.last_message,
  lastMessageTime: row.last_message_time,
  lastSenderId:    String(row.last_sender_id),
  // readBy : tableau des IDs qui ont lu (pour compatibilité avec le front)
  readBy: [
    row.read_by_user1 ? String(row.user1_id) : null,
    row.read_by_user2 ? String(row.user2_id) : null,
  ].filter(Boolean),
  otherUser: {
    id:              row.other_id,
    name:            `${row.other_nom} ${row.other_prenom || ''}`.trim(),
    profileImageUrl: row.other_photo,
    role:            row.other_role,
    online:          false,
  },
});

const formatMessage = (row, reactions) => ({
  id:             row.id,
  conversationId: row.conversation_id,
  senderId:       String(row.sender_id),
  text:           row.text,
  createdAt:      row.created_at,
  reactions,
  sender: {
    id:              row.sender_id,
    name:            `${row.sender_nom} ${row.sender_prenom || ''}`.trim(),
    profileImageUrl: row.sender_photo,
    role:            row.sender_role,
  },
});

module.exports = {
  getConversations,
  createOrGetConversation,
  markAsRead,
  getMessages,
  sendMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getUsers,
};