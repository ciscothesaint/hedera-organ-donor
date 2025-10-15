import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import './Layout.css';

function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h2>Organ Waitlist Registry</h2>
            <span className="network-badge">Hedera Testnet</span>
          </div>
          <div className="navbar-user">
            <span className="user-name">{user?.username}</span>
            <span className="badge badge-info">{user?.role}</span>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <Link to="/dashboard">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            </li>

            <li className="menu-divider">Patients</li>

            <li>
              <Link to="/patients">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                All Patients
              </Link>
            </li>

            {user?.permissions?.canRegisterPatients && (
              <li>
                <Link to="/patients/register">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register Patient
                </Link>
              </li>
            )}

            <li className="menu-divider">Organs</li>

            <li>
              <Link to="/organs">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                All Organs
              </Link>
            </li>

            {user?.permissions?.canRegisterOrgans && (
              <li>
                <Link to="/organs/register">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Register Organ
                </Link>
              </li>
            )}

            <li className="menu-divider">Waitlists</li>

            <li>
              <Link to="/waitlist/HEART">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Heart Waitlist
              </Link>
            </li>

            <li>
              <Link to="/waitlist/LIVER">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Liver Waitlist
              </Link>
            </li>

            <li>
              <Link to="/waitlist/KIDNEY">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Kidney Waitlist
              </Link>
            </li>

            <li>
              <Link to="/waitlist/LUNG">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Lung Waitlist
              </Link>
            </li>

            <li>
              <Link to="/waitlist/PANCREAS">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pancreas Waitlist
              </Link>
            </li>

            <li className="menu-divider">DAO Governance</li>

            <li>
              <Link to="/dao-users">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                DAO Users
              </Link>
            </li>
          </ul>
        </aside>

        <main className="content">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
