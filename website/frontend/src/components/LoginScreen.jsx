import { useState } from 'react';
import './LoginScreen.css';

export function LoginScreen({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }
    setLoading(true);
    await onLogin(nickname.trim());
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 Secure Messaging</h1>
          <p>End-to-End Encrypted Chat</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="nickname">Choose a Nickname</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={50}
              disabled={loading}
              autoFocus
            />
            <small>No email or phone required. Just pick a name!</small>
          </div>
          
          <button type="submit" disabled={loading || !nickname.trim()}>
            {loading ? 'Creating Account...' : 'Start Chatting'}
          </button>
        </form>

        <div className="login-info">
          <h3>🔒 How It Works</h3>
          <ul>
            <li>Messages are encrypted on your device</li>
            <li>Only you and the recipient can read messages</li>
            <li>Server cannot decrypt your messages</li>
            <li>No personal information required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
