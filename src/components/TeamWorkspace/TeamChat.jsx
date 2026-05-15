import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

const TeamChat = ({ teamId }) => {
  const { user } = useAuth();
  const { on, off, emit } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (teamId) {
      const handleMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
      };
      on('chat_message', handleMessage);
      return () => off('chat_message');
    }
  }, [teamId, on, off]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = {
      teamId,
      sender: user.name,
      userId: user.id,
      text: input,
      timestamp: new Date().toISOString()
    };

    emit('chat_message', msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <div className="team-chat">
      <div className="chat-messages hidden-scrollbar">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-wrapper ${msg.userId === user.id ? 'mine' : ''}`}>
            <div className="chat-bubble">
              <div className="chat-meta">
                <span className="chat-sender">{msg.sender}</span>
                <span className="chat-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="chat-text">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form className="chat-input-area" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default TeamChat;
