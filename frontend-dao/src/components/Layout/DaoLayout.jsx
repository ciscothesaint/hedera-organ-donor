import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDaoAuthStore } from '../../services/daoAuthStore';
import './DaoLayout.css';

function DaoLayout({ children }) {
  const { doctor, logoutDoctor, canVote, canCreateProposals } = useDaoAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutDoctor();
    navigate('/login');
  };

  return (
    <div className="dao-layout">
      <nav className="dao-navbar">
        <div className="container navbar-content">
          <div className="navbar-brand">
            <h2>DAO Governance</h2>
            <span className="network-badge">Hedera Testnet</span>
          </div>
          <div className="navbar-user">
            <span className="user-name">{doctor?.username}</span>
            <span className="badge badge-info">{doctor?.role?.replace('DAO_', '')}</span>
            {doctor?.daoProfile?.isAuthorizedVoter && (
              <span className="badge badge-success">Authorized</span>
            )}
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dao-main-content">
        <aside className="dao-sidebar">
          <ul className="sidebar-menu">
            <li>
              <Link to="/dashboard">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </Link>
            </li>
            <li className="menu-divider">Proposals</li>
            <li>
              <Link to="/proposals">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                All Proposals
              </Link>
            </li>
            {canCreateProposals() && (
              <li>
                <Link to="/proposals/create">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Proposal
                </Link>
              </li>
            )}
            <li className="menu-divider">My Activity</li>
            {canVote() && (
              <li>
                <Link to="/my/votes">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  My Votes
                </Link>
              </li>
            )}
            {doctor?.role === 'DAO_DOCTOR' && (
              <li>
                <Link to="/my/proposals">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  My Proposals
                </Link>
              </li>
            )}
            <li className="menu-divider">Account</li>
            {doctor?.daoProfile?.votingPower && (
              <li>
                <div className="voting-power-info">
                  <span>Voting Power: {doctor.daoProfile.votingPower}</span>
                </div>
              </li>
            )}
          </ul>
        </aside>

        <main className="dao-content">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DaoLayout;
