import React, { useState, useEffect } from 'react';
import { daoAdminAPI } from '../services/api';
import ConfirmModal from '../components/Modal/ConfirmModal';
import AlertModal from '../components/Modal/AlertModal';
import './DaoUsers.css';

function DaoUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingPowerInput, setVotingPowerInput] = useState({});

  // Modal states
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showUpdatePowerInput, setShowUpdatePowerInput] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', variant: 'info' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newVotingPowerValue, setNewVotingPowerValue] = useState('');

  useEffect(() => {
    fetchUsers();
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

      {/* Pending Users Section */}
      <section className="dao-users-section">
        <h2>Pending Authorization ({pendingUsers.length})</h2>
        {pendingUsers.length === 0 ? (
          <p className="no-users">No pending users</p>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Medical License</th>
                  <th>Specialization</th>
                  <th>Hospital</th>
                  <th>Registered At</th>
                  <th>Voting Power</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role.replace('DAO_', '')}
                      </span>
                    </td>
                    <td>{user.daoProfile?.medicalLicenseNumber || 'N/A'}</td>
                    <td>{user.daoProfile?.specialization || 'N/A'}</td>
                    <td>{user.daoProfile?.hospitalId || 'N/A'}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={votingPowerInput[user._id] || 1}
                        onChange={(e) => setUserVotingPower(user._id, e.target.value)}
                        className="voting-power-input"
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleApprove(user._id)}
                        className="btn btn-approve"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Authorized Users Section */}
      <section className="dao-users-section">
        <h2>Authorized Users ({authorizedUsers.length})</h2>
        {authorizedUsers.length === 0 ? (
          <p className="no-users">No authorized users</p>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Medical License</th>
                  <th>Specialization</th>
                  <th>Voting Power</th>
                  <th>Total Votes Cast</th>
                  <th>Authorized At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {authorizedUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role.replace('DAO_', '')}
                      </span>
                    </td>
                    <td>{user.daoProfile?.medicalLicenseNumber || 'N/A'}</td>
                    <td>{user.daoProfile?.specialization || 'N/A'}</td>
                    <td>
                      <strong>{user.daoProfile?.votingPower || 1}</strong>
                    </td>
                    <td>{user.daoProfile?.totalVotesCast || 0}</td>
                    <td>
                      {user.daoProfile?.authorizedAt
                        ? new Date(user.daoProfile.authorizedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleUpdateVotingPower(user._id)}
                        className="btn btn-update"
                      >
                        Update Power
                      </button>
                      <button
                        onClick={() => handleRevoke(user._id)}
                        className="btn btn-revoke"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
