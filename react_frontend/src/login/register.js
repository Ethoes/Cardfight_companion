import React, { useState } from 'react';

// Import API base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Register({ onRegister, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onRegister();
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error registering user');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegister();
  };

  return (
    <div className="auth-screen">
      <form className="auth-card Register" onSubmit={handleSubmit}>
        <p className="auth-brand">Cardfight Companion</p>
        <h2>Register</h2>
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
          autoComplete="new-password"
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-primary">Register</button>
        {onCancel && (
          <button type="button" className="auth-secondary" onClick={onCancel}>
            Back to login
          </button>
        )}
      </form>
    </div>
  );
}

export default Register;