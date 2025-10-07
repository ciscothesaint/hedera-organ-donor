import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organAPI } from '../services/api';

function RegisterOrgan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    organId: '',
    organInfo: {
      organType: 'HEART',
      bloodType: 'O+',
      weight: 300,
      viabilityHours: 6,
      quality: 'GOOD',
    },
    hospitalInfo: {
      hospitalId: 'HOSP001',
      hospitalName: '',
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await organAPI.register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/organs'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register organ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card">
        <div className="alert alert-success">
          ✅ Organ registered successfully! Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Register New Organ</h1>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Organ ID</label>
            <input
              className="input"
              value={formData.organId}
              onChange={(e) => setFormData({ ...formData, organId: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="label">Organ Type</label>
              <select
                className="input"
                value={formData.organInfo.organType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organInfo: { ...formData.organInfo, organType: e.target.value },
                  })
                }
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
                value={formData.organInfo.bloodType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organInfo: { ...formData.organInfo, bloodType: e.target.value },
                  })
                }
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="label">Weight (grams)</label>
              <input
                type="number"
                className="input"
                value={formData.organInfo.weight}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organInfo: { ...formData.organInfo, weight: parseInt(e.target.value) },
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Viability (hours)</label>
              <input
                type="number"
                className="input"
                value={formData.organInfo.viabilityHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organInfo: { ...formData.organInfo, viabilityHours: parseInt(e.target.value) },
                  })
                }
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register Organ'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterOrgan;
