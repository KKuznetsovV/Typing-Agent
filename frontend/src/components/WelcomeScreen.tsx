import React from 'react';
import type { User } from '../App';

interface WelcomeScreenProps {
  user: User;
  onLogout: () => void;
}

function WelcomeScreen({ user, onLogout }: WelcomeScreenProps) {
  const displayName = user.displayName ?? user.username;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt={displayName} style={styles.avatar} />
        )}
        <h1 style={styles.title}>Welcome, {displayName}!</h1>
        <p style={styles.username}>@{user.username}</p>
        <p style={styles.message}>You are successfully authenticated via GitHub.</p>
        <button onClick={onLogout} style={styles.button}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '2.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    textAlign: 'center',
    minWidth: '320px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    marginBottom: '1rem',
    border: '3px solid #e2e8f0',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 0.25rem',
  },
  username: {
    color: '#718096',
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
  message: {
    color: '#4a5568',
    marginBottom: '1.5rem',
  },
  button: {
    padding: '0.75rem 2rem',
    backgroundColor: '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

export default WelcomeScreen;
