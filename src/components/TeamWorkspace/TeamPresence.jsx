import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

const TeamPresence = ({ teamId }) => {
  const { user } = useAuth();
  const { on, off, emit } = useSocket();
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (teamId && user) {
      // Announce presence
      emit('join_room', { teamId, user: { id: user.id, name: user.name } });
      
      const handlePresence = (data) => {
        // This would be more complex with a real presence server, 
        // but for MVP we just show a list of who joined recently
        if (data.user && data.user.id !== user.id) {
          setActiveUsers(prev => {
            if (prev.find(u => u.id === data.user.id)) return prev;
            return [...prev, data.user];
          });
        }
      };

      on('user_presence', handlePresence);
      return () => {
        off('user_presence');
        emit('leave_room', { teamId });
      };
    }
  }, [teamId, user, on, off, emit]);

  return (
    <div className="team-presence">
      <div className="presence-avatars">
        {/* Current User */}
        <div className="presence-avatar me" title={`${user?.name} (You)`}>
          {user?.name?.charAt(0).toUpperCase()}
          <span className="presence-dot" />
        </div>
        
        {activeUsers.map(u => (
          <div key={u.id} className="presence-avatar" title={u.name}>
            {u.name?.charAt(0).toUpperCase()}
            <span className="presence-dot" />
          </div>
        ))}

        {activeUsers.length === 0 && (
          <div className="presence-empty">Solo Session</div>
        )}
      </div>
    </div>
  );
};

export default TeamPresence;
