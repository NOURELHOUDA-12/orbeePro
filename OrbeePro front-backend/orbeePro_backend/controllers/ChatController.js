// controllers/chatController.js
const chatService = require('../Services/ChatService');

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await chatService.getConversations(userId);
    res.json(data);
  } catch (error) {
    console.error('getConversations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.createOrGetConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    if (!userId1 || !userId2) {
      return res.status(400).json({ success: false, message: 'userId1 et userId2 requis' });
    }
    const result = await chatService.createOrGetConversation(userId1, userId2);
    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    console.error('createOrGetConversation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    await chatService.markAsRead(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('markAsRead:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const data = await chatService.getMessages(conversationId);
    res.json(data);
  } catch (error) {
    console.error('getMessages:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, text } = req.body;

    if (!senderId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'senderId et text requis' });
    }

    const message = await chatService.sendMessage(conversationId, senderId, text);
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('sendMessage:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    await chatService.deleteMessage(messageId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteMessage:', error);
    const status = error.message === 'Non autorisé' ? 403 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RÉACTIONS
// ─────────────────────────────────────────────────────────────────────────────

exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ success: false, message: 'userId et emoji requis' });
    }

    await chatService.addReaction(messageId, userId, emoji);
    res.json({ success: true });
  } catch (error) {
    console.error('addReaction:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ success: false, message: 'userId et emoji requis' });
    }

    await chatService.removeReaction(messageId, userId, emoji);
    res.json({ success: true });
  } catch (error) {
    console.error('removeReaction:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILISATEURS
// ─────────────────────────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const { exclude } = req.query;
    if (!exclude) {
      return res.status(400).json({ success: false, message: 'Paramètre exclude requis' });
    }
    const users = await chatService.getUsers(exclude);
    res.json(users);
  } catch (error) {
    console.error('getUsers:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};