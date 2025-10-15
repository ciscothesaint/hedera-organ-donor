import React from 'react';
import { useMirrorStats } from '../hooks/useMirrorQuery';
import './Dashboard.css';

function Dashboard() {
  // Use Mirror Node for FREE stats - no gas fees!
  const { data: stats, loading, error, cacheInfo, refetch } = useMirrorStats();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="spinner-lg"></div>
        </div>
        <h3>Loading Dashboard Statistics</h3>
        <p>Fetching data from Hedera Mirror Node...</p>
        <div className="loading-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
          FREE blockchain queries - no gas fees!
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={refetch} className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <span className="wave">👋</span>
            Welcome to Your Dashboard
          </h1>
          <p>Monitor your organ waitlist registry in real-time</p>
        </div>

        {cacheInfo && (
          <div className="cache-info-card">
            <div className="cache-status">
              {cacheInfo.cached ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  Cached ({Math.round(cacheInfo.cacheAge / 1000)}s ago)
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Fresh data
                </>
              )}
            </div>
            <div className="mirror-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
              {cacheInfo.cost} - Mirror Node
            </div>
            <button onClick={refetch} className="btn-refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card patients" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-info">
            <h3 className="stat-number">{stats.totalPatients}</h3>
            <p className="stat-label">Total Patients</p>
          </div>
          <div className="stat-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Registered
          </div>
        </div>

        <div className="stat-card waitlist" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <h3 className="stat-number">{stats.activePatients}</h3>
            <p className="stat-label">Active on Waitlist</p>
          </div>
          <div className="stat-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Pending
          </div>
        </div>

        <div className="stat-card organs" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <div className="stat-info">
            <h3 className="stat-number">{stats.totalOrgans}</h3>
            <p className="stat-label">Total Organs</p>
          </div>
          <div className="stat-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Registry
          </div>
        </div>

        <div className="stat-card available" style={{ animationDelay: '0.4s' }}>
          <div className="stat-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <h3 className="stat-number">{stats.availableOrgans}</h3>
            <p className="stat-label">Available Organs</p>
          </div>
          <div className="stat-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Ready
          </div>
        </div>

        <div className="stat-card completed" style={{ animationDelay: '0.5s' }}>
          <div className="stat-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <h3 className="stat-number">{stats.matchesCompleted}</h3>
            <p className="stat-label">Transplants Completed</p>
          </div>
          <div className="stat-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            Success
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="dashboard-info">
        <div className="info-card">
          <div className="info-header">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h2>About This System</h2>
          </div>
          <p className="info-description">
            The Organ Waitlist Registry is a blockchain-based system built on Hedera that ensures
            transparency and fairness in organ allocation. All registrations and allocations are
            recorded on the blockchain for complete auditability.
          </p>
          <ul className="info-features">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Immutable registration records</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Fair queue management based on medical criteria</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>Complete transparency with audit trails</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
              <span>Powered by Hedera's fast and secure network</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
