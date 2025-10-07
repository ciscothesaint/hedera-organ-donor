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
        <div className="container navbar-content">
          <div className="navbar-brand">
            <h2>🏥 Organ Waitlist Registry</h2>
            <span className="network-badge">Hedera Testnet</span>
          </div>
          <div className="navbar-user">
            <span>{user?.username}</span>
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
              <Link to="/dashboard">📊 Dashboard</Link>
            </li>
            <li>
              <Link to="/patients">👥 Patients</Link>
            </li>
            {user?.permissions?.canRegisterPatients && (
              <li>
                <Link to="/patients/register">➕ Register Patient</Link>
              </li>
            )}
            <li>
              <Link to="/organs">🫀 Organs</Link>
            </li>
            {user?.permissions?.canRegisterOrgans && (
              <li>
                <Link to="/organs/register">➕ Register Organ</Link>
              </li>
            )}
            <li className="menu-divider">Waitlists</li>
            <li>
              <Link to="/waitlist/HEART">❤️ Heart</Link>
            </li>
            <li>
              <Link to="/waitlist/LIVER">🫁 Liver</Link>
            </li>
            <li>
              <Link to="/waitlist/KIDNEY">🫘 Kidney</Link>
            </li>
            <li>
              <Link to="/waitlist/LUNG">🫁 Lung</Link>
            </li>
            <li>
              <Link to="/waitlist/PANCREAS">🥞 Pancreas</Link>
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
