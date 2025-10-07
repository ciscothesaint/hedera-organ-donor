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
              const daysWaiting = Math.floor(
                (Date.now() - new Date(patient.waitlistInfo.registrationDate)) / (1000 * 60 * 60 * 24)
              );

              return (
                <tr key={patient._id}>
                  <td><strong>#{index + 1}</strong></td>
                  <td>{patient.patientId}</td>
                  <td>
                    {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                  </td>
                  <td>{patient.medicalInfo.bloodType}</td>
                  <td>
                    <span
                      className={`badge badge-${patient.medicalInfo.urgencyLevel >= 4 ? 'danger' : 'warning'}`}
                    >
                      Level {patient.medicalInfo.urgencyLevel}
                    </span>
                  </td>
                  <td>{patient.medicalInfo.medicalScore}</td>
                  <td>{daysWaiting} days</td>
                  <td>
                    {patient.matching?.isMatched ? (
                      <span className="badge badge-info">Matched</span>
                    ) : (
                      <span className="badge badge-success">Waiting</span>
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
