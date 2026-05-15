import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Share2, MoreVertical, Bold, Italic,
  List, Link2, BookOpen, HelpCircle, PlayCircle,
  AlignLeft, AlignCenter, Underline, Image,
  X, Check, Users, ArrowRight, Loader
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useSync } from '../hooks/useSync';

/* ── AI suggestion via backend (Llama 3) ── */
async function fetchAISuggestion(text, subject) {
  try {
    const response = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, subject })
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.suggestion || '';
  } catch {
    return '';
  }
}

/* ── Collaboration modal ── */
const CollabModal = ({ onClose, noteTitle }) => {
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState([]);
  const [sending, setSending] = useState(false);

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setTimeout(() => {
      setInvited(prev => [...prev, email.trim()]);
      setEmail('');
      setSending(false);
    }, 600);
  };

  return (
    <div className="collab-overlay" onClick={onClose}>
      <div className="collab-modal" onClick={e => e.stopPropagation()}>
        <div className="collab-modal-header">
          <div>
            <h3>Share Note</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>"{noteTitle}"</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleInvite} style={{ marginTop: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Invite by email
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="collaborator@university.edu"
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              autoFocus
            />
            <button
              type="submit"
              disabled={sending}
              style={{ padding: '10px 18px', background: '#000', color: '#fff', border: 'none', borderRadius: 999, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', opacity: sending ? 0.6 : 1, fontFamily: 'inherit' }}
            >
              {sending ? 'Sending…' : 'Invite'}
            </button>
          </div>
        </form>
        {invited.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--divider-color)', paddingTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>Invited</p>
            {invited.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', flexShrink: 0 }} />
                <span>{e}</span>
                <Check size={13} color="#34C759" style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.5 }}>
          Collaborators can view and edit this note independently of any team.
        </p>
      </div>
    </div>
  );
};

const TextEditorPage = ({ note, onBack, teamSubject, teamSubjects = [] }) => {
  const { dispatchEvent } = useSync();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [images, setImages] = useState(note?.images || []);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showCollab, setShowCollab] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState(note?.subject || teamSubject || null);
  const saveTimer = useRef(null);
  const aiTimer = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [content]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  const { on, off, emit } = useSocket();

  useEffect(() => {
    if (note?.id) {
      emit('join_room', { noteId: note.id });
      
      const handleRemoteChange = (data) => {
        if (data.content !== undefined) {
          setContent(data.content);
        }
      };
      
      on('text_change', handleRemoteChange);
      return () => off('text_change');
    }
  }, [note?.id, on, off, emit]);

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setAiSuggestion('');
    setLastSaved(null);

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setLastSaved(new Date());
      dispatchEvent({ type: 'NOTE_EDIT', payload: { noteId: note?.id, content: val } });
    }, 800);

    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(async () => {
      if (val.trim().length > 20) {
        const suggestion = await fetchAISuggestion(val, activeSubject);
        setAiSuggestion(suggestion);
      }
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && aiSuggestion) {
      e.preventDefault();
      setContent(prev => {
        const newContent = prev + aiSuggestion;
        setTimeout(() => {
          const ta = textareaRef.current;
          if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
        }, 0);
        return newContent;
      });
      setAiSuggestion('');
    }
    if (e.key === 'Escape') setAiSuggestion('');
  };

  const handleAIAction = async (action) => {
    if (!content.trim()) return;
    setIsAiLoading(true);
    setAiResult(null);
    try {
      const endpoint = action === 'summarize' ? '/api/ai/text-summarize' : 
                      action === 'explain' ? '/api/ai/explain' : '/api/ai/quiz';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      });
      const data = await res.json();
      setAiResult({ type: action, content: data.description || data.explanation || data.quiz });
    } catch (err) {
      alert('AI assistant is currently unavailable.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { id: Date.now() + Math.random(), url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));

  const handleBack = () => {
    onBack({
      id: note?.id,
      title: title.trim() || 'Untitled Note',
      content,
      images,
      type: 'text',
      teamId: note?.teamId || null,
      subject: activeSubject || note?.subject || null,
      tag: note?.tag || 'PERSONAL',
    });
  };

  const savedLabel = lastSaved
    ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : content !== (note?.content || '') ? 'Saving…' : 'Cloud Saved';

  const allSubjects = teamSubjects.length > 0 ? teamSubjects : (teamSubject ? [teamSubject] : []);

  return (
    <div className="editor-page">
      {showCollab && <CollabModal noteTitle={title || 'Untitled Note'} onClose={() => setShowCollab(false)} />}

      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="editor-back-btn" onClick={handleBack}><ArrowLeft size={18} /></button>
          <div className="editor-brand">
            <span className="editor-brand-name">PeerPad</span>
            <span className="editor-brand-sub">ACADEMIC SANCTUARY</span>
          </div>
        </div>
        <div className="editor-topbar-right">
          <div className="editor-save-status">
            <span className="editor-save-dot" />
            {savedLabel}
          </div>
          <button className="editor-collab-btn" onClick={() => setShowCollab(true)} title="Share & Collaborate">
            <Users size={15} /> Share
          </button>
          <button className="editor-share-btn">
            <Share2 size={15} /> Export
          </button>
          <button className="editor-more-btn"><MoreVertical size={18} /></button>
        </div>
      </header>

      <div className="editor-body">
        <div className="editor-main">
          <div className="editor-scroll-area">
            <div className="editor-meta">
              <span className="editor-tag">{note?.tag || 'PERSONAL'}</span>
              {/* Subject selector for team notes */}
              {allSubjects.length > 0 && (
                <select
                  value={activeSubject || ''}
                  onChange={e => setActiveSubject(e.target.value)}
                  style={{
                    fontSize: 11, fontWeight: 700, background: '#f3f4f6',
                    border: '1px solid #e5e7eb', borderRadius: 99,
                    padding: '2px 10px', color: '#374151', cursor: 'pointer',
                    outline: 'none', fontFamily: 'inherit', textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {allSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              <span className="editor-meta-sep">·</span>
              <span className="editor-meta-text">{wordCount} words</span>
              {aiSuggestion && (
                <span className="editor-ai-hint">Tab to accept suggestion</span>
              )}
              {activeSubject && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#6366f1',
                  background: '#eef2ff', padding: '2px 8px', borderRadius: 99
                }}>
                  AI tuned for {activeSubject}
                </span>
              )}
            </div>

            <input
              className="editor-title-input"
              placeholder="Note title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
            />

            <div className="editor-divider" />

            {/* Images */}
            {images.length > 0 && (
              <div className="editor-images-grid">
                {images.map(img => (
                  <div key={img.id} className="editor-image-item">
                    <img src={img.url} alt={img.name} />
                    <button className="editor-image-remove" onClick={() => removeImage(img.id)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea with ghost suggestion */}
            <div className="editor-textarea-wrapper">
              <textarea
                ref={textareaRef}
                className="editor-textarea"
                placeholder={activeSubject ? `Start writing your ${activeSubject} notes here…` : "Start writing your note here…"}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
              />
              {aiSuggestion && (
                <div className="editor-ai-suggestion" aria-hidden="true">
                  <span style={{ visibility: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</span>
                  <span className="editor-ai-ghost">{aiSuggestion}</span>
                </div>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          <div className="editor-toolbar">
            <button className="toolbar-btn" title="Bold"><Bold size={16} /></button>
            <button className="toolbar-btn" title="Italic"><Italic size={16} /></button>
            <button className="toolbar-btn" title="Underline"><Underline size={16} /></button>
            <div className="toolbar-sep" />
            <button className="toolbar-btn" title="Bullet list"><List size={16} /></button>
            <button className="toolbar-btn" title="Align left"><AlignLeft size={16} /></button>
            <button className="toolbar-btn" title="Align center"><AlignCenter size={16} /></button>
            <div className="toolbar-sep" />
            <button className="toolbar-btn" title="Insert link"><Link2 size={16} /></button>
            <button className="toolbar-btn" title="Add image" onClick={() => imageInputRef.current?.click()}>
              <Image size={16} />
            </button>
          </div>
        </div>

        <aside className="editor-sidebar">
          <div className="sidebar-block">
            <div className="sidebar-block-header">
              <span className="sidebar-block-title">COLLABORATORS</span>
              <span className="sidebar-block-badge">1 ACTIVE</span>
            </div>
            <div className="sidebar-avatars" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                title="You"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#111', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                  border: '2px solid #fff', boxShadow: '0 0 0 1px var(--border-color)'
                }}
              >
                {(note?.owner_name || 'U').charAt(0)}
              </div>
              <button
                onClick={() => setShowCollab(true)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px dashed var(--border-color)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                title="Invite collaborator"
              >
                <Users size={13} />
              </button>
            </div>
          </div>

          {/* Subject-aware AI panel */}
          <div className="sidebar-block">
            <div className="sidebar-ai-header">
              <div className="sidebar-ai-icon"><BookOpen size={16} /></div>
              <div>
                <div className="sidebar-ai-name">Study AI</div>
                <div className="sidebar-ai-sub">
                  {activeSubject ? activeSubject.toUpperCase() : 'YOUR ACADEMIC PARTNER'}
                </div>
              </div>
            </div>
            {activeSubject && (
              <div style={{
                background: '#eef2ff', borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: '#4f46e5', marginBottom: 10, lineHeight: 1.4
              }}>
                ✨ AI suggestions are tuned for <strong>{activeSubject}</strong>
              </div>
            )}
            <div className="sidebar-ai-actions">
              <button className="sidebar-ai-btn" onClick={() => handleAIAction('summarize')}>
                <PlayCircle size={15} /><span>Summarize Note</span>
                <ArrowRight size={13} className="sidebar-ai-chevron" />
              </button>
              <button className="sidebar-ai-btn" onClick={() => handleAIAction('explain')}>
                <BookOpen size={15} /><span>Explain Concept</span>
                <ArrowRight size={13} className="sidebar-ai-chevron" />
              </button>
              <button className="sidebar-ai-btn" onClick={() => handleAIAction('quiz')}>
                <HelpCircle size={15} /><span>Generate Quiz</span>
                <ArrowRight size={13} className="sidebar-ai-chevron" />
              </button>
            </div>

            {isAiLoading && (
              <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 12, textAlign: 'center' }}>
                <Loader size={16} className="spin" />
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600 }}>Analyzing...</span>
              </div>
            )}

            {aiResult && (
              <div style={{ marginTop: 12, padding: 16, background: '#f3f4f6', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>{aiResult.type} Result</span>
                  <button onClick={() => setAiResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={14} /></button>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#111827', whiteSpace: 'pre-wrap' }}>
                  {aiResult.content}
                </div>
              </div>
            )}
          </div>

          {aiSuggestion && (
            <div className="sidebar-block">
              <div className="sidebar-block-header">
                <span className="sidebar-block-title">AI SUGGESTION</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{aiSuggestion}"
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Press Tab ↹ to accept</p>
            </div>
          )}

          <div className="sidebar-block">
            <div className="sidebar-block-header">
              <span className="sidebar-block-title">READABILITY</span>
              <span className="sidebar-block-title">{Math.min(100, Math.max(0, Math.round(wordCount * 1.2)))}/100</span>
            </div>
            <div className="sidebar-progress-track">
              <div className="sidebar-progress-fill" style={{ width: `${Math.min(100, Math.round(wordCount * 1.2))}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TextEditorPage;