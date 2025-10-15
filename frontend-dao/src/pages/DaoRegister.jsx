import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { daoAuthAPI } from '../services/daoApi';
import './DaoLogin.css';

function DaoRegister() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    medicalLicenseNumber: '',
    licenseState: '',
    specialization: '',
    yearsOfExperience: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await daoAuthAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        medicalLicenseNumber: formData.medicalLicenseNumber,
        licenseState: formData.licenseState,
        specialization: formData.specialization,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="dao-login-container">
        <div className="dao-login-card">
          <div className="dao-login-header">
            <h1>✅ Registration Successful!</h1>
          </div>
          <div className="alert alert-success">
            <p>Your account has been created and is pending authorization.</p>
            <p>You will be notified once an administrator approves your account.</p>
            <p style={{ marginTop: '16px' }}>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dao-login-container">
      <div className="dao-login-card" style={{ maxWidth: '600px' }}>
        <div className="dao-login-header">
          <h1>🩺 Register as Medical Professional</h1>
          <p>Join the DAO Governance Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="dao-login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="label">First Name *</label>
              <input
                type="text"
                className="input"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="label">Last Name *</label>
              <input
                type="text"
                className="input"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Username *</label>
            <input
              type="text"
              className="input"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="dr_smith"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@hospital.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="label">Password *</label>
              <input
                type="password"
                className="input"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="label">Confirm Password *</label>
              <input
                type="password"
                className="input"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="label">Medical License Number *</label>
              <input
                type="text"
                className="input"
                name="medicalLicenseNumber"
                value={formData.medicalLicenseNumber}
                onChange={handleChange}
                placeholder="MD123456"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="label">State *</label>
              <input
                type="text"
                className="input"
                name="licenseState"
                value={formData.licenseState}
                onChange={handleChange}
                placeholder="NY"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="label">Specialization</label>
              <input
                type="text"
                className="input"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="Transplant Surgery"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="label">Years of Experience</label>
              <input
                type="number"
                className="input"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                placeholder="15"
                min="0"
                disabled={loading}
              />
            </div>
          </div>


          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div className="dao-login-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DaoRegister;
