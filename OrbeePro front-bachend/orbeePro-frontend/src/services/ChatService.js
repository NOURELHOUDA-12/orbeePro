import  api from './api';

const ChatService = {

  // ─── Conversations ──────────────────────────────────────────────────────────

  getConversations: async (userId) => {
    const response = await api.get(`/chat/conversations/${userId}`);
    return response.data;
  },

  createOrGetConversation: async (userId1, userId2) => {
    const response = await api.post('/chat/conversations', { userId1, userId2 });
    return response.data;
  },

  // ─── Messages ───────────────────────────────────────────────────────────────

  getMessages: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId, senderId, text) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      senderId,
      text,
    });
    return response.data;
    
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  markAsRead: async (conversationId, userId) => {
    const response = await api.put(`/chat/conversations/${conversationId}/read`, { userId });
    return response.data;
  },

  // ─── Réactions ──────────────────────────────────────────────────────────────

  addReaction: async (messageId, userId, emoji) => {
    const response = await api.post(`/chat/messages/${messageId}/reactions`, { userId, emoji });
    return response.data;
  },

  removeReaction: async (messageId, userId, emoji) => {
    const response = await api.delete(`/chat/messages/${messageId}/reactions`, {
      data: { userId, emoji },
    });
    return response.data;
  },

  // ─── Utilisateurs ───────────────────────────────────────────────────────────

  getUsers: async (currentUserId) => {
    const response = await api.get(`/chat/users?exclude=${currentUserId}`);
    return response.data;
  },
};

export default ChatService;