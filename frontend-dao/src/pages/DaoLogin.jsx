import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDaoAuthStore } from '../services/daoAuthStore';
import { daoAuthAPI } from '../services/daoApi';
import './DaoLogin.css';

function DaoLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginDoctor } = useDaoAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await daoAuthAPI.login({ email, password });
      const { token, user } = response.data;

      loginDoctor(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dao-login-container">
      <div className="dao-login-card">
        <div className="dao-login-header">
          <h1>DAO Governance</h1>
          <p>Organ Waitlist Registry</p>
        </div>

        <form onSubmit={handleSubmit} className="dao-login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to DAO'}
          </button>
        </form>

        <div className="dao-login-footer">
          <p>
            Not a member? <Link to="/register">Register as Medical Professional</Link>
          </p>
          <div className="divider">
            <span>or</span>
          </div>
          <p className="admin-link">
            <a href="http://localhost:5173/login">Access Admin Platform</a>
          </p>
          <div className="security-badge">
            Secure blockchain authentication
          </div>
          <div className="powered-by">
            <small>Powered by Hedera Hashgraph</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DaoLogin;
