import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ChatScreen } from './components/ChatScreen';
import { getUserData, saveUserData, clearUserData } from './utils/storage';
import { generateRSAKeyPair, exportRSAPublicKey, exportRSAPrivateKey } from './utils/crypto-utils';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const loadUser = async () => {
      try {
        const savedUser = getUserData();
        if (savedUser.userId && savedUser.nickname && savedUser.publicKey && savedUser.privateKey) {
          setUser(savedUser);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const handleLogin = async (nickname) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if backend is reachable
      try {
        const healthCheck = await fetch(`${API_URL}/health`);
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding. Make sure the backend is running on port 3001.');
        }
      } catch (err) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running.');
      }
      
      // Generate RSA key pair for encryption
      const keyPair = await generateRSAKeyPair();
      const publicKeyString = await exportRSAPublicKey(keyPair.publicKey);
      const privateKeyString = await exportRSAPrivateKey(keyPair.privateKey);

      // Register/login user
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, publicKey: publicKeyString })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      
      // Save user data locally
      saveUserData(data.userId, data.nickname, publicKeyString, privateKeyString);
      
      setUser({
        userId: data.userId,
        nickname: data.nickname,
        publicKey: publicKeyString,
        privateKey: privateKeyString
      });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
      alert(error.message || 'Failed to login. Please check that the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearUserData();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading">
        <div style={{ color: 'red', marginBottom: '1rem' }}>⚠️ {error}</div>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  return (
    <div className="app">
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <ChatScreen user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
