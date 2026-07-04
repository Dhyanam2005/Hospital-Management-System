'use strict';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

/* ═══════════════════════════════════════════════════════════════════════════
   AppointmentChatbot — accessible from the Login page only.
   No HMS JWT required; uses its own chatbot session JWT.
   ═══════════════════════════════════════════════════════════════════════════ */

const BLUE   = '#1976d2';
const DKBLUE = '#1565c0';

/* ─── small inline-style helpers (Tailwind won't cover everything) ────── */
const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9998,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  window: {
    pointerEvents: 'all',
    width: 380, height: 580,
    display: 'flex', flexDirection: 'column',
    border: '1px solid #e0e0e0', borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    background: '#fff',
    margin: '0 24px 24px 0',
    overflow: 'hidden',
    fontFamily: 'inherit',
  },
  header: {
    background: BLUE, color: '#fff',
    padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  msgArea: {
    flex: 1, overflowY: 'auto', padding: '12px 12px 4px',
    background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 8,
  },
  bubble: (isUser) => ({
    maxWidth: '80%',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser ? BLUE : '#fff',
    color: isUser ? '#fff' : '#222',
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    padding: '8px 12px',
    fontSize: 13.5,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  }),
  footer: {
    padding: '8px 10px',
    borderTop: '1px solid #eee',
    display: 'flex', gap: 8, flexShrink: 0, background: '#fff',
  },
  btn: (primary) => ({
    background: primary ? BLUE : '#fff',
    color: primary ? '#fff' : BLUE,
    border: `1px solid ${BLUE}`,
    borderRadius: 20, padding: '6px 14px',
    fontSize: 13, cursor: 'pointer', lineHeight: 1.4,
    transition: 'background 0.15s',
  }),
};

/* ─── Markdown-lite: bold **text** → <strong> ─────────────────────────── */
function MdText({ text }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)}
    </>
  );
}

