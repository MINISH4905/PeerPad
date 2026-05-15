import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('peerpad_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('peerpad_token', data.access_token);
      localStorage.setItem('peerpad_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    }
    const errData = await response.json().catch(() => ({}));
    return { success: false, detail: errData.detail || 'Login failed' };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('peerpad_token', data.access_token);
      localStorage.setItem('peerpad_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    }
    const errData = await response.json().catch(() => ({}));
    return { success: false, detail: errData.detail || 'Registration failed' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('peerpad_token');
    localStorage.removeItem('peerpad_user');
    setUser(null);
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    if (!user) return;
    const response = await fetch(`/api/auth/settings/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (response.ok) {
      const updatedUser = { ...user, settings: newSettings };
      setUser(updatedUser);
      localStorage.setItem('peerpad_user', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const response = await fetch(`/api/auth/account/${user.id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      logout();
      return true;
    }
    return false;
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateSettings, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
