import React, { useState, useEffect } from 'react';
import { daoAdminAPI, systemSettingsAPI } from '../services/api';
import ConfirmModal from '../components/Modal/ConfirmModal';
import AlertModal from '../components/Modal/AlertModal';
import './DaoUsers.css';

function DaoUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingPowerInput, setVotingPowerInput] = useState({});

  // Emergency password states
  const [passwordStatus, setPasswordStatus] = useState({ isSet: false, setAt: null });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Modal states
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showUpdatePowerInput, setShowUpdatePowerInput] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', variant: 'info' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newVotingPowerValue, setNewVotingPowerValue] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPasswordStatus();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingRes, authorizedRes] = await Promise.all([
        daoAdminAPI.getDaoUsers('pending'),
        daoAdminAPI.getDaoUsers('authorized'),
      ]);

      setPendingUsers(pendingRes.data.users || []);
      setAuthorizedUsers(authorizedRes.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch DAO users');
      console.error('Error fetching DAO users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordStatus = async () => {
    try {
      const response = await systemSettingsAPI.getPasswordStatus();
      setPasswordStatus(response.data);
    } catch (err) {
      console.error('Error fetching password status:', err);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setAlertConfig({
        title: 'Invalid Password',
        message: 'Password must be at least 8 characters long',
        variant: 'warning'
      });
      setShowAlert(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlertConfig({
        title: 'Passwords Do Not Match',
        message: 'Please ensure both password fields match',
        variant: 'warning'
      });
      setShowAlert(true);
      return;
    }

    try {
      setPasswordLoading(true);
      await systemSettingsAPI.setEmergencyPassword(newPassword, confirmPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setAlertConfig({
        title: 'Password Set Successfully',
        message: 'Emergency finalize password has been set successfully',
        variant: 'success'
      });
      setShowAlert(true);
      fetchPasswordStatus();
    } catch (err) {
      setAlertConfig({
        title: 'Failed to Set Password',
        message: err.response?.data?.error || 'Failed to set emergency password',
        variant: 'error'
      });
      setShowAlert(true);
      console.error('Error setting password:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const votingPower = votingPowerInput[userId] || 1;
      await daoAdminAPI.authorizeUser(userId, votingPower);
      setAlertConfig({
        title: 'User Authorized',
        message: `User authorized successfully with voting power ${votingPower}`,
        variant: 'success'
      });
      setShowAlert(true);
      fetchUsers(); // Refresh lists
    } catch (err) {
      setAlertConfig({
        title: 'Authorization Failed',
        message: err.response?.data?.error || 'Failed to authorize user',
        variant: 'error'
      });
      setShowAlert(true);
      console.error('Error authorizing user:', err);
    }
  };

  const handleRevoke = (userId) => {
    setSelectedUser(userId);
    setShowRevokeConfirm(true);
  };

  const confirmRevoke = async () => {
    try {
      await daoAdminAPI.revokeUser(selectedUser);
      setShowRevokeConfirm(false);
      setAlertConfig({
        title: 'Authorization Revoked',
        message: 'User authorization revoked successfully',
        variant: 'success'
      });
      setShowAlert(true);
      fetchUsers(); // Refresh lists
    } catch (err) {
      setShowRevokeConfirm(false);
      setAlertConfig({
        title: 'Revocation Failed',
        message: err.response?.data?.error || 'Failed to revoke user',
        variant: 'error'
      });
      setShowAlert(true);
      console.error('Error revoking user:', err);
    }
  };

  const handleUpdateVotingPower = (userId) => {
    setSelectedUser(userId);
    setNewVotingPowerValue('');
    setShowUpdatePowerInput(true);
  };

  const confirmUpdateVotingPower = async () => {
    const votingPower = parseInt(newVotingPowerValue);

    if (isNaN(votingPower) || votingPower < 1 || votingPower > 10) {
      setAlertConfig({
        title: 'Invalid Input',
        message: 'Voting power must be a number between 1 and 10.',
        variant: 'warning'
      });
      setShowAlert(true);
      return;
    }

    try {
      await daoAdminAPI.updateVotingPower(selectedUser, votingPower);
      setShowUpdatePowerInput(false);
      setAlertConfig({
        title: 'Voting Power Updated',
        message: `Voting power successfully updated to ${votingPower}`,
        variant: 'success'
      });
      setShowAlert(true);
      fetchUsers(); // Refresh lists
    } catch (err) {
      setShowUpdatePowerInput(false);
      setAlertConfig({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to update voting power',
        variant: 'error'
      });
      setShowAlert(true);
      console.error('Error updating voting power:', err);
    }
  };

  const setUserVotingPower = (userId, value) => {
    setVotingPowerInput({
      ...votingPowerInput,
      [userId]: parseInt(value) || 1,
    });
  };

  if (loading) {
    return (
      <div className="dao-users-container">
        <div className="loading">Loading DAO users...</div>
      </div>
    );
  }

  return (
    <div className="dao-users-container">
      <h1>DAO User Management</h1>

      {error && <div className="error-banner">{error}</div>}

      {/* Emergency Finalize Password Section */}
      <section className="dao-users-section emergency-password-section">
        <h2>Emergency Finalize Password</h2>
        <div className="password-status-card">
          <div className="password-status-info">
            <div className="password-status-label">Current Status:</div>
            <div className={`password-status-badge ${passwordStatus.isSet ? 'set' : 'not-set'}`}>
              {passwordStatus.isSet ? (
                <>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Password Set
                </>
              ) : (
                <>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Not Set
                </>
              )}
            </div>
            {passwordStatus.isSet && passwordStatus.setAt && (
              <div className="password-set-date">
                Last updated: {new Date(passwordStatus.setAt).toLocaleString()}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn btn-primary"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {passwordStatus.isSet ? 'Change Password' : 'Set Password'}
          </button>
        </div>
        <p className="password-hint">
          This password is required to emergency finalize any proposal before its voting deadline.
          Keep it secure and share only with authorized administrators.
        </p>
      </section>

      {/* Pending Users Section */}
      <section className="dao-users-section">
        <div className="section-header">
          <h2>Pending Authorization</h2>
          <span className="count-badge">{pendingUsers.length}</span>
        </div>
        {pendingUsers.length === 0 ? (
          <div className="no-users-card">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No pending users</p>
            <small>All DAO registration requests have been processed</small>
          </div>
        ) : (
          <div className="users-grid">
            {pendingUsers.map((user) => (
              <div key={user._id} className="user-card pending">
                <div className="user-card-header">
                  <div className="user-avatar">
                    {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="user-info">
                    <h3>{user.name || 'N/A'}</h3>
                    <p className="user-email">{user.email}</p>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role.replace('DAO_', '')}
                    </span>
                  </div>
                </div>
                <div className="user-card-body">
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="info-label">License:</span>
                    <span className="info-value">{user.daoProfile?.medicalLicenseNumber || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.586V5L7 4z" />
                    </svg>
                    <span className="info-label">Specialty:</span>
                    <span className="info-value">{user.daoProfile?.specialization || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="info-label">Registered:</span>
                    <span className="info-value">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="user-card-footer">
                  <div className="voting-power-control">
                    <label>Voting Power:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={votingPowerInput[user._id] || 1}
                      onChange={(e) => setUserVotingPower(user._id, e.target.value)}
                      className="voting-power-input"
                    />
                  </div>
                  <button
                    onClick={() => handleApprove(user._id)}
                    className="btn btn-approve"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Authorized Users Section */}
      <section className="dao-users-section">
        <div className="section-header">
          <h2>Authorized Users</h2>
          <span className="count-badge success">{authorizedUsers.length}</span>
        </div>
        {authorizedUsers.length === 0 ? (
          <div className="no-users-card">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p>No authorized users</p>
            <small>No DAO members have been authorized yet</small>
          </div>
        ) : (
          <div className="users-grid">
            {authorizedUsers.map((user) => (
              <div key={user._id} className="user-card authorized">
                <div className="user-card-header">
                  <div className="user-avatar authorized">
                    {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="user-info">
                    <h3>{user.name || 'N/A'}</h3>
                    <p className="user-email">{user.email}</p>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role.replace('DAO_', '')}
                    </span>
                  </div>
                  <div className="voting-power-badge">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {user.daoProfile?.votingPower || 1}
                  </div>
                </div>
                <div className="user-card-body">
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="info-label">License:</span>
                    <span className="info-value">{user.daoProfile?.medicalLicenseNumber || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.586V5L7 4z" />
                    </svg>
                    <span className="info-label">Specialty:</span>
                    <span className="info-value">{user.daoProfile?.specialization || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="info-label">Votes Cast:</span>
                    <span className="info-value">{user.daoProfile?.totalVotesCast || 0}</span>
                  </div>
                  <div className="info-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="info-label">Authorized:</span>
                    <span className="info-value">
                      {user.daoProfile?.authorizedAt
                        ? new Date(user.daoProfile.authorizedAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="user-card-footer">
                  <button
                    onClick={() => handleUpdateVotingPower(user._id)}
                    className="btn btn-update"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Update Power
                  </button>
                  <button
                    onClick={() => handleRevoke(user._id)}
                    className="btn btn-revoke"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Revoke Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        onConfirm={confirmRevoke}
        title="Revoke User Authorization?"
        message="Are you sure you want to revoke this user's DAO authorization? They will lose access to voting and proposal creation."
        variant="danger"
        confirmText="Revoke"
        cancelText="Cancel"
      />

      {/* Update Voting Power Modal */}
      <ConfirmModal
        isOpen={showUpdatePowerInput}
        onClose={() => setShowUpdatePowerInput(false)}
        onConfirm={confirmUpdateVotingPower}
        title="Update Voting Power"
        message="Enter the new voting power for this user (1-10):"
        variant="info"
        confirmText="Update"
        cancelText="Cancel"
        details={[
          {
            label: 'New Voting Power',
            value: (
              <input
                type="number"
                min="1"
                max="10"
                value={newVotingPowerValue}
                onChange={(e) => setNewVotingPowerValue(e.target.value)}
                className="voting-power-input"
                placeholder="1-10"
                autoFocus
                style={{ width: '80px', marginLeft: '10px' }}
              />
            )
          }
        ]}
      />

      {/* Set Emergency Password Modal */}
      <ConfirmModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
        }}
        onConfirm={handleSetPassword}
        title={passwordStatus.isSet ? 'Change Emergency Finalize Password' : 'Set Emergency Finalize Password'}
        message="Enter a strong password (minimum 8 characters) that will be required for emergency proposal finalization:"
        variant="info"
        confirmText={passwordStatus.isSet ? 'Change Password' : 'Set Password'}
        cancelText="Cancel"
        loading={passwordLoading}
        details={[
          {
            label: 'Password',
            value: (
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password (min 8 chars)"
                className="voting-power-input"
                style={{ width: '100%', padding: '8px' }}
                autoFocus
              />
            )
          },
          {
            label: 'Confirm Password',
            value: (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="voting-power-input"
                style={{ width: '100%', padding: '8px' }}
              />
            )
          }
        ]}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
      />
    </div>
  );
}

export default DaoUsers;
