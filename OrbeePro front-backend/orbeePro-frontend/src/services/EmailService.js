import axios from 'axios';
import { API_URL } from '../constants';

const BASE = `${API_URL}/emails`;

const EmailService = {

  // ─── Envoyer un email ────────────────────────────────────────────────────────
  async sendEmail({ fromUserId, fromAddress, to, cc, bcc, subject, body, bodyType = 'text', templateId = null }) {
    const res = await axios.post(`${BASE}/send`, {
      fromUserId, fromAddress, to, cc, bcc, subject, body, bodyType, templateId,
    });
    return res.data; // { success, emailId }
  },

  // ─── Boîte de réception ──────────────────────────────────────────────────────
  async getInbox(userId, { page = 1, limit = 30, onlyUnread = false } = {}) {
    const res = await axios.get(`${BASE}/inbox`, {
      params: { userId, page, limit, onlyUnread },
    });
    return res.data; // { emails: [...], total, unreadCount }
  },

  // ─── Emails envoyés ──────────────────────────────────────────────────────────
  async getSent(userId, { page = 1, limit = 30 } = {}) {
    const res = await axios.get(`${BASE}/sent`, {
      params: { userId, page, limit },
    });

    return res.data; // { emails: [...], total }
  },

  // ─── Détail d'un email ───────────────────────────────────────────────────────
  async getEmail(emailId, userId) {
    const res = await axios.get(`${BASE}/${emailId}`, { params: { userId } });
    return res.data; // { email, recipients, attachments }
  },

  // ─── Marquer comme lu ────────────────────────────────────────────────────────
  async markAsRead(recipientId, userId) {
    const res = await axios.patch(`${BASE}/recipients/${recipientId}/read`, { userId });
    return res.data;
  },

  async markAsUnread(recipientId, userId) {
    const res = await axios.patch(`${BASE}/recipients/${recipientId}/unread`, { userId });
    return res.data;
  },

  // ─── Archiver ────────────────────────────────────────────────────────────────
  async archive(recipientId, userId) {
    const res = await axios.patch(`${BASE}/recipients/${recipientId}/archive`, { userId });
    return res.data;
  },

  async unarchive(recipientId, userId) {
    const res = await axios.patch(`${BASE}/recipients/${recipientId}/unarchive`, { userId });
    return res.data;
  },

  // ─── Corbeille ───────────────────────────────────────────────────────────────
  async moveToTrash(recipientId, userId) {
    const res = await axios.patch(`${BASE}/recipients/${recipientId}/trash`, { userId });
    return res.data;
  },

  async getTrash(userId) {
    const res = await axios.get(`${BASE}/trash`, { params: { userId } });
    return res.data;
  },

  // ─── Nombre de non lus ───────────────────────────────────────────────────────
  async getUnreadCount(userId) {
    const res = await axios.get(`${BASE}/unread-count`, { params: { userId } });
    return res.data; // { count }
  },

  // ─── Templates ───────────────────────────────────────────────────────────────
  async getTemplates() {
    const res = await axios.get(`${BASE}/templates`);
    return res.data;
  },

  async createTemplate({ name, category, subject, body, createdBy }) {
    const res = await axios.post(`${BASE}/templates`, { name, category, subject, body, createdBy });
    return res.data;
  },

  async updateTemplate(id, { name, category, subject, body }) {
    const res = await axios.put(`${BASE}/templates/${id}`, { name, category, subject, body });
    return res.data;
  },

  async deleteTemplate(id) {
    const res = await axios.delete(`${BASE}/templates/${id}`);
    return res.data;
  },
};

export default EmailService;