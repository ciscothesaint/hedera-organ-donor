import React, { useState, useEffect } from 'react';
import mirrorAPI from '../services/mirrorApi';
import '../styles/waitlist.css';

const ORGAN_TYPES = [
  { type: 'HEART', icon: '❤️', label: 'Heart' },
  { type: 'LIVER', icon: '🫁', label: 'Liver' },
  { type: 'KIDNEY', icon: '🫘', label: 'Kidney' },
  { type: 'LUNG', icon: '🫁', label: 'Lung' },
  { type: 'PANCREAS', icon: '🥞', label: 'Pancreas' },
];

function WaitlistTabs() {
  const [activeTab, setActiveTab] = useState('HEART');
  const [waitlistData, setWaitlistData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWaitlist = async (organType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mirrorAPI.getWaitlist(organType);
      const data = response.data.data;
      // Backend returns { waitlist: [...], count: ... }
      const waitlist = data?.waitlist || [];
      setWaitlistData(waitlist);
    } catch (err) {
      console.error('Error fetching waitlist:', err);
      setError('Unable to load waitlist data');
      setWaitlistData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist(activeTab);
  }, [activeTab]);

  const handleTabClick = (organType) => {
    setActiveTab(organType);
  };

  return (
    <div className="waitlist-section" id="waitlists">
      <div className="waitlist-header">
        <h2>Live Organ Waitlists</h2>
        <p className="waitlist-subtitle">
          Real-time patient queue data, verified on blockchain
        </p>
      </div>

      <div className="waitlist-tabs">
        {ORGAN_TYPES.map((organ) => (
          <button
            key={organ.type}
            className={`tab-button ${activeTab === organ.type ? 'active' : ''}`}
            onClick={() => handleTabClick(organ.type)}
          >
            <span className="tab-icon">{organ.icon}</span>
            <span className="tab-label">{organ.label}</span>
          </button>
        ))}
      </div>

      <div className="waitlist-content">
        {loading ? (
          <div className="waitlist-loading">
            <div className="loading-spinner large"></div>
            <p>Loading waitlist from blockchain...</p>
          </div>
        ) : error ? (
          <div className="waitlist-error">
            <p>{error}</p>
            <button onClick={() => fetchWaitlist(activeTab)}>Retry</button>
          </div>
        ) : (
          <WaitlistTable data={waitlistData} organType={activeTab} />
        )}
      </div>
    </div>
  );
}

function WaitlistTable({ data, organType }) {
  const hashScanUrl = import.meta.env.VITE_HASHSCAN_URL || 'https://hashscan.io/testnet';

  if (data.length === 0) {
    return (
      <div className="empty-waitlist">
        <div className="empty-icon">📋</div>
        <h3>No patients currently waiting for {organType.toLowerCase()}</h3>
        <p>This waitlist is currently empty</p>
      </div>
    );
  }

  return (
    <div className="waitlist-table-wrapper">
      <div className="table-info">
        <span className="table-count">
          {data.length} {data.length === 1 ? 'patient' : 'patients'} waiting
        </span>
        <span className="table-badge">
          <span className="verified-icon">✅</span>
          Blockchain Verified
        </span>
      </div>

      <table className="waitlist-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Patient ID</th>
            <th>Blood Type</th>
            <th>Urgency</th>
            <th>Blockchain</th>
          </tr>
        </thead>
        <tbody>
          {data.map((patient, index) => (
            <tr key={patient.patientHash || index}>
              <td>
                <div className="position-badge">#{index + 1}</div>
              </td>
              <td>
                <span className="patient-id">{patient.patientId || 'N/A'}</span>
              </td>
              <td>
                <span className="blood-type">{patient.bloodType || 'N/A'}</span>
              </td>
              <td>
                <span className={`urgency-badge urgency-${(patient.urgency || 'ROUTINE').toLowerCase()}`}>
                  {patient.urgency || 'ROUTINE'}
                </span>
              </td>
              <td>
                <a
                  href={`${hashScanUrl}/transaction/${patient.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blockchain-link"
                  title={`View on Hashscan: ${patient.patientHash}`}
                >
                  ✅ View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WaitlistTabs;
