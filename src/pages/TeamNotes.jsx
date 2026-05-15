import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus, MoreVertical, FileText, Activity, Plus, X,
  Copy, Check, PenTool, Users, ArrowLeft, ChevronRight,
  Trash2, LogOut, Upload,
  Tag, Settings
} from 'lucide-react';

/* ── helpers ── */
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const generateLink = (teamId) =>
  `${window.location.origin}/invite/${teamId}-${Date.now().toString(36)}`;

/* ── Delete Confirm ── */
const DeleteConfirm = ({ note, onConfirm, onCancel }) => (
  <div className="tn-modal-overlay" onClick={onCancel}>
    <div className="tn-modal-box" onClick={e => e.stopPropagation()}>
      <div className="tn-delete-icon"><Trash2 size={22} /></div>
      <h3 className="tn-modal-title" style={{ textAlign: 'center', marginBottom: 8 }}>Move to Archive?</h3>
      <p className="tn-modal-sub" style={{ textAlign: 'center' }}>
        <strong>"{note.title}"</strong> will be moved to your Archive and permanently deleted after 30 days.
      </p>
      <div className="tn-modal-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn tn-delete-confirm-btn" onClick={onConfirm}>
          <Trash2 size={14} /> Move to Archive
        </button>
      </div>
    </div>
  </div>
);

/* ── Exit Team Confirm ── */
const ExitTeamConfirm = ({ team, onConfirm, onCancel }) => (
  <div className="tn-modal-overlay" onClick={onCancel}>
    <div className="tn-modal-box" onClick={e => e.stopPropagation()}>
      <div className="tn-exit-icon"><LogOut size={22} /></div>
      <h3 className="tn-modal-title" style={{ textAlign: 'center', marginBottom: 8 }}>Leave "{team.name}"?</h3>
      <p className="tn-modal-sub" style={{ textAlign: 'center' }}>
        You'll lose access to all shared notes in this workspace. You can rejoin via an invite link.
      </p>
      <div className="tn-modal-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn tn-exit-confirm-btn" onClick={onConfirm}>
          <LogOut size={14} /> Leave Team
        </button>
      </div>
    </div>
  </div>
);

