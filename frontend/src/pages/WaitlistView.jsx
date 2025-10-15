import React from 'react';
import { useParams } from 'react-router-dom';
import { useMirrorWaitlist } from '../hooks/useMirrorQuery';
import { format } from 'date-fns';

function WaitlistView() {
  const { organType } = useParams();

  // Use Mirror Node hook - FREE queries with auto-refresh!
  const { data, loading, error, cacheInfo, refetch } = useMirrorWaitlist(organType?.toUpperCase());

  const waitlist = data?.waitlist || [];

  if (loading) {
    return (
      <div>
        <div>⏳ Fetching {organType} waitlist from Hedera Mirror Node...</div>
        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
          💰 Using FREE blockchain queries - no gas fees!
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
          <h1>{organType} Waitlist</h1>
          <p>Total patients waiting: {waitlist.length}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {cacheInfo && (
            <>
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {cacheInfo.cached ? (
                  <>📦 Cached ({Math.round(cacheInfo.cacheAge / 1000)}s ago)</>
                ) : (
                  <>🆕 Fresh data</>
                )}
              </div>
              <div style={{ fontSize: '0.85em', color: '#28a745' }}>
                💰 {cacheInfo.cost} - No gas fees!
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
              <th>Position</th>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Blood Type</th>
              <th>Urgency</th>
              <th>Medical Score</th>
              <th>Days Waiting</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((patient, index) => {
              // Calculate days waiting from registeredAt field
              let daysWaiting = 'N/A';
              if (patient.registeredAt && patient.registeredAt !== 'N/A') {
                try {
                  const regDate = new Date(patient.registeredAt);
                  if (!isNaN(regDate.getTime())) {
                    daysWaiting = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
                  }
                } catch (err) {
                  console.warn('Error parsing date:', err);
                }
              }

              return (
                <tr key={patient.patientHash || patient.patientId || index}>
                  <td><strong>#{index + 1}</strong></td>
                  <td>{patient.patientId || 'N/A'}</td>
                  <td>
                    {patient.firstName && patient.lastName
                      ? `${patient.firstName} ${patient.lastName}`
                      : 'N/A'}
                  </td>
                  <td>{patient.bloodType || 'N/A'}</td>
                  <td>
                    <span
                      className={`badge badge-${patient.urgencyLevel >= 4 ? 'danger' : 'warning'}`}
                    >
                      {patient.urgency || `Level ${patient.urgencyLevel}`}
                    </span>
                  </td>
                  <td>{patient.medicalScore || 'N/A'}</td>
                  <td>{typeof daysWaiting === 'number' ? `${daysWaiting} days` : patient.waitTime || daysWaiting}</td>
                  <td>
                    {patient.isVerified ? (
                      <span className="badge badge-success">✅ Verified</span>
                    ) : (
                      <span className="badge badge-warning">Waiting</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {waitlist.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px' }}>No patients on waitlist</p>
        )}
      </div>
    </div>
  );
}

export default WaitlistView;
