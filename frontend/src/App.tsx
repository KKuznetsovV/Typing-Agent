import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Welcome } from './components/Welcome';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="auth-screen">Loading...</div>;

  return user ? <Welcome /> : <Login />;
}

export default App;