/* ── Note Card (team) ── */
const TeamNoteCard = ({ note, onOpen, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirm = () => {
    setDeleting(true);
    const idToDelete = note.id || note._id;
    setTimeout(() => onDelete(idToDelete), 280);
  };

  return (
    <>
      {confirmDelete && (
        <DeleteConfirm note={note} onConfirm={handleConfirm} onCancel={() => setConfirmDelete(false)} />
      )}
      <div
        className={`team-note-card ${deleting ? 'card-deleting' : 'card-enter'}`}
        onClick={() => onOpen(note)}
      >
        <div className="tnc-top">
          <div className="tnc-icon">
            {note.type === 'text' ? <FileText size={16} /> :
             note.type === 'image' ? <span style={{ fontSize: 14 }}>🖼</span> :
             <PenTool size={16} />}
          </div>
          <button className="tnc-delete-btn" onClick={handleDelete} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>

        <h3 className="tnc-title">{note.title}</h3>

        {note.type === 'text' && note.content && (
          <p className="tnc-desc">{note.content}</p>
        )}

        {note.type === 'drawing' && (
          <div className="tnc-drawing-preview">
            {note.dataURL
              ? <img src={note.dataURL} alt="Preview" />
              : <PenTool size={18} style={{ opacity: 0.2 }} />
            }
          </div>
        )}

        {note.type === 'image' && note.dataURL && (
          <div className="tnc-drawing-preview">
            <img src={note.dataURL} alt="Preview" style={{ objectFit: 'cover' }} />
          </div>
        )}

        {note.subject && (
          <span className="tnc-subject-tag">{note.subject}</span>
        )}

        <div className="tnc-footer">
          <div className="tnc-avatar-initial" title={note.owner_name || 'User'}>
            {(note.owner_name || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="tnc-owner-name">{note.owner_name || 'Unknown'}</span>
          <span className="tnc-time">{timeAgo(note.timestamp || note.created_at)}</span>
        </div>
      </div>
    </>
  );
};

/* ── Create Team Modal ── */
const CreateTeamModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState(['', '', '']);
  const [invites, setInvites] = useState('');

  const updateSubject = (idx, val) => {
    const next = [...subjects];
    next[idx] = val;
    setSubjects(next);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const validSubjects = subjects.map(s => s.trim()).filter(Boolean);
    onCreate({
      name: name.trim(),
      subjects: validSubjects.length > 0 ? validSubjects : ['GENERAL'],
      members: invites.split(',').map(m => m.trim()).filter(Boolean)
    });
    onClose();
  };

  return (
    <div className="tn-modal-overlay" onClick={onClose}>
      <div className="tn-modal-box" onClick={e => e.stopPropagation()}>
        <div className="tn-modal-header">
          <h2 className="tn-modal-title">Create a New Team</h2>
          <button className="tn-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="tn-modal-sub">Start a shared workspace for your study group or class.</p>
        
        <form onSubmit={submit} className="tn-modal-form">
          <div className="tn-form-group">
            <label className="tn-modal-label">Team Name *</label>
            <input
              className="tn-modal-input"
              placeholder="e.g. Anatomy Study Group"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="tn-form-group">
            <label className="tn-modal-label">
              Subjects / Topics <span style={{ opacity: 0.6, textTransform: 'none', fontWeight: 400 }}>(up to 3)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subjects.map((s, i) => (
                <input
                  key={i}
                  className="tn-modal-input"
                  placeholder={`Subject ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                  value={s}
                  onChange={e => updateSubject(i, e.target.value)}
                  required={i === 0}
                />
              ))}
            </div>
          </div>

          <div className="tn-form-group">
            <label className="tn-modal-label">Invite Members</label>
            <input
              className="tn-modal-input"
              placeholder="Emails or Usernames (comma separated)"
              value={invites}
              onChange={e => setInvites(e.target.value)}
            />
          </div>

          <button type="submit" className="btn tn-modal-submit">
            <Plus size={18} /> Create Team
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── Manage Subjects Modal ── */
const ManageSubjectsModal = ({ team, onClose, onUpdateTeam }) => {
  const [subjects, setSubjects] = useState(team.subjects || ['GENERAL']);
  const [newSubject, setNewSubject] = useState('');

  const addSubject = () => {
    const trimmed = newSubject.trim().toUpperCase();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects(prev => [...prev, trimmed]);
    setNewSubject('');
  };

  const removeSubject = (s) => {
    if (subjects.length <= 1) return;
    setSubjects(prev => prev.filter(x => x !== s));
  };

  const handleSave = () => {
    onUpdateTeam(team.id, t => ({ ...t, subjects }));
    onClose();
  };

  return (
    <div className="tn-modal-overlay" onClick={onClose}>
      <div className="tn-modal-box" onClick={e => e.stopPropagation()}>
        <div className="tn-modal-header">
          <h2 className="tn-modal-title">Manage Subjects</h2>
          <button className="tn-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="tn-modal-sub">Add or remove subjects for "{team.name}".</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {subjects.map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f3f4f6', borderRadius: 99, padding: '5px 12px',
              fontSize: 12, fontWeight: 700, color: '#374151'
            }}>
              {s}
              {subjects.length > 1 && (
                <button onClick={() => removeSubject(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        <label className="tn-modal-label">Add Subject</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            className="tn-modal-input"
            placeholder="e.g. Biochemistry"
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ borderRadius: 999, padding: '10px 16px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={addSubject}
          >
            Add
          </button>
        </div>

        <div className="tn-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

/* ── Invite Modal ── */
const InviteModal = ({ team, onClose }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const link = generateLink(team.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const emailToInvite = email.trim();
    if (!emailToInvite || isSending) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToInvite })
      });
      if (response.ok) {
        setSent(prev => [...prev, emailToInvite]);
        setEmail('');
      }
    } catch (err) {
      console.error('Invite failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="tn-modal-overlay" onClick={onClose}>
      <div className="tn-modal-box" onClick={e => e.stopPropagation()}>
        <div className="tn-modal-header">
          <h2 className="tn-modal-title">Invite to {team.name}</h2>
          <button className="tn-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <label className="tn-modal-label">Share invite link</label>
        <div className="tn-invite-link-row">
          <span className="tn-invite-link-text">{link}</span>
          <button className="tn-invite-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="tn-invite-divider"><span>or invite by email</span></div>

        <form onSubmit={handleSend}>
          <label className="tn-modal-label">Email address</label>
          <div className="tn-invite-email-row">
            <input
              className="tn-modal-input"
              type="email"
              placeholder="teammate@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ borderRadius: 999, padding: '10px 24px', whiteSpace: 'nowrap', flexShrink: 0 }}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>

        {sent.length > 0 && (
          <div className="tn-invited-list">
            <p className="tn-modal-label" style={{ marginTop: 4 }}>Pending invites</p>
            {sent.map((e, i) => (
              <div key={i} className="tn-invited-item">
                <div className="tn-invited-dot" />{e}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>✓ Sent</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, lineHeight: 1.5 }}>
          📡 In production, invite links and emails would notify teammates in real-time via WebSocket sync.
        </p>
      </div>
    </div>
  );
};

/* ── Simulated Collaborators Presence ── */
const CollaboratorsPresence = ({ team }) => {
  const [onlineMembers] = useState(
    team.members.map((m, i) => ({ ...m, active: i < 2, cursor: i === 1 ? 'Viewing Subject 1' : 'Editing note' }))
  );

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
          Live Collaboration
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onlineMembers.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={m.avatar} alt={m.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 9, height: 9, borderRadius: '50%',
                background: m.active ? '#22c55e' : '#d1d5db',
                border: '1.5px solid #fff'
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{m.name} {m.id === 1 ? '(You)' : ''}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.active ? m.cursor : 'Offline'}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, lineHeight: 1.5 }}>
        🔌 Real-time sync via WebSocket — changes appear instantly for all members.
      </p>
    </div>
  );
};



/* ── FAB ── */
const TeamFAB = ({ onAction }) => {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAction('image', ev.target.result);
    };
    reader.readAsDataURL(file);
    setOpen(false);
  };

  return (
    <div className="fab-container">
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      {open && (
        <div className="fab-menu">
          <button className="fab-option" onClick={() => { setOpen(false); onAction('text'); }}>
            <FileText size={18} /><span>Text Note</span>
          </button>
          <button className="fab-option" onClick={() => { setOpen(false); onAction('drawing'); }}>
            <PenTool size={18} /><span>Drawing</span>
          </button>
          <button className="fab-option" onClick={() => fileRef.current?.click()}>
            <Upload size={18} /><span>Upload Image</span>
          </button>
        </div>
      )}
      <button className={`fab-btn ${open ? 'fab-open' : ''}`} onClick={() => setOpen(p => !p)}>
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};

/* ── Subject Tabs ── */
const SubjectTabs = ({ subjects, active, onChange }) => (
  <div className="tn-subject-tabs">
    <button className={`tn-subject-tab ${active === 'all' ? 'active' : ''}`} onClick={() => onChange('all')}>
      All
    </button>
    {subjects.map(s => (
      <button
        key={s}
        className={`tn-subject-tab ${active === s ? 'active' : ''}`}
        onClick={() => onChange(s)}
      >
        <Tag size={11} />{s}
      </button>
    ))}
  </div>
);

/* ── Team List ── */
const TeamListView = ({ teams, invites = [], onSelect, onCreateTeam, onExitTeam, onDeleteTeam }) => {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(null);
  const [showInviteFor, setShowInviteFor] = useState(null);

  const handleExit = (team) => {
    setExitConfirm(null);
    onExitTeam(team.id);
  };

  return (
    <div className="tn-page">
      {showCreate && (
        <CreateTeamModal onClose={() => setShowCreate(false)} onCreate={onCreateTeam} />
      )}
      {exitConfirm && (
        <ExitTeamConfirm
          team={exitConfirm}
          onConfirm={() => handleExit(exitConfirm)}
          onCancel={() => setExitConfirm(null)}
        />
      )}
      {showInviteFor && (
        <InviteModal team={showInviteFor} onClose={() => setShowInviteFor(null)} />
      )}

      <div className="tn-list-header">
        <div>
          <div className="tn-badge"><Users size={11} style={{ marginRight: 6 }} />MY TEAMS</div>
          <h1 className="tn-list-title">Your Workspaces</h1>
          <p className="tn-list-sub">Collaborate in real-time with your study groups and class partners.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="tn-empty">
          <div className="tn-empty-icon"><Users size={36} /></div>
          <h3 className="tn-empty-title">No teams yet</h3>
          <p className="tn-empty-sub">Create your first team to start collaborating with classmates.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Your First Team
          </button>
        </div>
      ) : (
        <div className="tn-teams-grid">
          {teams.map(team => (
            <div key={team.id} className="tn-team-card">
              <div className="tn-team-card-body" onClick={() => onSelect(team.id)}>
                <div className="tn-team-card-top">
                  <span className="tn-badge">
                    <Activity size={10} style={{ marginRight: 4 }} />
                    {(team.subjects || ['GENERAL'])[0]}
                  </span>
                  <ChevronRight size={16} style={{ color: '#9ca3af' }} />
                </div>
                <h3 className="tn-team-card-name">{team.name}</h3>
                <div className="tn-team-card-footer">
                  <div className="tn-avatars-row">
                    {(team.members || []).slice(0, 3).map((m, i) => (
                      <div key={i} className="tn-avatar-mini">{m.charAt(0)}</div>
                    ))}
                  </div>
                  <span className="tn-member-count">{(team.members || []).length} member{(team.members || []).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="tn-team-card-actions">
                <button className="tn-card-action-btn" onClick={e => { e.stopPropagation(); setShowInviteFor(team); }}>
                  <UserPlus size={14} /> <span>Invite</span>
                </button>
                <button 
                  className="tn-card-action-btn tn-exit-btn" 
                  onClick={e => { 
                    e.stopPropagation(); 
                    if (team.owner_id === 'ME' || team.owner_id === user?.id) { // owner check
                       onDeleteTeam(team.id);
                    } else {
                       setExitConfirm(team);
                    }
                  }}
                >
                  {(team.owner_id === 'ME' || team.owner_id === user?.id) ? (
                    <><Trash2 size={14} /> <span>Delete</span></>
                  ) : (
                    <><LogOut size={14} /> <span>Leave</span></>
                  )}
                </button>
              </div>
            </div>
          ))}
          <div className="tn-team-card-new" onClick={() => setShowCreate(true)}>
            <div className="tn-team-card-new-inner">
              <div className="tn-new-icon"><Plus size={22} /></div>
              <span>New Team</span>
            </div>
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div className="tn-invites-section" style={{ marginTop: 40 }}>
          <div className="tn-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
            <Activity size={11} style={{ marginRight: 6 }} />PENDING INVITES
          </div>
          <h2 className="tn-list-title" style={{ fontSize: 20, marginTop: 8 }}>Invitations Received</h2>
          <div className="tn-teams-grid" style={{ marginTop: 20 }}>
            {invites.map(invite => (
              <div key={invite.id} className="tn-team-card tn-invite-card">
                <div className="tn-team-card-body">
                  <h3 className="tn-team-card-name">{invite.name}</h3>
                  <p className="tn-list-sub" style={{ fontSize: 12, marginBottom: 16 }}>
                    You've been invited to join this workspace.
                  </p>
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => window.location.pathname = `/join/${invite.id}`}
                  >
                    View Invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Team Workspace ── */
const TeamWorkspaceView = ({ team, notes, onOpenNote, onBack, onDeleteNote, onExitTeam, onSaveNote, onUpdateTeam }) => {
  const [showInvite, setShowInvite] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeSubject, setActiveSubject] = useState('all');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showManageSubjects, setShowManageSubjects] = useState(false);
  const moreRef = useRef(null);

  const subjects = team.subjects || (team.subject ? [team.subject] : ['GENERAL']);

  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredNotes = notes.filter(n =>
    activeSubject === 'all' ? true : n.subject === activeSubject
  );

  const handleCreateNote = (type) => {
    onOpenNote({
      type,
      teamId: team.id,
      tag: team.name.toUpperCase(),
      subject: activeSubject !== 'all' ? activeSubject : subjects[0],
      subjectContext: subjects,
    });
  };

  const handleFABAction = (type, dataURL) => {
    if (type === 'text') handleCreateNote('text');
    else if (type === 'drawing') handleCreateNote('drawing');
    else if (type === 'image' && dataURL) {
      onSaveNote({
        title: `Image — ${new Date().toLocaleDateString()}`,
        type: 'image',
        dataURL,
        teamId: team.id,
        tag: team.name.toUpperCase(),
        subject: activeSubject !== 'all' ? activeSubject : subjects[0],
        timestamp: new Date(),
      });
    }
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    onExitTeam(team.id);
    onBack();
  };

  return (
    <div className="tn-page">
      {showInvite && <InviteModal team={team} onClose={() => setShowInvite(false)} />}
      {showExitConfirm && (
        <ExitTeamConfirm team={team} onConfirm={handleExitConfirm} onCancel={() => setShowExitConfirm(false)} />
      )}
      {showManageSubjects && (
        <ManageSubjectsModal
          team={team}
          onClose={() => setShowManageSubjects(false)}
          onUpdateTeam={onUpdateTeam}
        />
      )}

      {/* Header */}
      <div className="tn-workspace-header">
        <div className="tn-workspace-header-left">
          <button className="tn-back-btn" onClick={onBack}><ArrowLeft size={17} /></button>
          <div>
            <div className="tn-badge" style={{ marginBottom: 8 }}>
              <Activity size={11} style={{ marginRight: 6 }} />
              {subjects[0]}
            </div>
            <h1 className="tn-workspace-title">{team.name}</h1>
            <div className="tn-members-row">
              {team.members.map(m => (
                <img key={m.id} src={m.avatar} alt={m.name} title={m.name} className="tn-member-avatar" />
              ))}
              <span className="tn-member-count" style={{ marginLeft: 10 }}>
                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="tn-workspace-header-right">
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} /> Invite
          </button>
          {/* More menu */}
          <div className="tn-more-wrapper" ref={moreRef}>
            <button className="tn-icon-btn" onClick={() => setShowMoreMenu(p => !p)}>
              <MoreVertical size={18} />
            </button>
            {showMoreMenu && (
              <div className="tn-more-menu">
                <button className="tn-more-item" onClick={() => { setShowMoreMenu(false); setShowManageSubjects(true); }}>
                  <Settings size={15} /> Manage Subjects
                </button>
                <button className="tn-more-item tn-more-exit" onClick={() => { setShowMoreMenu(false); setShowExitConfirm(true); }}>
                  <LogOut size={15} /> Leave Team
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live collaboration presence bar */}
      <CollaboratorsPresence team={team} />

      {/* Subject filter + notebooks header */}
      <div className="tn-notebooks-header">
        <div className="tn-notebooks-title-row">
          <h2 className="tn-notebooks-title">Team Notebooks</h2>
          <div className="tn-notebooks-btns">
            <button className="btn btn-secondary tn-add-btn" onClick={() => handleCreateNote('text')}>
              <FileText size={14} /> Text Note
            </button>
            <button className="btn btn-secondary tn-add-btn" onClick={() => handleCreateNote('drawing')}>
              <PenTool size={14} /> Drawing
            </button>
          </div>
        </div>
        <SubjectTabs subjects={subjects} active={activeSubject} onChange={setActiveSubject} />
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className="tn-notes-empty">
          <div className="tn-empty-icon" style={{ margin: '0 auto 14px' }}><FileText size={28} /></div>
          <p className="tn-empty-title" style={{ fontSize: 16, marginBottom: 6 }}>No notes yet</p>
          <p className="tn-empty-sub">Be the first to add a note to this workspace.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => handleCreateNote('text')}>
              <FileText size={15} /> Text Note
            </button>
            <button className="btn btn-secondary" onClick={() => handleCreateNote('drawing')}>
              <PenTool size={15} /> Drawing
            </button>
          </div>
        </div>
      ) : (
        <div className="tn-notes-grid">
          {filteredNotes.map(note => (
            <TeamNoteCard
              key={note.id}
              note={note}
              onOpen={onOpenNote}
              onDelete={onDeleteNote}
            />
          ))}
          <div className="tn-add-tile" onClick={() => handleCreateNote('text')}>
            <Plus size={20} />
            <span>Add Note</span>
          </div>
        </div>
      )}

      {/* FAB — same as home page */}
      <TeamFAB onAction={handleFABAction} />
    </div>
  );
};

/* ── Root ── */
const TeamNotes = ({ 
  teams, invites, user, activeTeamId, onSelectTeam, onCreateTeam, 
  onOpenNote, onDeleteNote, teamNotes, onExitTeam, onSaveNote, 
  onUpdateTeam, onDeleteTeam 
}) => {
  const activeTeam = teams.find(t => t.id === activeTeamId);

  if (!activeTeam) {
    return (
      <TeamListView
        teams={teams}
        invites={invites}
        onSelect={onSelectTeam}
        onCreateTeam={onCreateTeam}
        onExitTeam={onExitTeam}
        onDeleteTeam={onDeleteTeam}
      />
    );
  }

  return (
    <TeamWorkspaceView
      team={activeTeam}
      notes={teamNotes}
      onOpenNote={onOpenNote}
      onBack={() => onSelectTeam(null)}
      onDeleteNote={onDeleteNote}
      onExitTeam={onExitTeam}
      onSaveNote={onSaveNote}
      onUpdateTeam={onUpdateTeam}
      onDeleteTeam={onDeleteTeam}
    />
  );
};

export default TeamNotes;