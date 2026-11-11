// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ChatService from '../../../services/ChatService';
import { BASE_URL } from '../../../constants';

const POLL_INTERVAL = 3000;

const avatarUri = (user) =>
  user?.profileImageUrl
    ? `${BASE_URL}${user.profileImageUrl}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '?')}&background=3b82f6&color=fff`;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// ─── Online Dot ───────────────────────────────────────────────────────────────
const OnlineDot = ({ online }) =>
  online ? <span style={styles.onlineDot} /> : null;

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message, currentUserId, onLongPress, onReact, showMenu, onDeleteMessage }) => {
  const isOwn = String(message.senderId) === String(currentUserId);
  const reactions = message.reactions || {};
  const reactionKeys = Object.keys(reactions);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onLongPress(null);
      }
    };
    if (showMenu === message.id) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, message.id]);

  return (
    <div style={{ ...styles.msgRow, ...(isOwn ? styles.msgRowOwn : styles.msgRowOther) }}>
      {!isOwn && (
        <img src={avatarUri(message.sender)} alt="" style={styles.msgAvatar} />
      )}
      <div style={{ maxWidth: '72%', position: 'relative' }}>
        <div
          style={{
            ...styles.bubble,
            ...(isOwn ? styles.bubbleOwn : styles.bubbleOther),
            cursor: 'context-menu',
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onLongPress(showMenu === message.id ? null : message.id);
          }}
        >
          <span style={{ ...styles.bubbleText, ...(isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther) }}>
            {message.text}
          </span>
          <span style={{ ...styles.bubbleTime, ...(isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther) }}>
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Reactions */}
        {reactionKeys.length > 0 && (
          <div style={{ ...styles.reactionsRow, ...(isOwn ? { justifyContent: 'flex-end' } : {}) }}>
            {reactionKeys.map((emoji) => (
              <button
                key={emoji}
                style={styles.reactionBadge}
                onClick={() => onReact(message.id, emoji)}
              >
                <span style={styles.reactionEmoji}>{emoji}</span>
                {reactions[emoji].length > 1 && (
                  <span style={styles.reactionCount}>{reactions[emoji].length}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Context menu */}
        {showMenu === message.id && (
          <div
            ref={menuRef}
            style={{ ...styles.menuPopup, ...(isOwn ? styles.menuPopupOwn : styles.menuPopupOther) }}
          >
            {['❤️', '😂', '😲', '😢', '😡'].map((emoji) => (
              <button
                key={emoji}
                style={styles.menuEmoji}
                onClick={() => onReact(message.id, emoji)}
              >
                {emoji}
              </button>
            ))}
            {isOwn && (
              <button
                style={styles.menuDelete}
                onClick={() => onDeleteMessage(message.id)}
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Conversation Item ────────────────────────────────────────────────────────
const ConvItem = ({ conv, currentUserId, isSelected, onPress }) => {
  const other = conv.otherUser;
  const isUnread = !conv.readBy?.includes(String(currentUserId));

  return (
    <button
      style={{
        ...styles.convItem,
        ...(isSelected ? styles.convItemActive : {}),
      }}
      onClick={onPress}
    >
      <div style={styles.convItemInner}>
        <div style={{ position: 'relative', marginRight: 12, flexShrink: 0 }}>
          <img src={avatarUri(other)} alt="" style={styles.convAvatar} />
          <OnlineDot online={other?.online} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.convNameRow}>
            <span
              style={{ ...styles.convName, ...(isUnread ? styles.convNameUnread : {}) }}
            >
              {other?.name || 'Utilisateur'}
            </span>
            <span style={styles.convTime}>{formatTime(conv.lastMessageTime)}</span>
          </div>
          <p
            style={{
              ...styles.convLast,
              ...(isUnread ? styles.convLastUnread : {}),
            }}
          >
            {conv.lastSenderId === String(currentUserId) ? 'Vous : ' : ''}
            {conv.lastMessage || '…'}
          </p>
        </div>
        {isUnread && <span style={styles.unreadDot} />}
      </div>
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Messenger = () => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const messagesEndRef = useRef(null);
  const pollConvRef = useRef(null);
  const pollMsgRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Load userId ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = localStorage.getItem('user');
const id = user ? JSON.parse(user).id : null;

    setCurrentUserId(id);
  }, []);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await ChatService.getConversations(currentUserId);
      setConversations(data || []);
    } catch (e) {
      console.error('loadConversations:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const loadUsers = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await ChatService.getUsers(currentUserId);
      setUsers(data || []);
    } catch (e) {
      console.error('loadUsers:', e);
    }
  }, [currentUserId]);

  const loadMessages = useCallback(async () => {
    if (!selectedConv) return;
    try {
      const data = await ChatService.getMessages(selectedConv.id);
      setMessages(data || []);
    } catch (e) {
      console.error('loadMessages:', e);
    }
  }, [selectedConv?.id]);

  // ── Polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();
    loadUsers();
    pollConvRef.current = setInterval(loadConversations, POLL_INTERVAL);
    return () => clearInterval(pollConvRef.current);
  }, [currentUserId, loadConversations]);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    loadMessages();
    pollMsgRef.current = setInterval(loadMessages, POLL_INTERVAL);
    return () => clearInterval(pollMsgRef.current);
  }, [selectedConv?.id]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages.length]);

  // ── Auto-resize textarea ────────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [newMessage]);

  // ── Select conversation ─────────────────────────────────────────────────────
  const handleSelectConv = useCallback(async (conv) => {
    setSelectedConv(conv);
    try {
      await ChatService.markAsRead(conv.id, currentUserId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? { ...c, readBy: [...(c.readBy || []), String(currentUserId)] }
            : c
        )
      );
    } catch (e) {
      console.error('markAsRead:', e);
    }
  }, [currentUserId]);

  // ── Create/open conversation ─────────────────────────────────────────────────
  const handleCreateConv = useCallback(async (targetUser) => {
    try {
      const data = await ChatService.createOrGetConversation(currentUserId, targetUser.id);
      const conv = data.conversation;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setSelectedConv(conv);
      setShowNewConv(false);
      setUserSearch('');
      setSearchTerm('');
    } catch (e) {
      console.error('handleCreateConv:', e);
    }
  }, [currentUserId]);

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (override = null) => {
    const text = override || newMessage.trim();
    if (!text || !selectedConv || !currentUserId) return;

    setSending(true);
    if (!override) setNewMessage('');
    try {
      const data = await ChatService.sendMessage(selectedConv.id, currentUserId, text);
      setMessages((prev) => [...prev, data.message]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessage: text,
                lastMessageTime: new Date().toISOString(),
                lastSenderId: String(currentUserId),
              }
            : c
        )
      );
    } catch (e) {
      alert("Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  }, [selectedConv, newMessage, currentUserId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── React to message ────────────────────────────────────────────────────────
  const handleReact = useCallback(async (messageId, emoji) => {
    setShowMenu(null);
    try {
      const msg = messages.find((m) => m.id === messageId);
      const alreadyReacted = msg?.reactions?.[emoji]?.includes(String(currentUserId));
      if (alreadyReacted) {
        await ChatService.removeReaction(messageId, currentUserId, emoji);
      } else {
        await ChatService.addReaction(messageId, currentUserId, emoji);
      }
      await loadMessages();
    } catch (e) {
      console.error('handleReact:', e);
    }
  }, [messages, currentUserId, loadMessages]);

  // ── Delete message ──────────────────────────────────────────────────────────
  const handleDeleteMessage = useCallback(async (messageId) => {
    setShowMenu(null);
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await ChatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (e) {
      alert('Impossible de supprimer le message');
    }
  }, []);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filteredConvs = useMemo(() =>
    conversations.filter((c) => {
      if (!searchTerm.trim()) return true;
      return c.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    }), [conversations, searchTerm]);

  const filteredUsers = useMemo(() =>
    users.filter((u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  if (!currentUserId || loading) {
    return (
      <div style={{ ...styles.container, ...styles.centered }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.container} onClick={() => setShowMenu(null)}>
      <div style={styles.main}>

        {/* ── Left Panel ── */}
        <div style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <div style={styles.leftHeaderTop}>
              <span style={styles.leftTitle}>Messages</span>
              <button style={styles.iconBtn} onClick={() => setShowNewConv(true)} title="Nouvelle conversation">
                <span style={{ fontSize: 20, color: '#0084FF', lineHeight: 1 }}>＋</span>
              </button>
            </div>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Rechercher…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.convList}>
            {filteredConvs.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={styles.emptyTitle}>Aucune conversation</p>
                <p style={styles.emptySub}>Appuyez sur + pour démarrer</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConvItem
                  key={`conv_${conv.id}`}
                  conv={conv}
                  currentUserId={currentUserId}
                  isSelected={selectedConv?.id === conv.id}
                  onPress={() => handleSelectConv(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={styles.chatPanel}>
          {selectedConv ? (
            <>
              {/* Header */}
              <div style={styles.chatHeader}>
                <img src={avatarUri(selectedConv.otherUser)} alt="" style={styles.chatHeaderAvatar} />
                <div>
                  <p style={styles.chatHeaderName}>{selectedConv.otherUser?.name}</p>
                  <p style={styles.chatHeaderStatus}>
                    {selectedConv.otherUser?.online ? '🟢 Actif' : '⚫ Hors ligne'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div style={styles.msgList} onClick={() => setShowMenu(null)}>
                {messages.length === 0 ? (
                  <div style={styles.emptyChat}>
                    <span style={{ fontSize: 40 }}>👋</span>
                    <p style={styles.emptyChatText}>Commencez la conversation</p>
                  </div>
                ) : (
                  messages.map((item) => (
                    <MessageBubble
                      key={`msg_${item.id}`}
                      message={item}
                      currentUserId={currentUserId}
                      onLongPress={setShowMenu}
                      onReact={handleReact}
                      showMenu={showMenu}
                      onDeleteMessage={handleDeleteMessage}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={styles.inputRow}>
                <textarea
                  ref={textareaRef}
                  style={styles.textInput}
                  placeholder="Écrire un message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  rows={1}
                />
                {newMessage.trim() ? (
                  <button
                    style={styles.sendBtn}
                    onClick={() => handleSend()}
                    disabled={sending}
                    title="Envoyer"
                  >
                    {sending
                      ? <span style={styles.spinnerSmall} />
                      : <span style={styles.sendIcon}>➤</span>
                    }
                  </button>
                ) : (
                  <button style={styles.likeBtn} onClick={() => handleSend('👍')} title="Like">
                    <span style={{ fontSize: 22 }}>👍</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={styles.noConv}>
              <span style={{ fontSize: 56, marginBottom: 16, display: 'block' }}>💬</span>
              <p style={styles.noConvText}>Sélectionnez une conversation</p>
              <button style={styles.startBtn} onClick={() => setShowNewConv(true)}>
                Démarrer une conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── New Conversation Modal ── */}
      {showNewConv && (
        <div style={styles.overlay} onClick={() => { setShowNewConv(false); setUserSearch(''); }}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Nouvelle conversation</span>
              <button
                style={styles.modalClose}
                onClick={() => { setShowNewConv(false); setUserSearch(''); }}
              >
                ✕
              </button>
            </div>

            <div style={{ ...styles.searchBox, margin: '0 16px 12px' }}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Chercher un utilisateur…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={styles.userList}>
              {filteredUsers.length === 0 ? (
                <div style={styles.emptyBox}>
                  <p style={styles.emptySub}>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={`u_${user.id}`}
                    style={styles.userCard}
                    onClick={() => handleCreateConv(user)}
                  >
                    <img src={avatarUri(user)} alt="" style={styles.userCardAvatar} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={styles.userCardName}>{user.name}</p>
                      <p style={styles.userCardRole}>{user.role || 'Staff'}</p>
                    </div>
                    <span style={{ color: '#0084FF', fontSize: 18 }}>→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { border: none; background: none; cursor: pointer; font-family: inherit; }
        input, textarea { font-family: inherit; outline: none; border: none; background: none; }
        textarea { resize: none; overflow-y: auto; }
        img { display: block; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Messenger;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container:        { display: 'flex', height: '100vh', backgroundColor: '#f6f4f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  centered:         { justifyContent: 'center', alignItems: 'center' },
  main:             { display: 'flex', flex: 1, overflow: 'hidden' },

  // Spinner
  spinner:          { width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0084FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  spinnerSmall:     { display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Left Panel
  leftPanel:        { width: 340, minWidth: 280, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRight: '1px solid #E5E5EA', flexShrink: 0 },
  leftHeader:       { padding: '20px 16px 12px', borderBottom: '1px solid #E5E5EA', flexShrink: 0 },
  leftHeaderTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leftTitle:        { fontSize: 26, fontWeight: 800, color: '#000' },
  iconBtn:          { width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', transition: 'background 0.15s' },
  searchBox:        { display: 'flex', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 20, padding: '0 12px' },
  searchIcon:       { fontSize: 14, marginRight: 6, color: '#65676B', flexShrink: 0 },
  searchInput:      { flex: 1, padding: '9px 0', fontSize: 14, color: '#000', width: '100%' },
  convList:         { flex: 1, overflowY: 'auto', padding: '8px 0' },

  // Conversation item
  convItem:         { display: 'block', width: '100%', padding: '8px', margin: '0 0 2px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' },
  convItemActive:   { backgroundColor: '#E7F3FF' },
  convItemInner:    { display: 'flex', alignItems: 'center' },
  convAvatar:       { width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' },
  onlineDot:        { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#31A24C', border: '2.5px solid #fff' },
  convNameRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convName:         { fontSize: 14, fontWeight: 500, color: '#000', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convNameUnread:   { fontWeight: 800 },
  convTime:         { fontSize: 12, color: '#65676B', marginLeft: 8, flexShrink: 0 },
  convLast:         { fontSize: 13, color: '#65676B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convLastUnread:   { fontWeight: 700, color: '#000' },
  unreadDot:        { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0084FF', marginLeft: 8, flexShrink: 0 },

  // Chat panel
  chatPanel:        { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden' },
  chatHeader:       { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #E5E5EA', flexShrink: 0, gap: 12 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  chatHeaderName:   { fontSize: 16, fontWeight: 700, color: '#000', marginBottom: 2 },
  chatHeaderStatus: { fontSize: 12, color: '#65676B' },

  // Messages
  msgList:          { flex: 1, overflowY: 'auto', padding: '16px 20px 8px' },
  msgRow:           { display: 'flex', marginBottom: 8, alignItems: 'flex-end' },
  msgRowOwn:        { justifyContent: 'flex-end' },
  msgRowOther:      { justifyContent: 'flex-start' },
  msgAvatar:        { width: 28, height: 28, borderRadius: '50%', marginRight: 8, objectFit: 'cover', flexShrink: 0 },
  bubble:           { borderRadius: 18, padding: '8px 12px 6px', display: 'inline-flex', flexDirection: 'column', maxWidth: '100%' },
  bubbleOwn:        { backgroundColor: '#0084FF' },
  bubbleOther:      { backgroundColor: '#E4E6EB' },
  bubbleText:       { fontSize: 15, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  bubbleTextOwn:    { color: '#fff' },
  bubbleTextOther:  { color: '#000' },
  bubbleTime:       { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeOwn:    { color: 'rgba(255,255,255,0.7)' },
  bubbleTimeOther:  { color: '#65676B' },

  // Reactions
  reactionsRow:     { display: 'flex', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  reactionBadge:    { backgroundColor: '#F0F2F5', borderRadius: 12, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', border: '1px solid #e0e0e0' },
  reactionEmoji:    { fontSize: 12 },
  reactionCount:    { fontSize: 10, color: '#65676B', fontWeight: 700 },

  // Context menu
  menuPopup:        { position: 'absolute', bottom: 'calc(100% + 6px)', backgroundColor: '#fff', borderRadius: 20, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 10, minWidth: 220 },
  menuPopupOwn:     { right: 0 },
  menuPopupOther:   { left: 0 },
  menuEmoji:        { width: 40, height: 40, borderRadius: '50%', backgroundColor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, border: 'none', transition: 'background 0.15s' },
  menuDelete:       { backgroundColor: '#FEE2E2', borderRadius: 10, padding: '0 10px', justifyContent: 'center', display: 'flex', alignItems: 'center', cursor: 'pointer', border: 'none', color: '#DC2626', fontSize: 11, fontWeight: 700 },

  // Input
  inputRow:         { display: 'flex', alignItems: 'flex-end', padding: '12px 16px', borderTop: '1px solid #E5E5EA', gap: 8, flexShrink: 0 },
  textInput:        { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, padding: '10px 16px', fontSize: 15, color: '#000', maxHeight: 100, lineHeight: 1.4, border: 'none', outline: 'none', fontFamily: 'inherit' },
  sendBtn:          { width: 38, height: 38, borderRadius: '50%', backgroundColor: '#0084FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0, transition: 'opacity 0.15s' },
  sendIcon:         { color: '#fff', fontSize: 16 },
  likeBtn:          { width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: 'none', flexShrink: 0 },

  // Empty states
  emptyBox:         { padding: 32, textAlign: 'center' },
  emptyTitle:       { fontSize: 15, fontWeight: 700, color: '#000', marginBottom: 6 },
  emptySub:         { fontSize: 13, color: '#6b6569' },
  emptyChat:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 },
  emptyChatText:    { color: '#65676B', fontSize: 15 },
  noConv:           { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  noConvText:       { fontSize: 16, color: '#65676B', marginBottom: 16 },
  startBtn:         { backgroundColor: '#0084FF', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' },

  // Modal
  overlay:          { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard:        { backgroundColor: '#fff', borderRadius: 16, width: '90%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid #E5E5EA', flexShrink: 0 },
  modalTitle:       { fontSize: 18, fontWeight: 700, color: '#000' },
  modalClose:       { fontSize: 22, color: '#64748b', cursor: 'pointer', border: 'none', background: 'none', lineHeight: 1 },
  userList:         { overflowY: 'auto', flex: 1 },
  userCard:         { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F0F2F5', cursor: 'pointer', width: '100%', gap: 12, transition: 'background 0.15s', background: 'none', border: 'none', borderBottom: '1px solid #F0F2F5' },
  userCardAvatar:   { width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  userCardName:     { fontSize: 15, fontWeight: 600, color: '#000', marginBottom: 2 },
  userCardRole:     { fontSize: 12, color: '#65676B' },
};