/* ─── Message bubble ────────────────────────────────────────────────────── */
function Bubble({ msg, onOption, onSlot }) {
  const isUser = msg.from === 'user';
  const text   = msg.text || '';

  if (isUser) {
    return <div style={styles.bubble(true)}>{text}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={styles.bubble(false)}>
        {text.split('\n').map((line, i) => (
          <div key={i}><MdText text={line} />{i < text.split('\n').length - 1 ? null : ''}</div>
        ))}
      </div>

      {/* Option buttons (IDLE menu) */}
      {msg.type === 'options' && msg.options && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
          {msg.options.map(opt => (
            <button key={opt.id} style={styles.btn(false)} onClick={() => onOption(opt.id, opt.label)}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Slot buttons */}
      {msg.type === 'slots' && msg.slots && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
          {msg.slots.map(s => (
            <button key={s} style={{ ...styles.btn(false), fontFamily: 'monospace', fontSize: 13 }}
              onClick={() => onSlot(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Confirm buttons */}
      {msg.type === 'confirm' && (
        <div style={{ display: 'flex', gap: 8, paddingLeft: 4 }}>
          <button style={styles.btn(true)}  onClick={() => onOption('yes', 'Yes')}>Yes, Confirm</button>
          <button style={styles.btn(false)} onClick={() => onOption('no',  'No')}>No, Cancel</button>
        </div>
      )}

      {/* Appointment list */}
      {msg.type === 'appointment_list' && msg.items?.length > 0 && (
        <div style={{ paddingLeft: 4, fontSize: 13, color: '#444' }}>
          {msg.items.map((it, i) => (
            <div key={it.id} style={{ padding: '2px 0' }}>{i + 1}. {it.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Typing indicator ──────────────────────────────────────────────────── */
function Typing() {
  return (
    <div style={{ ...styles.bubble(false), display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#aaa',
          animation: `chatDot 1.2s ${i * 0.2}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AppointmentChatbot({ onClose }) {
  /* identification state */
  const [identStage, setIdentStage] = useState('INPUT');   // INPUT | SELECTING | IDENTIFIED
  const [idInput,    setIdInput]    = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [identError, setIdentError] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [identifying, setIdentifying] = useState(false);

  /* chat state */
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput]  = useState('');
  const [typing,    setTyping]     = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  const msgEndRef = useRef(null);
  const chatInputRef = useRef(null);

  /* scroll to bottom on new messages */
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  /* close → send session/close */
  useEffect(() => {
    return () => {
      if (sessionToken) {
        authFetch(`${API_BASE_URL}/api/chatbot/session/close`, {
          method: 'POST', keepalive: true,
        }).catch(() => {});
      }
    };
  }, [sessionToken]);

  /* ── Identification ─────────────────────────────────────────────────── */
  async function handleIdentify() {
    if (!idInput.trim() && !phoneInput.trim()) {
      setIdentError('Please enter a Patient ID or Phone number.');
      return;
    }
    setIdentError('');
    setIdentifying(true);
    try {
      const body = idInput.trim()
        ? { patientId: idInput.trim() }
        : { phone: phoneInput.trim() };

      const res  = await authFetch(`${API_BASE_URL}/api/chatbot/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.matchCount === 0) {
        setIdentError('No patient found with those details. Please check and try again.');
        return;
      }
      if (data.requiresPatientSelection) {
        setCandidates(data.patients);
        setIdentStage('SELECTING');
        return;
      }
      // Single match
      startChat(data.chatbotSessionToken, data.name);
    } catch {
      setIdentError('Failed to connect to server. Please try again.');
    } finally {
      setIdentifying(false);
    }
  }

  function handleSelectPatient(patient) {
    setIdentifying(true);
    authFetch(`${API_BASE_URL}/api/chatbot/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.patientId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.chatbotSessionToken) startChat(data.chatbotSessionToken, data.name);
        else setIdentError('Could not start session. Please try again.');
      })
      .catch(() => setIdentError('Failed to connect.'))
      .finally(() => setIdentifying(false));
  }

  function startChat(token, name) {
    setSessionToken(token);
    setIdentStage('IDENTIFIED');
    setMessages([{
      from: 'bot', id: Date.now(),
      text: `Hello, **${name}**! How can I help you today?`,
      type: 'options',
      options: [
        { id: 'book',       label: '📅 Book Appointment' },
        { id: 'upcoming',   label: '📋 View Upcoming' },
        { id: 'history',    label: '🕐 View History' },
        { id: 'reschedule', label: '🔄 Reschedule' },
        { id: 'cancel',     label: '❌ Cancel' },
      ],
    }]);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }

  /* ── Chat send ──────────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !sessionToken) return;
    const userMsg = { from: 'user', id: Date.now(), text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setTyping(true);

    try {
      const res  = await authFetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (res.status === 401) {
        setTyping(false);
        setMessages(prev => [...prev, {
          from: 'bot', id: Date.now() + 1,
          text: 'Your session has expired. Please close and reopen the chatbot.',
          type: 'text',
        }]);
        return;
      }

      const data = await res.json();
      setTyping(false);
      setMessages(prev => [...prev, {
        from: 'bot', id: Date.now() + 1,
        text: data.reply || '',
        type: data.type  || 'text',
        options: data.options,
        slots:   data.slots,
        items:   data.items,
      }]);
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, {
        from: 'bot', id: Date.now() + 1,
        text: 'Connection error. Please try again.', type: 'text',
      }]);
    }
  }, [sessionToken]);

  function handleChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); }
  }

  function onOption(id, label) { sendMessage(label); }
  function onSlot(slot)        { sendMessage(slot); }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Dot animation keyframes */}
      <style>{`
        @keyframes chatDot {
          0%,80%,100%{transform:scale(0.6);opacity:0.4}
          40%{transform:scale(1);opacity:1}
        }
      `}</style>

      <div style={styles.overlay}>
        <div style={styles.window}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🏥</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>HMS Appointment Bot</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {identStage === 'IDENTIFIED' ? '● Online' : 'Identify yourself to begin'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
              title="Close"
            >×</button>
          </div>

          {/* ── Identification panel ────────────────────────────────── */}
          {identStage === 'INPUT' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 24px', gap: 14 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>🩺</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Book an Appointment</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Identify yourself to get started</div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                  Patient ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your Patient ID"
                  value={idInput}
                  onChange={e => { setIdInput(e.target.value); setIdentError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleIdentify()}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 14,
                    border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>— OR —</div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneInput}
                  onChange={e => { setPhoneInput(e.target.value); setIdentError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleIdentify()}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 14,
                    border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {identError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626' }}>
                  {identError}
                </div>
              )}

              <button
                onClick={handleIdentify}
                disabled={identifying}
                style={{
                  background: identifying ? '#90caf9' : BLUE,
                  color: '#fff', border: 'none', borderRadius: 10, padding: '10px',
                  fontSize: 14, fontWeight: 600, cursor: identifying ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {identifying ? 'Searching…' : 'Continue →'}
              </button>
            </div>
          )}

          {/* ── Multi-patient disambiguation ────────────────────────── */}
          {identStage === 'SELECTING' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Multiple patients found. Please select:</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidates.map(c => (
                  <button
                    key={c.patientId}
                    onClick={() => handleSelectPatient(c)}
                    disabled={identifying}
                    style={{
                      background: '#fff', border: `1px solid ${BLUE}`, borderRadius: 10,
                      padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.background = '#e3f2fd'}
                    onMouseLeave={e => e.target.style.background = '#fff'}
                  >
                    <div style={{ fontWeight: 600, color: BLUE }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>ID: {c.patientId}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => { setIdentStage('INPUT'); setCandidates([]); }} style={{ ...styles.btn(false), fontSize: 13 }}>
                ← Back
              </button>
              {identError && <div style={{ color: '#dc2626', fontSize: 13 }}>{identError}</div>}
            </div>
          )}

          {/* ── Chat view ───────────────────────────────────────────── */}
          {identStage === 'IDENTIFIED' && (
            <>
              <div style={styles.msgArea}>
                {messages.map(msg => (
                  <Bubble key={msg.id} msg={msg} onOption={onOption} onSlot={onSlot} />
                ))}
                {typing && <Typing />}
                <div ref={msgEndRef} />
              </div>

              <div style={styles.footer}>
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Type a message…"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 20,
                    border: '1px solid #d0d0d0', outline: 'none', fontSize: 13.5,
                  }}
                />
                <button
                  onClick={() => sendMessage(chatInput)}
                  disabled={!chatInput.trim() || typing}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: (!chatInput.trim() || typing) ? '#ccc' : BLUE,
                    border: 'none', cursor: (!chatInput.trim() || typing) ? 'not-allowed' : 'pointer',
                    color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                  title="Send"
                >▶</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
