import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mvm_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('mvm_token')) return setLoading(false);
    api.get('/auth/me')
      .then(r => {
        setUser(r.data.user);
        localStorage.setItem('mvm_user', JSON.stringify(r.data.user));
      })
      .catch(() => {
        localStorage.removeItem('mvm_token');
        localStorage.removeItem('mvm_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = data => {
    localStorage.setItem('mvm_token', data.token);
    localStorage.setItem('mvm_user', JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('mvm_token');
    localStorage.removeItem('mvm_user');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, save, logout }}>{children}</AuthContext.Provider>;
}
