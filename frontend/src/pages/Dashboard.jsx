import React from 'react';
import { useMirrorStats } from '../hooks/useMirrorQuery';
import './Dashboard.css';

function Dashboard() {
  // Use Mirror Node for FREE stats - no gas fees!
  const { data: stats, loading, error, cacheInfo, refetch } = useMirrorStats();

  if (loading) {
    return (
      <div>
        <div>⏳ Loading dashboard statistics from Hedera Mirror Node...</div>
        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
          💰 FREE blockchain queries - no gas fees!
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div style={{ color: 'red' }}>❌ Error loading dashboard: {error}</div>
        <button onClick={refetch} style={{ marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Dashboard</h1>
        {cacheInfo && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85em', color: '#666' }}>
              {cacheInfo.cached ? (
                <>📦 Cached ({Math.round(cacheInfo.cacheAge / 1000)}s ago)</>
              ) : (
                <>🆕 Fresh data</>
              )}
            </div>
            <div style={{ fontSize: '0.85em', color: '#28a745', fontWeight: 'bold' }}>
              💰 {cacheInfo.cost} - Mirror Node
            </div>
            <button onClick={refetch} style={{ marginTop: '5px', fontSize: '0.85em' }}>
              🔄 Refresh Stats
            </button>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.activePatients}</h3>
            <p>Active on Waitlist</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🫀</div>
          <div className="stat-info">
            <h3>{stats.totalOrgans}</h3>
            <p>Total Organs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.availableOrgans}</h3>
            <p>Available Organs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-info">
            <h3>{stats.matchesCompleted}</h3>
            <p>Transplants Completed</p>
          </div>
        </div>
      </div>

      <div className="dashboard-info">
        <div className="card">
          <h2>About This System</h2>
          <p>
            The Organ Waitlist Registry is a blockchain-based system built on Hedera that ensures
            transparency and fairness in organ allocation. All registrations and allocations are
            recorded on the blockchain for complete auditability.
          </p>
          <ul>
            <li>🔒 Immutable registration records</li>
            <li>⚖️ Fair queue management based on medical criteria</li>
            <li>🔍 Complete transparency with audit trails</li>
            <li>⛓️ Powered by Hedera's fast and secure network</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
