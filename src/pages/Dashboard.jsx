import { useState, useRef } from 'react';
import { Search, FileText, PenTool, Grid, List, Plus, X, Trash2, Image, Mail, UserPlus, Check } from 'lucide-react';

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* ── Collaborate Modal (per-card, independent of teams) ── */
const CollabModal = ({ note, onClose, onAddCollaborator }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(note.collaborators || []);
  const [status, setStatus] = useState('idle');

  const handleSend = (e) => {
    e.preventDefault();
    if (!email.trim() || sent.includes(email.trim())) return;
    setStatus('sending');
    // Simulate sending invite
    setTimeout(() => {
      const newList = [...sent, email.trim()];
      setSent(newList);
      onAddCollaborator(note.id, newList);
      setEmail('');
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 1500);
    }, 800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-top">
          <h3 className="modal-title">Collaborate on note</h3>
          <button className="modal-x" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="modal-sub">Invite teammates to view and edit "{note.title}" via email.</p>

        <form className="modal-email-form" onSubmit={handleSend}>
          <input
            className="modal-email-input"
            type="email"
            placeholder="teammate@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <button type="submit" className="modal-send-btn" disabled={status === 'sending'}>
            {status === 'sending' ? '...' : status === 'sent' ? <Check size={15} /> : <Mail size={15} />}
            {status === 'sent' ? 'Sent!' : 'Invite'}
          </button>
        </form>

        {sent.length > 0 && (
          <div className="modal-collab-list">
            <p className="modal-list-label">Invited ({sent.length})</p>
            {sent.map((em, i) => (
              <div key={i} className="modal-collab-item">
                <div className="collab-dot" />
                <span>{em}</span>
                <span className="collab-status">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Delete confirm (no blurred backdrop) ── */
const DeleteConfirm = ({ note, onConfirm, onCancel }) => (
  <div className="delete-backdrop" onClick={onCancel}>
    <div className="delete-box" onClick={e => e.stopPropagation()}>
      <div className="delete-icon-wrap"><Trash2 size={20} /></div>
      <h3 className="delete-title">Move to Archive?</h3>
      <p className="delete-sub"><strong>"{note.title}"</strong> will be archived for 30 days, then deleted.</p>
      <div className="delete-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn delete-btn" onClick={onConfirm}><Trash2 size={14} /> Archive</button>
      </div>
    </div>
  </div>
);

/* ── Single note card ── */
const NoteCard = ({ note, onOpen, onDelete, onUpdateCollaborators }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = () => {
    setDeleting(true);
    setShowDelete(false);
    const idToDelete = note.id || note._id;
    setTimeout(() => onDelete(idToDelete), 280);
  };

  return (
    <>
      {showDelete && (
        <DeleteConfirm
          note={note}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
      {showCollab && (
        <CollabModal
          note={note}
          onClose={() => setShowCollab(false)}
          onAddCollaborator={onUpdateCollaborators}
        />
      )}
      <div
        className={`entry-card ${deleting ? 'card-exit' : 'card-enter'}`}
        onClick={() => onOpen(note)}
      >
        <div className="card-top">
          <div className="card-icon">
            {note.type === 'text' ? <FileText size={15} /> : <PenTool size={15} />}
          </div>
          <div className="card-top-right">
            <span className="badge">{note.tag || 'PERSONAL'}</span>
            <button
              className="card-action-btn"
              title="Collaborate"
              onClick={e => { e.stopPropagation(); setShowCollab(true); }}
            >
              <UserPlus size={13} />
            </button>
            <button
              className="card-action-btn card-delete"
              title="Delete"
              onClick={e => { e.stopPropagation(); setShowDelete(true); }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <h3 className="card-title">{note.title}</h3>

        {note.type === 'text' && note.content && (
          <p className="card-desc">{note.content}</p>
        )}

        {/* Image previews */}
        {note.images && note.images.length > 0 && (
          <div className="card-images">
            {note.images.slice(0, 3).map((src, i) => (
              <img key={i} src={src} alt="" className="card-image-thumb" />
            ))}
            {note.images.length > 3 && (
              <div className="card-image-more">+{note.images.length - 3}</div>
            )}
          </div>
        )}

        {note.type === 'drawing' && (
          <div className="card-drawing-preview">
            {note.dataURL
              ? <img src={note.dataURL} alt="Drawing preview" />
              : <PenTool size={20} style={{ opacity: 0.15 }} />
            }
          </div>
        )}

        <div className="card-footer">
          <div className="card-footer-left">
            <div className="card-avatar-initial" title={note.owner_name || 'You'}>
              {(note.owner_name || 'U').charAt(0).toUpperCase()}
            </div>
            {note.collaborators && note.collaborators.length > 0 && (
              <span className="collab-count">{note.collaborators.length} collaborator{note.collaborators.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <span className="time-ago">{timeAgo(note.timestamp)}</span>
        </div>
      </div>
    </>
  );
};

/* ── Dashboard ── */
const Dashboard = ({ notes = [], invites = [], user, onOpenNote, onDeleteNote }) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [fabOpen, setFabOpen] = useState(false);
  const imageInputRef = useRef(null);

  const displayNotes = notes;

  const filtered = displayNotes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateCollaborators = (noteId, collaborators) => {
    // Bubble up via onDeleteNote pattern isn't ideal; we'll handle via onOpenNote flow
    // For now update is reflected in the card's own state via the modal
    console.log('Collaborators updated for note', noteId, collaborators);
  };

  const handleImageNoteCreate = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const readers = files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(images => {
      onOpenNote({ type: 'text', images, title: '', content: '' });
    });
    setFabOpen(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="search-bar">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search your sanctuary..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="header-actions">
          <button className={`nav-tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
          <button className={`nav-tab ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => setActiveTab('collections')}>Collections</button>
          <button className={`nav-tab ${activeTab === 'shared' ? 'active' : ''}`} onClick={() => setActiveTab('shared')}>
            Shared
            {invites.length > 0 && <span className="tab-count">{invites.length}</span>}
          </button>
          <div className="header-avatar-wrap">
            <div className="header-avatar-initial" title={user?.name || 'User'}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="header-user-name">{user?.name || 'User'}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Hero — single line */}
        <div className="hero-section">
          <h1 className="hero-title">
            All Your Notes. <span className="hero-italic">Powered by AI.</span>
          </h1>
          <p className="hero-sub">Your personal academic sanctuary. Capture, organize, and study smarter.</p>
        </div>

        <div className="quick-actions">
          <button className="action-pill" onClick={() => onOpenNote({ type: 'text' })}>
            <FileText size={15} /><span>Text Note</span>
          </button>
          <button className="action-pill" onClick={() => onOpenNote({ type: 'drawing' })}>
            <PenTool size={15} /><span>Drawing</span>
          </button>
          <button className="action-pill" onClick={() => imageInputRef.current?.click()}>
            <Image size={15} /><span>Image Note</span>
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageNoteCreate}
          />
        </div>

        <div className="entries-section">
          {activeTab === 'notes' ? (
            <>
              <div className="entries-header">
                <h2 className="entries-label">RECENT ENTRIES</h2>
                <div className="view-toggles">
                  <button className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                    <Grid size={14} />
                  </button>
                  <button className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                    <List size={14} />
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><FileText size={28} /></div>
                  <p className="empty-title">No notes yet</p>
                  <p className="empty-sub">Create your first note using the + button or quick actions above.</p>
                </div>
              ) : (
                <div className={`entries-grid ${viewMode === 'list' ? 'entries-list' : ''}`}>
                  {filtered.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onOpen={onOpenNote}
                      onDelete={onDeleteNote}
                      onUpdateCollaborators={handleUpdateCollaborators}
                    />
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'shared' ? (
            <div className="shared-invites-section">
              <h2 className="entries-label">TEAM INVITATIONS</h2>
              {invites.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Mail size={28} /></div>
                  <p className="empty-title">No pending invites</p>
                  <p className="empty-sub">Invitations from teammates will appear here.</p>
                </div>
              ) : (
                <div className="invites-list">
                  {invites.map(invite => (
                    <div key={invite.id} className="invite-card-mini">
                      <div className="invite-card-info">
                        <h4 className="invite-card-name">{invite.name}</h4>
                        <p className="invite-card-sub">You've been invited to join this team.</p>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => window.location.pathname = `/join/${invite.id}`}
                      >
                        Join Team
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Grid size={28} /></div>
              <p className="empty-title">{activeTab.toUpperCase()} coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <div className="fab-container">
        {fabOpen && (
          <div className="fab-menu">
            <button className="fab-option" onClick={() => { setFabOpen(false); onOpenNote({ type: 'text' }); }}>
              <FileText size={16} /><span>Text Note</span>
            </button>
            <button className="fab-option" onClick={() => { setFabOpen(false); onOpenNote({ type: 'drawing' }); }}>
              <PenTool size={16} /><span>Drawing</span>
            </button>
            <button className="fab-option" onClick={() => { setFabOpen(false); setTimeout(() => imageInputRef.current?.click(), 50); }}>
              <Image size={16} /><span>Image Note</span>
            </button>
          </div>
        )}
        <button
          className={`fab-btn ${fabOpen ? 'fab-open' : ''}`}
          onClick={() => setFabOpen(p => !p)}
        >
          {fabOpen ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;