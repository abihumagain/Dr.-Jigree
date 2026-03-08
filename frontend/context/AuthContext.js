/**
 * Auth Context – provides user state and login/logout helpers throughout the app.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('drjigree_token');
    const storedUser = localStorage.getItem('drjigree_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
    }
    setReady(true);
  }, []);

  const login = (tok, usr) => {
    localStorage.setItem('drjigree_token', tok);
    localStorage.setItem('drjigree_user', JSON.stringify(usr));
    axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    setToken(tok);
    setUser(usr);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('drjigree_token');
    localStorage.removeItem('drjigree_user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem('drjigree_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
