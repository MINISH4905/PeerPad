import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TeamNotes from './pages/TeamNotes';
import DrawingCanvasPage from './pages/DrawingCanvasPage';
import AIToolsPage from './pages/AIToolsPage';
import TextEditorPage from './pages/TextEditorPage';
import SettingsPage from './pages/Settingspage';
import ArchivePage from './pages/ArchivePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import JoinTeamPage from './pages/JoinTeamPage';
import TeamWorkspacePage from './pages/TeamWorkspacePage';
import { SyncProvider } from './context/SyncContext';
import { TeamProvider } from './context/TeamContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useSocket } from './hooks/useSocket';

function AppContent() {
  const { user, loading } = useAuth();
  const { on, off, emit } = useSocket();
  const [currentPage, setCurrentPage] = useState('home');
  const [activeNote, setActiveNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activeTeam, setActiveTeam] = useState(null);
  const [inviteTeamId, setInviteTeamId] = useState(null);
  const [teamNotes, setTeamNotes] = useState([]);

  // Check for invite link on load
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const id = path.split('/')[2];
      if (id) setInviteTeamId(id);
    }
  }, []);

  // Fetch initial notes if user is logged in
  useEffect(() => {
    if (user) {
      fetch(`/api/notes/user/${user.id}`)
        .then(res => res.json())
        .then(data => setNotes(data))
        .catch(err => console.error('Error fetching notes:', err));
      
      fetch(`/api/teams/user/${user.email}`)
        .then(res => res.json())
        .then(data => setTeams(data));

      fetch(`/api/teams/invites/${user.email}`)
        .then(res => res.json())
        .then(data => setInvites(data));
    }
  }, [user]);

  // Join Team Rooms and Listen for Updates
  useEffect(() => {
    if (user && teams.length > 0) {
      teams.forEach(t => {
        emit('join_room', { teamId: t.id });
      });

      const handleTeamUpdate = (data) => {
        // Refresh the current user's notes
        fetch(`/api/notes/user/${user.id}`)
          .then(res => res.json())
          .then(notesData => setNotes(notesData));
        // Also refresh team notes so all collaborators see updates
        if (data?.teamId) {
          fetch(`/api/notes/team/${data.teamId}`)
            .then(res => res.json())
            .then(data => setTeamNotes(data))
            .catch(() => {});
        } else if (activeTeamId) {
          fetch(`/api/notes/team/${activeTeamId}`)
            .then(res => res.json())
            .then(data => setTeamNotes(data))
            .catch(() => {});
        }
      };

      on('team_note_update', handleTeamUpdate);
      return () => off('team_note_update', handleTeamUpdate);
    }
  }, [user, teams, activeTeamId, emit, on, off]);

  // Fetch team notes from server when a team is selected
  useEffect(() => {
    if (activeTeamId) {
      fetch(`/api/notes/team/${activeTeamId}`)
        .then(res => res.json())
        .then(data => setTeamNotes(data))
        .catch(err => console.error('Error fetching team notes:', err));
    } else {
      setTeamNotes([]);
    }
  }, [activeTeamId]);


  useEffect(() => {
    if (user && currentPage === 'archive') {
      fetch(`/api/notes/user/${user.id}/archived`)
        .then(res => res.json())
        .then(data => setArchivedNotes(data))
        .catch(err => console.error('Error fetching archived notes:', err));
    }
  }, [user, currentPage]);

  // Apply theme
  useEffect(() => {
    const isDark = user?.settings?.darkMode;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [user?.settings?.darkMode]);

  const handleSaveAndBack = useCallback(async (noteData) => {
    if (noteData) {
      const isExisting = noteData.id && noteData.id !== 'None' && noteData.id !== 'undefined';
      const method = isExisting ? 'PATCH' : 'POST';
      const url = isExisting ? `/api/notes/${noteData.id}` : '/api/notes';
      
      const payload = {
        ...noteData,
        owner_id: user.id,
        owner_name: user.name,
        owner_email: user.email,
      };

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const savedNote = await response.json();
          if (method === 'POST') {
            setNotes(prev => [savedNote, ...prev]);
          } else {
            setNotes(prev => prev.map(n => n.id === noteData.id ? savedNote : n));
          }
          
          if (savedNote.teamId) {
            emit('team_note_update', { teamId: savedNote.teamId, action: method === 'POST' ? 'create' : 'update', note: savedNote });
            // Refresh team notes so all collaborators' work is visible
            fetch(`/api/notes/team/${savedNote.teamId}`)
              .then(res => res.json())
              .then(data => setTeamNotes(data))
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error('Save error:', err);
      }
    }
    setActiveNote(null);
  }, [user, emit]);

  // Rest of handlers simplified for MVP backend sync...
  const handleDeleteNote = useCallback(async (noteId) => {
    if (!noteId || noteId === 'None' || noteId === 'undefined') {
      console.warn('Attempted to delete note with invalid ID:', noteId);
      return;
    }
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (response.ok) {
        const deletedNote = notes.find(n => n.id === noteId) || teamNotes.find(n => n.id === noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
        setTeamNotes(prev => prev.filter(n => n.id !== noteId));
        if (deletedNote?.teamId) {
          emit('team_note_update', { teamId: deletedNote.teamId, action: 'delete', noteId });
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [notes, teamNotes, emit]);

  const handleRestoreNote = useCallback(async (noteId) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/restore`, { method: 'POST' });
      if (response.ok) {
        // Refresh notes
        fetch(`/api/notes/user/${user.id}`)
          .then(res => res.json())
          .then(data => setNotes(data));
        setArchivedNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('Restore error:', err);
    }
  }, [user]);

  const handleCreateTeam = useCallback(async (teamData) => {
    const payload = {
      ...teamData,
      owner_id: user.id,
      members: [user.email],
      pending_invites: teamData.members || []
    };
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const newTeam = await response.json();
      setTeams(prev => [...prev, newTeam]);
    }
  }, [user]);

  const handleExitTeam = useCallback(async (teamId) => {
    // For now just local remove, backend needs endpoint
    setTeams(prev => prev.filter(t => t.id !== teamId));
  }, []);

  const handleDeleteTeam = useCallback(async (teamId) => {
    if (!window.confirm('Delete this workspace? This will remove all shared notes for everyone.')) return;
    const response = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
    if (response.ok) {
      setTeams(prev => prev.filter(t => t.id !== teamId));
    }
  }, []);

  const handlePermanentDeleteNote = useCallback(async (noteId) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/permanent`, { method: 'DELETE' });
      if (response.ok) {
        setArchivedNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('Permanent delete error:', err);
    }
  }, []);

  if (loading) return <div className="loading-screen">Loading PeerPad...</div>;
  if (!user) return <LoginPage />;

  const renderPage = () => {
    if (inviteTeamId) {
      return (
        <JoinTeamPage 
          teamId={inviteTeamId} 
          onJoined={() => {
            setInviteTeamId(null);
            setCurrentPage('teams');
            // Refresh teams
            if (user) {
              fetch(`/api/teams/user/${user.email}`)
                .then(res => res.json())
                .then(data => setTeams(data));
            }
          }}
          onCancel={() => setInviteTeamId(null)}
        />
      );
    }

    if (activeNote) {
      if (activeNote.type === 'drawing')
        return <DrawingCanvasPage note={activeNote} onBack={handleSaveAndBack} />;
      if (activeNote.type === 'text') {
        const team = activeNote.teamId ? teams.find(t => t.id === activeNote.teamId) : null;
        return (
          <TextEditorPage
            note={activeNote}
            onBack={handleSaveAndBack}
            teamSubjects={team?.subjects || []}
          />
        );
      }
    }

    if (currentPage === 'team_workspace' && activeTeam) {
      return <TeamWorkspacePage team={activeTeam} onBack={() => setCurrentPage('teams')} />;
    }

    switch (currentPage) {
      case 'home':
        return <Dashboard 
          notes={notes.filter(n => !n.teamId)} 
          invites={invites}
          user={user}
          onOpenNote={setActiveNote} 
          onDeleteNote={handleDeleteNote}
        />;
      case 'teams':
        return <TeamNotes 
          teams={teams} 
          invites={invites}
          user={user}
          activeTeamId={activeTeamId}
          onSelectTeam={setActiveTeamId}
          onCreateTeam={handleCreateTeam}
          onExitTeam={handleExitTeam}
          onDeleteTeam={handleDeleteTeam}
          onOpenNote={setActiveNote}
          onDeleteNote={handleDeleteNote}
          teamNotes={teamNotes}
          onSaveNote={handleSaveAndBack}
        />;
      case 'ai':
        return <AIToolsPage onSaveNote={handleSaveAndBack} />;
      case 'settings':
        return <SettingsPage />;
      case 'archive':
        return (
          <ArchivePage
            archivedNotes={archivedNotes}
            onRestore={handleRestoreNote}
            onPermanentDelete={handlePermanentDeleteNote}
          />
        );
      case 'about':
        return <AboutPage />;
      default:
        return <Dashboard notes={notes} onOpenNote={setActiveNote} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onCreateNote={() => setActiveNote({ type: 'text' })}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SyncProvider>
          <TeamProvider>
            <AppContent />
          </TeamProvider>
        </SyncProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;