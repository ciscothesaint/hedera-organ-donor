import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDaoAuthStore } from './services/daoAuthStore';

// Components
import DaoLayout from './components/Layout/DaoLayout';
import DaoLogin from './pages/DaoLogin';
import DaoRegister from './pages/DaoRegister';
import DaoDashboard from './pages/DaoDashboard';
import ProposalsList from './pages/ProposalsList';
import ProposalDetail from './pages/ProposalDetail';
import CreateProposal from './pages/CreateProposal';
import MyVotingHistory from './pages/MyVotingHistory';
import MyProposals from './pages/MyProposals';

function DaoApp() {
  const { isAuthenticated } = useDaoAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <DaoLogin /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <DaoRegister /> : <Navigate to="/dashboard" />}
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <DaoLayout>
                <Routes>
                  <Route path="/dashboard" element={<DaoDashboard />} />
                  <Route path="/proposals" element={<ProposalsList />} />
                  <Route path="/proposals/create" element={<CreateProposal />} />
                  <Route path="/proposals/:id" element={<ProposalDetail />} />
                  <Route path="/my/votes" element={<MyVotingHistory />} />
                  <Route path="/my/proposals" element={<MyProposals />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </DaoLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default DaoApp;
