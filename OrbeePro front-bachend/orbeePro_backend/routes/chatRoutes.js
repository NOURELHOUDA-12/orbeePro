// routes/chatRoutes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/ChatController');
const auth       = require('../middlewares/authmidelware'); 

// ─── Conversations ────────────────────────────────────────────────────────────
// GET  /api/chat/conversations/:userId        → liste des conversations
// POST /api/chat/conversations                → créer ou récupérer une conversation
// PUT  /api/chat/conversations/:id/read       → marquer comme lu

router.get( '/conversations/:userId',     auth, controller.getConversations);
router.post('/conversations',             auth, controller.createOrGetConversation);
router.put( '/conversations/:conversationId/read', auth, controller.markAsRead);

// ─── Messages ─────────────────────────────────────────────────────────────────
// GET    /api/chat/conversations/:id/messages → liste des messages
// POST   /api/chat/conversations/:id/messages → envoyer un message
// DELETE /api/chat/messages/:id               → supprimer un message

router.get(   '/conversations/:conversationId/messages', auth, controller.getMessages);
router.post(  '/conversations/:conversationId/messages', auth, controller.sendMessage);
router.delete('/messages/:messageId',                    auth, controller.deleteMessage);

// ─── Réactions ────────────────────────────────────────────────────────────────
// POST   /api/chat/messages/:id/reactions     → ajouter une réaction
// DELETE /api/chat/messages/:id/reactions     → retirer une réaction

router.post(  '/messages/:messageId/reactions', auth, controller.addReaction);
router.delete('/messages/:messageId/reactions', auth, controller.removeReaction);

// ─── Utilisateurs ─────────────────────────────────────────────────────────────
// GET /api/chat/users?exclude=:id             → liste des users (sauf soi-même)

router.get('/users', auth, controller.getUsers);

module.exports = router;