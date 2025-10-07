import React, { useEffect, useState } from 'react';
import { organAPI } from '../services/api';

function OrganList() {
  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgans();
  }, []);

  const fetchOrgans = async () => {
    try {
      const response = await organAPI.getAll();
      setOrgans(response.data.organs || []);
    } catch (error) {
      console.error('Error fetching organs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading organs...</div>;

  return (
    <div>
      <h1>Organs</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Organ ID</th>
              <th>Type</th>
              <th>Blood Type</th>
              <th>Weight (g)</th>
              <th>Viability</th>
              <th>Status</th>
              <th>Hospital</th>
            </tr>
          </thead>
          <tbody>
            {organs.map((organ) => (
              <tr key={organ._id}>
                <td>{organ.organId}</td>
                <td>{organ.organInfo.organType}</td>
                <td>{organ.organInfo.bloodType}</td>
                <td>{organ.organInfo.weight}g</td>
                <td>{organ.organInfo.viabilityHours}h</td>
                <td>
                  <span
                    className={`badge badge-${
                      organ.status === 'AVAILABLE'
                        ? 'success'
                        : organ.status === 'ALLOCATED'
                        ? 'warning'
                        : 'info'
                    }`}
                  >
                    {organ.status}
                  </span>
                </td>
                <td>{organ.hospitalInfo.hospitalId}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {organs.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No organs registered</p>}
      </div>
    </div>
  );
}

export default OrganList;
