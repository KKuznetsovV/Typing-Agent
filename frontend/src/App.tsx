import { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import WelcomeScreen from './components/WelcomeScreen';

export interface User {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle token / error injected by the OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const errorParam = params.get('error');

    if (tokenParam) {
      localStorage.setItem('token', tokenParam);
      setToken(tokenParam);
      // Remove the token from the URL immediately to avoid leaking it
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch the current user whenever the token changes
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    setLoading(true);

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json() as Promise<User>;
      })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', fontFamily: 'sans-serif' }}>
        Loading…
      </div>
    );
  }

  return user ? (
    <WelcomeScreen user={user} onLogout={handleLogout} />
  ) : (
    <LoginScreen error={error} />
  );
}

export default App;
