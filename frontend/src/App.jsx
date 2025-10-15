import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/authStore';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import RegisterPatient from './pages/RegisterPatient';
import OrganList from './pages/OrganList';
import RegisterOrgan from './pages/RegisterOrgan';
import WaitlistView from './pages/WaitlistView';
import DaoUsers from './pages/DaoUsers';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/patients" element={<PatientList />} />
                  <Route path="/patients/register" element={<RegisterPatient />} />
                  <Route path="/organs" element={<OrganList />} />
                  <Route path="/organs/register" element={<RegisterOrgan />} />
                  <Route path="/waitlist/:organType" element={<WaitlistView />} />
                  <Route path="/dao-users" element={<DaoUsers />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
