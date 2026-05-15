import { useState, useEffect } from 'react';
import { Users, Check, X, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const JoinTeamPage = ({ teamId, onJoined, onCancel }) => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then(res => {
        if (!res.ok) throw new Error('Invite link is invalid or expired');
        return res.json();
      })
      .then(data => {
        setTeam(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [teamId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
        onJoined();
      } else {
        throw new Error('Failed to join team');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <div className="join-page">
      <div className="join-card loading">
        <Loader className="spin" size={32} />
        <p>Verifying invitation...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="join-page">
      <div className="join-card error">
        <div className="error-icon"><X size={32} /></div>
        <h2>Invalid Invitation</h2>
        <p>{error}</p>
        <button className="btn btn-secondary w-full" onClick={onCancel}>Back to Dashboard</button>
      </div>
    </div>
  );

  const isAlreadyMember = team.members?.includes(user.email);

  return (
    <div className="join-page">
      <div className="join-card">
        <div className="join-icon">
          <Users size={32} />
        </div>
        <span className="join-label">TEAM INVITATION</span>
        <h1 className="join-title">Join {team.name}</h1>
        <p className="join-desc">
          You've been invited to collaborate on <strong>{team.name}</strong>. 
          Share notes, chat with members, and study together.
        </p>

        <div className="join-meta">
          <div className="meta-item">
            <strong>{team.members?.length || 0}</strong>
            <span>Members</span>
          </div>
          <div className="meta-item">
            <strong>{team.subjects?.length || 0}</strong>
            <span>Subjects</span>
          </div>
        </div>

        {isAlreadyMember ? (
          <div className="join-status-box success">
            <Check size={16} />
            <span>You are already a member of this team.</span>
            <button className="btn btn-primary w-full mt-4" onClick={onJoined}>
              Open Workspace <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="join-actions">
            <button 
              className="btn btn-primary w-full join-btn" 
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? <Loader className="spin" size={18} /> : 'Accept Invitation'}
            </button>
            <button className="btn btn-secondary w-full" onClick={onCancel}>
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinTeamPage;
