import React, { useState } from 'react';

// Import API base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.username || username);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error logging in');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="auth-screen">
      <form className="auth-card Login" onSubmit={handleSubmit}>
        <p className="auth-brand">Cardfight Companion</p>
        <h2>Login</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-primary">Login</button>
        {onShowRegister && (
          <button type="button" className="auth-secondary" onClick={onShowRegister}>
            Create an account
          </button>
        )}
      </form>
    </div>
  );
}

export default Login;