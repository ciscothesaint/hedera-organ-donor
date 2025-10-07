import React from 'react';
import { mirrorAPI } from '../services/api';
import useMirrorQuery from '../hooks/useMirrorQuery';
import { format } from 'date-fns';

/**
 * Patient List using Mirror Node (FREE blockchain queries)
 * This version queries Hedera blockchain directly via Mirror Node
 * Shows 3-5 second delay proving it's reading from blockchain
 */
function PatientListMirror() {
  // Use Mirror Node hook - FREE queries!
  const { data, loading, error, cacheInfo, refetch } = useMirrorQuery(
    () => mirrorAPI.getAllPatients(),
    { refetchInterval: 10000 } // Auto-refresh every 10 seconds
  );

  const patients = data?.patients || [];

  if (loading) {
    return (
      <div>
        <div>⏳ Fetching patient list from Hedera Mirror Node...</div>
        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
          💰 Using FREE blockchain queries - no gas fees!
        </div>
        <div style={{ fontSize: '0.85em', color: '#ff9800', marginTop: '5px' }}>
          ⚠️ Note: Blockchain data has 3-5 second delay after registration
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div style={{ color: 'red' }}>❌ Error: {error}</div>
        <button onClick={refetch} style={{ marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Patients (Blockchain Data)</h1>
          <p>Total patients: {patients.length}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {cacheInfo && (
            <>
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {cacheInfo.cached ? (
                  <>📦 Cached ({Math.round(cacheInfo.cacheAge / 1000)}s ago)</>
                ) : (
                  <>🆕 Fresh from blockchain</>
                )}
              </div>
              <div style={{ fontSize: '0.85em', color: '#28a745', fontWeight: 'bold' }}>
                💰 {cacheInfo.cost} - Mirror Node
              </div>
              <div style={{ fontSize: '0.8em', color: '#ff9800', marginTop: '3px' }}>
                ⛓️ Reading from Hedera blockchain
              </div>
              <button onClick={refetch} style={{ marginTop: '5px', fontSize: '0.85em' }}>
                🔄 Refresh
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Organ Type</th>
              <th>Blood Type</th>
              <th>Urgency Level</th>
              <th>Medical Score</th>
              <th>Block Number</th>
              <th>Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={index}>
                <td>{patient.patientId || 'N/A'}</td>
                <td>{patient.organType || 'N/A'}</td>
                <td>{patient.bloodType || 'N/A'}</td>
                <td>
                  <span className={`badge badge-${patient.urgencyLevel >= 4 ? 'danger' : 'warning'}`}>
                    Level {patient.urgencyLevel || 0}
                  </span>
                </td>
                <td>{patient.medicalScore || 'N/A'}</td>
                <td>{patient.blockNumber || 'N/A'}</td>
                <td style={{ fontSize: '0.8em' }}>
                  {patient.transactionId ? (
                    <a
                      href={`https://hashscan.io/testnet/transaction/${patient.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#007bff' }}
                    >
                      {patient.transactionId.substring(0, 20)}...
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {patients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No patients found on blockchain</p>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
              ⚠️ New registrations appear in 3-5 seconds
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0 }}>📊 Data Source Comparison</h3>
        <table style={{ width: '100%', fontSize: '0.9em' }}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Delay</th>
              <th>Cost</th>
              <th>Verifiable</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#d4edda' }}>
              <td><strong>🔗 Mirror Node (This page)</strong></td>
              <td>3-5 seconds</td>
              <td><strong style={{ color: '#28a745' }}>FREE</strong></td>
              <td>✅ Yes - On blockchain</td>
            </tr>
            <tr>
              <td>📊 MongoDB (Other page)</td>
              <td>Instant</td>
              <td>N/A</td>
              <td>❌ No - Database only</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientListMirror;
