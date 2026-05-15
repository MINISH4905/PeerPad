import { useState, useEffect } from 'react';
import { User, Bell, Palette, Key, Trash2, ChevronRight, Moon, Sun, Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Toggle = ({ value, onChange }) => (
  <button
    className={`settings-toggle ${value ? 'on' : ''}`}
    onClick={() => onChange(!value)}
  >
    <span className="settings-toggle-thumb" />
  </button>
);

const SettingsPage = () => {
  const { user, updateSettings, deleteAccount, logout } = useAuth();
  
  const [settings, setSettings] = useState(user?.settings || {
    darkMode: false,
    notifications: true,
    emailUpdates: true,
    aiSuggestions: true,
    autoSave: true,
    language: 'English'
  });

  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  const handleUpdate = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaveStatus('saving');
    
    const success = await updateSettings(newSettings);
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This will delete all your notes and account data forever.')) {
      await deleteAccount();
    }
  };

  const sections = [
    {
      title: 'Account',
      icon: User,
      items: [
        {
          label: 'Profile',
          desc: user?.email || 'Name, email, avatar',
          action: <ChevronRight size={16} className="settings-chevron" />,
        },
        {
          label: 'Change Password',
          desc: 'Update your password',
          action: <ChevronRight size={16} className="settings-chevron" />,
        },
        {
          label: 'Logout',
          desc: 'Sign out of your account',
          action: (
            <button className="settings-logout-btn" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          ),
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Push Notifications',
          desc: 'Team updates and mentions',
          action: <Toggle value={settings.notifications} onChange={(val) => handleUpdate('notifications', val)} />,
        },
        {
          label: 'Email Updates',
          desc: 'Weekly summaries and invites',
          action: <Toggle value={settings.emailUpdates} onChange={(val) => handleUpdate('emailUpdates', val)} />,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          label: 'Dark Mode',
          desc: 'Switch to dark theme',
          action: (
            <div className="settings-dark-toggle">
              <Sun size={14} />
              <Toggle value={settings.darkMode} onChange={(val) => handleUpdate('darkMode', val)} />
              <Moon size={14} />
            </div>
          ),
        },
        {
          label: 'Language',
          desc: 'Display language',
          action: (
            <select
              className="settings-select"
              value={settings.language}
              onChange={e => handleUpdate('language', e.target.value)}
            >
              <option>English</option>
              <option>Tamil</option>
              <option>Hindi</option>
              <option>French</option>
              <option>Spanish</option>
            </select>
          ),
        },
      ],
    },
    {
      title: 'AI & Features',
      icon: Key,
      items: [
        {
          label: 'AI Suggestions',
          desc: 'Smart note summaries and insights',
          action: <Toggle value={settings.aiSuggestions} onChange={(val) => handleUpdate('aiSuggestions', val)} />,
        },
        {
          label: 'Auto-Save',
          desc: 'Automatically save notes as you type',
          action: <Toggle value={settings.autoSave} onChange={(val) => handleUpdate('autoSave', val)} />,
        },
      ],
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-sub">Manage your account and app behavior.</p>
          </div>
          {saveStatus !== 'idle' && (
            <div className={`settings-save-status ${saveStatus}`}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? <Check size={14} /> : 'Error'}
            </div>
          )}
        </div>
      </div>

      <div className="settings-content">
        {sections.map(section => (
          <div key={section.title} className="settings-section">
            <div className="settings-section-header">
              <section.icon size={16} className="settings-section-icon" />
              <h2 className="settings-section-title">{section.title}</h2>
            </div>
            <div className="settings-section-body">
              {section.items.map((item, i) => (
                <div key={i} className="settings-row">
                  <div className="settings-row-text">
                    <span className="settings-row-label">{item.label}</span>
                    <span className="settings-row-desc">{item.desc}</span>
                  </div>
                  <div className="settings-row-action">{item.action}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="settings-section settings-danger-section">
          <div className="settings-section-header">
            <Trash2 size={16} style={{ color: '#ef4444' }} />
            <h2 className="settings-section-title" style={{ color: '#ef4444' }}>Danger Zone</h2>
          </div>
          <div className="settings-section-body">
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-row-label">Delete Account</span>
                <span className="settings-row-desc">Permanently delete your account and all data.</span>
              </div>
              <button className="settings-danger-btn" onClick={handleDeleteAccount}>Delete Account</button>
            </div>
          </div>
        </div>

        <p className="settings-version">PeerPad v1.0.0 — Academic Sanctuary</p>
      </div>
    </div>
  );
};

export default SettingsPage;