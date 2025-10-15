import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../services/api';

function RegisterPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate random patient ID
  const generatePatientId = () => {
    // Format: PT-YYYYMMDD-XXXX (e.g., PT-20250116-5823)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PT-${year}${month}${day}-${random}`;
  };

  const [formData, setFormData] = useState({
    patientId: generatePatientId(),
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      contactNumber: '',
      email: '',
    },
    medicalInfo: {
      organType: 'HEART',
      bloodType: 'O+',
      urgencyLevel: 3,
      medicalScore: 50,
      weight: 70,
      height: 170,
      diagnosis: '',
    },
    hospitalInfo: {
      hospitalId: 'HOSP001',
      hospitalName: '',
      attendingPhysician: '',
    },
  });

  const handleRefreshPatientId = () => {
    setFormData({ ...formData, patientId: generatePatientId() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await patientAPI.register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/patients'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (success) {
    return (
      <div className="card">
        <div className="alert alert-success">
          ✅ Patient registered successfully! Redirecting to patient list...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Register New Patient</h1>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <h3>Patient Information</h3>

          <div className="form-group">
            <label className="label">Patient ID</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                className="input"
                value={formData.patientId}
                readOnly
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefreshPatientId}
                style={{
                  padding: '8px 16px',
                  minWidth: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Generate new Patient ID"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ display: 'block' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>
              Auto-generated ID. Click refresh to generate a new one.
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="label">First Name</label>
              <input
                className="input"
                value={formData.personalInfo.firstName}
                onChange={(e) => updateField('personalInfo', 'firstName', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Last Name</label>
              <input
                className="input"
                value={formData.personalInfo.lastName}
                onChange={(e) => updateField('personalInfo', 'lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="label">Date of Birth</label>
              <input
                type="date"
                className="input"
                value={formData.personalInfo.dateOfBirth}
                onChange={(e) => updateField('personalInfo', 'dateOfBirth', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Gender</label>
              <select
                className="input"
                value={formData.personalInfo.gender}
                onChange={(e) => updateField('personalInfo', 'gender', e.target.value)}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <h3 style={{ marginTop: '30px' }}>Medical Information</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="label">Organ Type</label>
              <select
                className="input"
                value={formData.medicalInfo.organType}
                onChange={(e) => updateField('medicalInfo', 'organType', e.target.value)}
              >
                <option value="HEART">Heart</option>
                <option value="LIVER">Liver</option>
                <option value="KIDNEY">Kidney</option>
                <option value="LUNG">Lung</option>
                <option value="PANCREAS">Pancreas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Blood Type</label>
              <select
                className="input"
                value={formData.medicalInfo.bloodType}
                onChange={(e) => updateField('medicalInfo', 'bloodType', e.target.value)}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Urgency Level (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                className="input"
                value={formData.medicalInfo.urgencyLevel}
                onChange={(e) => updateField('medicalInfo', 'urgencyLevel', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register Patient'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPatient;
