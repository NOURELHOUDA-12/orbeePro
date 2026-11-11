// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EmailService from '../../../../services/EmailService';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Général', 'Marketing', 'Support', 'Commercial', 'RH'];
const VIEWS = { INBOX: 'inbox', SENT: 'sent', COMPOSE: 'compose', TEMPLATES: 'templates', TRASH: 'trash' };

const CATEGORY_COLORS = {
  'Général':    { bg: '#E6F1FB', text: '#185FA5' },
  'Marketing':  { bg: '#EEEDFE', text: '#534AB7' },
  'Support':    { bg: '#E1F5EE', text: '#0F6E56' },
  'Commercial': { bg: '#FAEEDA', text: '#854F0B' },
  'RH':         { bg: '#FAECE7', text: '#993C1D' },
};

const genId = () => `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};
const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const paths = {
    compose:   'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6 12,13 2,6',
    inbox:     'M22 12h-6l-2 3H10l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    sent:      'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
    template:  'M3 3h18v18H3z M3 9h18 M9 21V9',
    trash:     'M3 6h18 M19 6l-1 14H6L5 6 M10 11v6M14 11v6 M9 6V4h6v2',
    plus:      'M12 5v14 M5 12h14',
    send:      'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
    close:     'M18 6L6 18 M6 6l12 12',
    reply:     'M9 17H5a2 2 0 0 0-2 2v3 M21 3l-6 6 M21 3l-6 6-5.5 5.5A2 2 0 0 0 9 17h0a2 2 0 0 0 1.41-.59L21 6',
    archive:   'M21 8v13H3V8 M23 3H1v5h22V3z M10 12h4',
    read:      'M20 6L9 17l-5-5',
    unread:    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    search:    'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
    chevronL:  'M15 18l-6-6 6-6',
    attach:    'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
    edit:      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    delete:    'M3 6h18 M19 6l-1 14H6L5 6 M10 11v6M14 11v6 M9 6V4h6v2',
    apply:     'M20 6L9 17l-5-5',
  };
  const d = paths[name] || '';
  const parts = d.split(' M ');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {parts.map((p, i) => <path key={i} d={i === 0 ? p : 'M ' + p} />)}
    </svg>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 36 }) => {
  const colors = ['#E6F1FB','#E1F5EE','#EEEDFE','#FAEEDA','#FAECE7'];
  const textColors = ['#185FA5','#0F6E56','#534AB7','#854F0B','#993C1D'];
  const idx = (name || '').charCodeAt(0) % 5;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[idx], color: textColors[idx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 500, letterSpacing: '0.02em',
    }}>
      {getInitials(name)}
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ text }) => {
  const c = CATEGORY_COLORS[text] || { bg: '#F1EFE8', text: '#5F5E5A' };
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
};

// ─── Shared style atoms ───────────────────────────────────────────────────────
const btn = (variant = 'ghost', danger = false) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', border: 'none', transition: 'all 0.15s', fontFamily: 'inherit',
  ...(variant === 'primary' ? {
    background: danger ? '#A32D2D' : '#185FA5', color: '#fff',
  } : variant === 'secondary' ? {
    background: 'var(--color-background-secondary)',
    border: '0.5px solid var(--color-border-secondary)',
    color: 'var(--color-text-primary)',
  } : {
    background: 'none', color: danger ? '#A32D2D' : 'var(--color-text-secondary)',
    padding: '6px 8px',
  }),
});

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 14,
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 8, background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

// ─── Email List Item ──────────────────────────────────────────────────────────
const EmailItem = ({ email, isSelected, onSelect, type }) => {
  const isUnread = !email.is_read && type === 'inbox';
  const name = type === 'inbox' ? (email.from_name || email.from_address) : (email.to_addresses || '');
  return (
    <button
      onClick={() => onSelect(email)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
        padding: '12px 16px', border: 'none', borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: isSelected ? 'var(--color-background-secondary)' : 'transparent',
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
        borderLeft: isSelected ? '2px solid #185FA5' : '2px solid transparent',
      }}
    >
      <Avatar name={name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: isUnread ? 600 : 400, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0, marginLeft: 8 }}>
            {formatTime(email.sent_at)}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: isUnread ? 500 : 400, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {email.subject}
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {email.body?.replace(/<[^>]+>/g, '').slice(0, 80)}
        </p>
      </div>
      {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#185FA5', flexShrink: 0, marginTop: 6 }} />}
    </button>
  );
};

// ─── Email Detail ─────────────────────────────────────────────────────────────
const EmailDetail = ({ email, onReply, onDelete, onArchive, onMarkUnread, type }) => {
  if (!email) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', gap: 12 }}>
      <Icon name="inbox" size={40} />
      <p style={{ fontSize: 14 }}>Sélectionnez un email</p>
    </div>
  );

  const name = type === 'inbox' ? (email.from_name || email.from_address) : (email.to_addresses || '');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 16px' }}>
          {email.subject}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar name={name} size={42} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>{name}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                {type === 'inbox' ? `De : ${email.from_address}` : `À : ${email.to_addresses}`}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                {formatDate(email.sent_at)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            {type === 'inbox' && (
              <>
                <button style={btn('ghost')} onClick={() => onReply(email)} title="Répondre">
                  <Icon name="reply" size={15} /> Répondre
                </button>
                <button style={btn('ghost')} onClick={() => onMarkUnread(email)} title="Marquer non lu">
                  <Icon name="unread" size={15} />
                </button>
                <button style={btn('ghost')} onClick={() => onArchive(email)} title="Archiver">
                  <Icon name="archive" size={15} />
                </button>
              </>
            )}
            <button style={btn('ghost', true)} onClick={() => onDelete(email)} title="Supprimer">
              <Icon name="delete" size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', maxWidth: 680 }}>
          {email.body}
        </div>
      </div>
    </div>
  );
};

// ─── Compose Panel ────────────────────────────────────────────────────────────
const ComposePanel = ({ draft, setDraft, onSend, onSelectTemplate, sending, sent }) => {
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const taRef = useRef(null);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 360) + 'px';
    }
  }, [draft.body]);

  const field = (key) => (e) => setDraft(d => ({ ...d, [key]: e.target.value }));
  const canSend = draft.to?.trim() && draft.subject?.trim() && draft.body?.trim();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '14px 24px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>Nouvel email</h2>
        <button style={btn('secondary')} onClick={onSelectTemplate}>
          <Icon name="template" size={14} /> Utiliser un template
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Fields card */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
          {/* À */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', width: 32, flexShrink: 0 }}>À</span>
            <input style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'inherit' }}
              value={draft.to} onChange={field('to')} placeholder="destinataire@exemple.com" />
            <div style={{ display: 'flex', gap: 4 }}>
              {!showCc && <button onClick={() => setShowCc(true)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Cc</button>}
              {!showBcc && <button onClick={() => setShowBcc(true)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Cci</button>}
            </div>
          </div>

          {showCc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', width: 32, flexShrink: 0 }}>Cc</span>
              <input style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'inherit' }}
                value={draft.cc} onChange={field('cc')} placeholder="copie@exemple.com" />
              <button onClick={() => { setShowCc(false); setDraft(d => ({ ...d, cc: '' })); }} style={{ ...btn('ghost'), padding: 4 }}>
                <Icon name="close" size={13} />
              </button>
            </div>
          )}

          {showBcc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', width: 32, flexShrink: 0 }}>Cci</span>
              <input style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'inherit' }}
                value={draft.bcc} onChange={field('bcc')} placeholder="copie-cachée@exemple.com" />
              <button onClick={() => { setShowBcc(false); setDraft(d => ({ ...d, bcc: '' })); }} style={{ ...btn('ghost'), padding: 4 }}>
                <Icon name="close" size={13} />
              </button>
            </div>
          )}

          {/* Objet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', width: 32, flexShrink: 0 }}>Objet</span>
            <input style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'inherit' }}
              value={draft.subject} onChange={field('subject')} placeholder="Objet de l'email" />
          </div>
        </div>

        {/* Body */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
          <textarea
            ref={taRef}
            style={{ width: '100%', minHeight: 240, padding: '16px 20px', border: 'none', outline: 'none', resize: 'none', fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
            value={draft.body}
            onChange={field('body')}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) onSend(); }}
            placeholder="Rédigez votre message… (Ctrl+Entrée pour envoyer)"
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={btn('ghost')} onClick={() => setDraft({ to: '', cc: '', bcc: '', subject: '', body: '' })}>
          Effacer
        </button>
        <button
          style={{ ...btn('primary'), opacity: canSend && !sending ? 1 : 0.45, minWidth: 110, justifyContent: 'center', background: sent ? '#0F6E56' : '#185FA5' }}
          onClick={onSend}
          disabled={!canSend || sending || sent}
        >
          {sent ? <><Icon name="apply" size={14} /> Envoyé !</> :
           sending ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} /> Envoi…</> :
           <><Icon name="send" size={14} /> Envoyer</>}
        </button>
      </div>
    </div>
  );
};

// ─── Template Manager ─────────────────────────────────────────────────────────
const TemplateModal = ({ template, onSave, onClose }) => {
  const [form, setForm] = useState({ name: template?.name || '', category: template?.category || CATEGORIES[0], subject: template?.subject || '', body: template?.body || '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = form.name && form.subject && form.body;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={onClose}>
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 14, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{template ? 'Modifier le template' : 'Nouveau template'}</span>
          <button style={btn('ghost')} onClick={onClose}><Icon name="close" size={15} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Nom</label>
              <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Ex: Bienvenue" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Catégorie</label>
              <select style={inputStyle} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Objet</label>
            <input style={inputStyle} value={form.subject} onChange={set('subject')} placeholder="Objet de l'email" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Corps</label>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>Variables : <code style={{ fontSize: 11, background: 'var(--color-background-secondary)', padding: '1px 5px', borderRadius: 4 }}>{'{{nom}}'}</code></p>
            <textarea style={{ ...inputStyle, height: 180, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.body} onChange={set('body')} placeholder={'Bonjour {{nom}},\n\nVotre message...'} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={btn('secondary')} onClick={onClose}>Annuler</button>
          <button style={{ ...btn('primary'), opacity: valid ? 1 : 0.45 }} onClick={() => valid && onSave({ ...template, id: template?.id || genId(), ...form, createdAt: template?.createdAt || new Date().toISOString() })} disabled={!valid}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Templates View ───────────────────────────────────────────────────────────
const TemplatesView = ({ templates, onApply, onNew, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tous');
  const filtered = templates.filter(t => (cat === 'Tous' || t.category === cat) && (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Templates</h2>
        <button style={btn('primary')} onClick={onNew}><Icon name="plus" size={14} /> Nouveau</button>
      </div>
      <div style={{ padding: '12px 24px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '6px 12px', flex: 1, maxWidth: 240 }}>
          <Icon name="search" size={14} />
          <input style={{ border: 'none', outline: 'none', background: 'none', fontSize: 13, color: 'var(--color-text-primary)', width: '100%', fontFamily: 'inherit' }} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['Tous', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '0.5px solid', fontWeight: cat === c ? 500 : 400, background: cat === c ? '#E6F1FB' : 'var(--color-background-secondary)', borderColor: cat === c ? '#378ADD' : 'var(--color-border-tertiary)', color: cat === c ? '#185FA5' : 'var(--color-text-secondary)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
            <Icon name="template" size={36} />
            <p style={{ marginTop: 12, fontSize: 14 }}>Aucun template</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(tpl => (
              <div key={tpl.id} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', flex: 1, marginRight: 8 }}>{tpl.name}</span>
                    <Badge text={tpl.category} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.subject}</p>
                </div>
                <div style={{ padding: '10px 16px', flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {tpl.body}
                  </p>
                </div>
                <div style={{ padding: '8px 10px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <button style={btn('ghost')} onClick={() => onApply(tpl)} title="Utiliser"><Icon name="apply" size={14} /></button>
                  <button style={btn('ghost')} onClick={() => onEdit(tpl)} title="Modifier"><Icon name="edit" size={14} /></button>
                  <button style={btn('ghost', true)} onClick={() => onDelete(tpl.id)} title="Supprimer"><Icon name="delete" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmailComposer = ({ currentUserId, currentUserEmail = 'support@daddyweb.fr', currentUserName = 'Admin' }) => {
  const [view, setView] = useState(VIEWS.INBOX);
  const [inbox, setInbox] = useState([]);
  const [sent, setSentList] = useState([]);
  const [trash, setTrash] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [draft, setDraft] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templateModal, setTemplateModal] = useState(null);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [inboxData, sentData, tplData, countData] = await Promise.all([
          EmailService.getInbox(currentUserId),
          EmailService.getSent(currentUserId),
          EmailService.getTemplates(),
          EmailService.getUnreadCount(currentUserId),
        ]);
        setInbox(inboxData.emails || []);
        setSentList(sentData.emails || []);
        setTemplates(tplData || []);
        setUnreadCount(countData.count || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserId) load();
  }, [currentUserId]);

  // ── Select email → mark as read ─────────────────────────────────────────────
  const handleSelectEmail = useCallback(async (email) => {
    setSelectedEmail(email);
    if (!email.is_read && view === VIEWS.INBOX) {
      try {
        await EmailService.markAsRead(email.recipient_id, currentUserId);
        setInbox(prev => prev.map(e => e.email_id === email.email_id ? { ...e, is_read: true } : e));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) { console.error(e); }
    }
  }, [currentUserId, view]);

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!draft.to || !draft.subject || !draft.body) return;
    setSending(true);
    try {
      await EmailService.sendEmail({ fromUserId: currentUserId, fromAddress: currentUserEmail, ...draft });
      setSendSuccess(true);
      const updated = await EmailService.getSent(currentUserId);
      setSentList(updated.emails || []);
      setTimeout(() => {
        setSendSuccess(false);
        setDraft({ to: '', cc: '', bcc: '', subject: '', body: '' });
      }, 2000);
    } catch (e) { alert("Erreur lors de l'envoi"); }
    finally { setSending(false); }
  }, [draft, currentUserId, currentUserEmail]);

  // ── Archive ─────────────────────────────────────────────────────────────────
  const handleArchive = useCallback(async (email) => {
    try {
      await EmailService.archive(email.recipient_id, currentUserId);
      setInbox(prev => prev.filter(e => e.email_id !== email.email_id));
      setSelectedEmail(null);
    } catch (e) { console.error(e); }
  }, [currentUserId]);

  // ── Trash ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (email) => {
    if (!window.confirm('Mettre à la corbeille ?')) return;
    try {
      await EmailService.moveToTrash(email.recipient_id, currentUserId);
      setInbox(prev => prev.filter(e => e.email_id !== email.email_id));
      setSentList(prev => prev.filter(e => e.email_id !== email.email_id));
      setSelectedEmail(null);
    } catch (e) { console.error(e); }
  }, [currentUserId]);

  // ── Mark unread ─────────────────────────────────────────────────────────────
  const handleMarkUnread = useCallback(async (email) => {
    try {
      await EmailService.markAsUnread(email.recipient_id, currentUserId);
      setInbox(prev => prev.map(e => e.email_id === email.email_id ? { ...e, is_read: false } : e));
      setUnreadCount(prev => prev + 1);
      setSelectedEmail(null);
    } catch (e) { console.error(e); }
  }, [currentUserId]);

  // ── Reply ───────────────────────────────────────────────────────────────────
  const handleReply = useCallback((email) => {
    setDraft({ to: email.from_address, cc: '', bcc: '', subject: `Re: ${email.subject}`, body: `\n\n---\nDe : ${email.from_address}\n${email.body}` });
    setView(VIEWS.COMPOSE);
  }, []);

  // ── Templates ───────────────────────────────────────────────────────────────
  const handleSaveTemplate = useCallback(async (tpl) => {
    try {
      const saved = tpl.id && !tpl.id.startsWith('tpl_')
        ? await EmailService.updateTemplate(tpl.id, tpl)
        : await EmailService.createTemplate({ ...tpl, createdBy: currentUserId });
      setTemplates(prev => {
        const exists = prev.find(t => t.id === (saved.id || tpl.id));
        return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
      });
      setTemplateModal(null);
    } catch (e) { console.error(e); }
  }, [currentUserId]);

  const handleDeleteTemplate = useCallback(async (id) => {
    if (!window.confirm('Supprimer ce template ?')) return;
    try {
      await EmailService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  const handleApplyTemplate = useCallback((tpl) => {
    setDraft(d => ({ ...d, subject: tpl.subject, body: tpl.body }));
    setView(VIEWS.COMPOSE);
  }, []);

  // ── Sidebar nav items ───────────────────────────────────────────────────────
  const navItems = [
    { key: VIEWS.COMPOSE,   label: 'Composer',   icon: 'compose' },
    { key: VIEWS.INBOX,     label: 'Boîte de réception', icon: 'inbox', badge: unreadCount },
    { key: VIEWS.SENT,      label: 'Envoyés',    icon: 'sent' },
    { key: VIEWS.TEMPLATES, label: 'Templates',  icon: 'template', sub: `${templates.length} template${templates.length !== 1 ? 's' : ''}` },
    { key: VIEWS.TRASH,     label: 'Corbeille',  icon: 'trash' },
  ];

  const listForView = view === VIEWS.INBOX ? inbox : view === VIEWS.SENT ? sent : trash;
  const showList = [VIEWS.INBOX, VIEWS.SENT, VIEWS.TRASH].includes(view);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background-tertiary)', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 230, flexShrink: 0, background: 'var(--color-background-primary)', borderRight: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={currentUserName} size={36} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUserName}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUserEmail}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setView(item.key); setSelectedEmail(null); }}
              style={{
                display: 'flex', alignItems: 'center', width: '100%', padding: '9px 16px',
                border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10, transition: 'all 0.15s',
                background: view === item.key ? 'var(--color-background-secondary)' : 'none',
                color: view === item.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: view === item.key ? 500 : 400, fontSize: 13,
                borderRight: view === item.key ? '2px solid #185FA5' : '2px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              <Icon name={item.icon} size={15} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ fontSize: 11, background: '#185FA5', color: '#fff', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Email List (inbox/sent/trash) ── */}
      {showList && (
        <div style={{ width: 300, flexShrink: 0, background: 'var(--color-background-primary)', borderRight: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {view === VIEWS.INBOX ? `Boîte de réception` : view === VIEWS.SENT ? 'Envoyés' : 'Corbeille'}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 6 }}>({listForView.length})</span>
            </h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <span style={{ width: 20, height: 20, border: '2px solid var(--color-border-secondary)', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
              </div>
            ) : listForView.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-secondary)' }}>
                <Icon name={view === VIEWS.INBOX ? 'inbox' : view === VIEWS.SENT ? 'sent' : 'trash'} size={32} />
                <p style={{ marginTop: 10, fontSize: 13 }}>Aucun email</p>
              </div>
            ) : listForView.map(email => (
              <EmailItem
                key={email.email_id || email.id}
                email={email}
                isSelected={selectedEmail?.email_id === email.email_id}
                onSelect={handleSelectEmail}
                type={view}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {view === VIEWS.COMPOSE && (
          <ComposePanel
            draft={draft}
            setDraft={setDraft}
            onSend={handleSend}
            onSelectTemplate={() => setView(VIEWS.TEMPLATES)}
            sending={sending}
            sent={sendSuccess}
          />
        )}

        {showList && (
          <EmailDetail
            email={selectedEmail}
            type={view}
            onReply={handleReply}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onMarkUnread={handleMarkUnread}
          />
        )}

        {view === VIEWS.TEMPLATES && (
          <TemplatesView
            templates={templates}
            onApply={handleApplyTemplate}
            onNew={() => setTemplateModal('new')}
            onEdit={(tpl) => setTemplateModal(tpl)}
            onDelete={handleDeleteTemplate}
          />
        )}
      </div>

      {/* ── Template Modal ── */}
      {templateModal && (
        <TemplateModal
          template={templateModal === 'new' ? null : templateModal}
          onSave={handleSaveTemplate}
          onClose={() => setTemplateModal(null)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.85; }
        input::placeholder, textarea::placeholder { color: var(--color-text-secondary); opacity: 0.7; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default EmailComposer;