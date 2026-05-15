import { useState, useEffect } from 'react';
import { 
  FileText, MessageSquare, Activity, Users, 
  Settings, Plus, Search, ChevronRight, Share2, X, Link, Copy, Check
} from 'lucide-react';
import TeamChat from '../components/TeamWorkspace/TeamChat';
import TeamPresence from '../components/TeamWorkspace/TeamPresence';
import TextEditorPage from './TextEditorPage';
import { useAuth } from '../context/AuthContext';

const InviteModal = ({ team, onClose }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join/${team.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="collab-overlay" onClick={onClose}>
      <div className="collab-modal" onClick={e => e.stopPropagation()}>
        <div className="collab-modal-header">
          <h3>Invite to {team.name}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="invite-section">
          <label className="invite-label">Invite via Email</label>
          <div className="invite-input-group">
            <input 
              className="invite-input" 
              placeholder="name@university.edu" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="btn btn-primary invite-btn">Send</button>
          </div>
        </div>

        <div className="invite-divider">
          <span>OR</span>
        </div>

        <div className="invite-section">
          <label className="invite-label">Share Invite Link</label>
          <div className="invite-link-group">
            <div className="invite-link-box">
              <Link size={14} />
              <span className="link-text">{inviteLink}</span>
            </div>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamWorkspacePage = ({ team, onBack }) => {
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('chat'); // chat, activity
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (team?.id) {
      fetch(`/api/notes/team/${team.id}`)
        .then(res => res.json())
        .then(data => setNotes(data));
    }
  }, [team?.id]);

  const handleCreateNote = () => {
    setActiveNote({
      title: '',
      content: '',
      type: 'text',
      teamId: team.id,
      tag: 'TEAM'
    });
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeNote) {
    return (
      <TextEditorPage 
        note={activeNote} 
        teamSubject={team.name}
        onBack={(updated) => {
          setActiveNote(null);
          fetch(`/api/notes/team/${team.id}`)
            .then(res => res.json())
            .then(data => setNotes(data));
        }} 
      />
    );
  }

  return (
    <div className="team-workspace">
      {showInvite && <InviteModal team={team} onClose={() => setShowInvite(false)} />}
      
      {/* Top Bar */}
      <header className="team-topbar">
        <div className="team-topbar-left">
          <button className="back-to-dash" onClick={onBack}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="team-info">
            <h1 className="team-name">{team.name}</h1>
            <span className="team-status">Shared Workspace</span>
          </div>
        </div>
        
        <div className="team-topbar-center">
          <TeamPresence teamId={team.id} />
        </div>

        <div className="team-topbar-right">
          <button className="team-action-btn invite" onClick={() => setShowInvite(true)}>
            <Plus size={16} /> Invite
          </button>
          <button className="team-action-btn settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="team-workspace-body">
        {/* Left Sidebar */}
        <aside className="team-workspace-sidebar">
          <div className="sidebar-search">
            <Search size={14} className="search-icon" />
            <input 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <FileText size={14} />
              <span>SHARED NOTES</span>
              <button className="add-btn" onClick={handleCreateNote}>
                <Plus size={12} />
              </button>
            </div>
            <div className="sidebar-list">
              {filteredNotes.map(note => (
                <button 
                  key={note.id} 
                  className="sidebar-item"
                  onClick={() => setActiveNote(note)}
                >
                  <FileText size={14} />
                  <span>{note.title || 'Untitled Note'}</span>
                </button>
              ))}
              {filteredNotes.length === 0 && (
                <div className="empty-sidebar">No notes found</div>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <Users size={14} />
              <span>MEMBERS</span>
            </div>
            <div className="sidebar-list">
              {team.members?.map((member, i) => (
                <div key={i} className="member-item">
                  <div className="member-avatar">{member.charAt(0)}</div>
                  <span>{member}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="team-main-content">
          <div className="team-welcome">
            <div className="welcome-icon">
              <Users size={32} />
            </div>
            <h2>Welcome to {team.name}</h2>
            <p>Collaborate with your team in real-time. Choose a note to start editing or create a new one.</p>
            <div className="welcome-actions">
              <button className="btn btn-primary" onClick={handleCreateNote}>
                <Plus size={18} /> New Team Note
              </button>
              <button className="btn btn-secondary">
                <Share2 size={18} /> Export Workspace
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="team-right-panel">
          <div className="panel-tabs">
            <button 
              className={`panel-tab ${rightPanelTab === 'chat' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('chat')}
            >
              <MessageSquare size={16} />
              Chat
            </button>
            <button 
              className={`panel-tab ${rightPanelTab === 'activity' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('activity')}
            >
              <Activity size={16} />
              Activity
            </button>
          </div>

          <div className="panel-content">
            {rightPanelTab === 'chat' ? (
              <TeamChat teamId={team.id} />
            ) : (
              <div className="activity-feed">
                <div className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-text">
                    <strong>You</strong> joined the workspace
                    <span>Just now</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TeamWorkspacePage;
