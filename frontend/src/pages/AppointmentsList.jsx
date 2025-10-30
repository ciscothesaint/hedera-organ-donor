import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../services/authStore';
import './AppointmentsList.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function AppointmentsList() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const { token } = useAuthStore();

    useEffect(() => {
        fetchAppointments();
    }, [filter]);

    const fetchAppointments = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = filter !== 'ALL' ? { status: filter } : {};
            const response = await axios.get(`${API_URL}/matches/appointments/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            setAppointments(response.data.appointments || []);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.response?.data?.error || 'Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            SCHEDULED: 'status-scheduled',
            IN_PROGRESS: 'status-in-progress',
            COMPLETED: 'status-completed',
            CANCELLED: 'status-cancelled',
        };
        return statusClasses[status] || 'status-scheduled';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isUpcoming = (scheduledDate) => {
        return new Date(scheduledDate) > new Date();
    };

    return (
        <div className="appointments-container">
            <div className="appointments-header">
                <h1>📅 Surgery Appointments</h1>
                <p>Manage all scheduled transplant surgeries</p>
            </div>

            <div className="appointments-controls">
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All Appointments
                    </button>
                    <button
                        className={`filter-btn ${filter === 'SCHEDULED' ? 'active' : ''}`}
                        onClick={() => setFilter('SCHEDULED')}
                    >
                        Scheduled
                    </button>
                    <button
                        className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
                        onClick={() => setFilter('IN_PROGRESS')}
                    >
                        In Progress
                    </button>
                    <button
                        className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
                        onClick={() => setFilter('COMPLETED')}
                    >
                        Completed
                    </button>
                </div>
                <button className="btn-refresh" onClick={fetchAppointments}>
                    🔄 Refresh
                </button>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading appointments...</p>
                </div>
            )}

            {error && (
                <div className="error-state">
                    <p>❌ {error}</p>
                </div>
            )}

            {!loading && !error && appointments.length === 0 && (
                <div className="empty-state">
                    <p>📭 No appointments found</p>
                    <p className="empty-subtitle">
                        Appointments will appear here when organ matches are created
                    </p>
                </div>
            )}

            {!loading && !error && appointments.length > 0 && (
                <div className="appointments-table-wrapper">
                    <table className="appointments-table">
                        <thead>
                            <tr>
                                <th>Appointment ID</th>
                                <th>Patient</th>
                                <th>Organ Type</th>
                                <th>Hospital</th>
                                <th>Scheduled Date</th>
                                <th>Duration</th>
                                <th>Surgeon</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appointment) => (
                                <tr
                                    key={appointment.appointmentId}
                                    className={isUpcoming(appointment.surgeryDetails?.scheduledDate) ? 'upcoming' : ''}
                                >
                                    <td>
                                        <div className="appointment-id">
                                            {appointment.appointmentId}
                                        </div>
                                    </td>
                                    <td>
                                        {appointment.patient ? (
                                            <div className="patient-cell">
                                                <div className="patient-name">{appointment.patient.name}</div>
                                                <div className="patient-id">{appointment.patient.patientId}</div>
                                            </div>
                                        ) : (
                                            <span className="no-data">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        {appointment.organ ? (
                                            <div className="organ-cell">
                                                <span className="organ-type">{appointment.organ.organType}</span>
                                                <span className="blood-badge">{appointment.organ.bloodType}</span>
                                            </div>
                                        ) : (
                                            <span className="no-data">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="hospital-cell">
                                            {appointment.hospitalId || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <div className="date-value">
                                                {formatDate(appointment.surgeryDetails?.scheduledDate)}
                                            </div>
                                            {isUpcoming(appointment.surgeryDetails?.scheduledDate) && (
                                                <span className="upcoming-badge">Upcoming</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="duration-value">
                                            {appointment.surgeryDetails?.estimatedDuration || 0} hours
                                        </span>
                                    </td>
                                    <td>
                                        <span className="surgeon-name">
                                            {appointment.surgeryDetails?.surgeonName || 'TBD'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AppointmentsList;
