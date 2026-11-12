// routes/emailRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/emailController');

// Envoi
router.post  ('/send',                          ctrl.sendEmail);

// Historique
router.get   ('/inbox',                         ctrl.getInbox);
router.get   ('/sent',                          ctrl.getSent);
router.get   ('/trash',                         ctrl.getTrash);
router.get   ('/unread-count',                  ctrl.getUnreadCount);
router.get   ('/:id',                           ctrl.getEmail);

// Actions sur un destinataire
router.patch ('/recipients/:id/read',           ctrl.markAsRead);
router.patch ('/recipients/:id/unread',         ctrl.markAsUnread);
router.patch ('/recipients/:id/archive',        ctrl.archive);
router.patch ('/recipients/:id/unarchive',      ctrl.unarchive);
router.patch ('/recipients/:id/trash',          ctrl.moveToTrash);

// Templates
router.get   ('/templates',                     ctrl.getTemplates);
router.post  ('/templates',                     ctrl.createTemplate);
router.put   ('/templates/:id',                 ctrl.updateTemplate);
router.delete('/templates/:id',                 ctrl.deleteTemplate);

module.exports = router;

// ─── Dans app.js ─────────────────────────────────────────────────────────────
// const emailRoutes = require('./routes/emailRoutes');
// app.use('/emails', emailRoutes);