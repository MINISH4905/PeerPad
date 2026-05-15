import { Home, Users, Sparkles, Settings, Plus, HelpCircle, Archive, Info } from 'lucide-react';
import classNames from 'classnames';

const Sidebar = ({ currentPage, onNavigate, onCreateNote }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'teams', label: 'My Teams', icon: Users },
    { id: 'ai', label: 'AI Tools', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo-title">PeerPad</h1>
        <p className="logo-subtitle">ACADEMIC SANCTUARY</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={classNames('nav-item', { active: currentPage === item.id })}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={20} className="nav-icon" />
            <span>{item.label}</span>
          </button>
        ))}

        <button className="btn btn-primary create-note-btn mt-6 w-full" onClick={onCreateNote}>
          <Plus size={20} />
          <span>Create Note</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <HelpCircle size={20} className="nav-icon" />
          <span>Help</span>
        </button>
        <button
          className={classNames('nav-item', { active: currentPage === 'archive' })}
          onClick={() => onNavigate('archive')}
        >
          <Archive size={20} className="nav-icon" />
          <span>Archive</span>
        </button>
        <button
          className={classNames('nav-item', { active: currentPage === 'about' })}
          onClick={() => onNavigate('about')}
        >
          <Info size={20} className="nav-icon" />
          <span>About Us</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;