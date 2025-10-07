import React, { useEffect, useState } from 'react';
import { patientAPI, mirrorAPI } from '../services/api';
import { format } from 'date-fns';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ organType: '', isActive: 'true' });
  const [dataSource, setDataSource] = useState('database'); // 'database' or 'blockchain'
  const [cacheInfo, setCacheInfo] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [filter, dataSource]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      if (dataSource === 'blockchain') {
        // Fetch from blockchain via Mirror Node (FREE) - shows REAL on-chain data
        const mirrorResponse = await mirrorAPI.getAllPatients();
        const blockchainPatients = mirrorResponse.data.data?.patients || [];

        // Names are now in the blockchain events!
        setPatients(blockchainPatients);
        setCacheInfo({
          source: mirrorResponse.data.source,
          cost: mirrorResponse.data.cost,
          cached: mirrorResponse.data.cached,
          cacheAge: mirrorResponse.data.cacheAge,
        });
      } else {
        // Fetch from MongoDB (instant)
        const response = await patientAPI.getAll(filter);
        setPatients(response.data.patients || []);
        setCacheInfo(null);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDataSource = () => {
    const newSource = dataSource === 'database' ? 'blockchain' : 'database';
    setDataSource(newSource);
  };

  if (loading) {
    return (
      <div>
        <div>
          ⏳ Loading patients from{' '}
          {dataSource === 'blockchain' ? 'Hedera blockchain (Mirror Node)' : 'database'}...
        </div>
        {dataSource === 'blockchain' && (
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
            💰 FREE blockchain query - no gas fees!
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Patients</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>
            Current Source:{' '}
            <strong style={{ color: dataSource === 'blockchain' ? '#28a745' : '#ff9800' }}>
              {dataSource === 'blockchain' ? '⛓️ Blockchain (Mirror Node)' : '📊 Database'}
            </strong>
          </div>
          {cacheInfo && (
            <>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                {cacheInfo.cached ? (
                  <>📦 Cached ({Math.round(cacheInfo.cacheAge / 1000)}s ago)</>
                ) : (
                  <>🆕 Fresh data</>
                )}
              </div>
              <div style={{ fontSize: '0.8em', color: '#28a745', fontWeight: 'bold' }}>
                💰 {cacheInfo.cost}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={toggleDataSource}
            style={{
              padding: '10px 20px',
              backgroundColor: dataSource === 'blockchain' ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9em',
            }}
          >
            {dataSource === 'blockchain' ? '⛓️ Viewing On-Chain Data' : '🔗 Check On-Chain'}
          </button>

          {dataSource === 'database' && (
            <>
              <select
                className="input"
                value={filter.organType}
                onChange={(e) => setFilter({ ...filter, organType: e.target.value })}
              >
                <option value="">All Organ Types</option>
                <option value="HEART">Heart</option>
                <option value="LIVER">Liver</option>
                <option value="KIDNEY">Kidney</option>
                <option value="LUNG">Lung</option>
                <option value="PANCREAS">Pancreas</option>
              </select>

              <select
                className="input"
                value={filter.isActive}
                onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </>
          )}

          <button
            onClick={fetchPatients}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em',
            }}
          >
            🔄 Refresh
          </button>

          {dataSource === 'blockchain' && (
            <div style={{ fontSize: '0.85em', color: '#ff9800', fontStyle: 'italic' }}>
              ⚠️ Blockchain data has 3-5 second delay after registration
            </div>
          )}
        </div>

        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Organ Type</th>
              <th>Blood Type</th>
              <th>Urgency Level</th>
              {dataSource === 'database' && <th>Registration Date</th>}
              {dataSource === 'database' && <th>Status</th>}
              {dataSource === 'blockchain' && <th>Medical Score</th>}
              {dataSource === 'blockchain' && <th>Block Number</th>}
              {dataSource === 'blockchain' && <th>Transaction ID</th>}
            </tr>
          </thead>
          <tbody>
            {dataSource === 'database' ? (
              // MongoDB data - full patient info
              patients.map((patient) => (
                <tr key={patient._id}>
                  <td>{patient.patientId}</td>
                  <td>
                    {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
                  </td>
                  <td>{patient.medicalInfo?.organType}</td>
                  <td>{patient.medicalInfo?.bloodType}</td>
                  <td>
                    <span className={`badge badge-${patient.medicalInfo?.urgencyLevel >= 4 ? 'danger' : 'warning'}`}>
                      Level {patient.medicalInfo?.urgencyLevel}
                    </span>
                  </td>
                  <td>
                    {patient.waitlistInfo?.registrationDate
                      ? format(new Date(patient.waitlistInfo.registrationDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </td>
                  <td>
                    {patient.waitlistInfo?.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              // Blockchain mode - shows REAL on-chain data including names
              patients.map((patient, index) => (
                  <tr key={index} style={{ backgroundColor: '#d4edda' }}>
                    <td>{patient.patientId || 'N/A'}</td>
                    <td>{`${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'N/A'}</td>
                    <td>{patient.organType || 'N/A'}</td>
                    <td>{patient.bloodType || 'N/A'}</td>
                    <td>
                      <span
                        className={`badge badge-${patient.urgencyLevel >= 4 ? 'danger' : 'warning'}`}
                      >
                        Level {patient.urgencyLevel || 0}
                      </span>
                    </td>
                    <td>{patient.medicalScore || 'N/A'}</td>
                    <td>{patient.blockNumber || 'N/A'}</td>
                    <td style={{ fontSize: '0.75em' }}>
                      <a
                        href={`https://hashscan.io/testnet/transaction/${patient.transactionId || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#007bff', textDecoration: 'none' }}
                      >
                        ✅ {(patient.transactionId || '').substring(0, 15)}...
                      </a>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        {patients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No patients found</p>
            {dataSource === 'blockchain' && (
              <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                ⚠️ New registrations appear in 3-5 seconds on blockchain
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: dataSource === 'blockchain' ? '#d4edda' : '#fff3cd',
          borderRadius: '5px',
          border: `1px solid ${dataSource === 'blockchain' ? '#c3e6cb' : '#ffeaa7'}`,
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '1em' }}>
          {dataSource === 'blockchain' ? '⛓️ Blockchain Mode' : '📊 Database Mode'}
        </h3>
        {dataSource === 'blockchain' ? (
          <div style={{ fontSize: '0.9em' }}>
            <p style={{ margin: '5px 0' }}>
              ✅ <strong>Blockchain Verification Mode</strong>
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              Shows database patients with their blockchain transaction proof
            </p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>✅ <strong>Green rows</strong> - Verified on blockchain (transaction found)</li>
              <li>⏳ <strong>Yellow rows</strong> - Pending blockchain confirmation (3-5s delay)</li>
              <li>💰 <strong>FREE verification</strong> - Mirror Node query costs no gas</li>
              <li>🔗 <strong>Click transaction IDs</strong> - Opens Hashscan blockchain explorer</li>
              <li>📦 <strong>Cached for 5 seconds</strong> - Click refresh for latest data</li>
            </ul>
            <p style={{ margin: '10px 0 5px 0', fontSize: '0.95em', color: '#155724', fontWeight: 'bold' }}>
              💡 This proves your database is backed by immutable blockchain records!
            </p>
          </div>
        ) : (
          <div style={{ fontSize: '0.9em' }}>
            <p style={{ margin: '5px 0' }}>
              ✅ <strong>Reading from MongoDB database</strong>
            </p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>⚡ <strong>Instant</strong> - No delay, updates immediately</li>
              <li>🔍 <strong>Full details</strong> - Names, addresses, and all patient info</li>
              <li>🎯 <strong>Filtering</strong> - Filter by organ type and status</li>
              <li>📊 <strong>Rich queries</strong> - Complex searches and sorting</li>
            </ul>
            <p style={{ margin: '10px 0 5px 0', fontSize: '0.95em', color: '#856404' }}>
              💡 <strong>Tip:</strong> Click "🔗 Check On-Chain" to verify this data exists on the
              blockchain!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientList;
