import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../services/authStore";
import { matchAPI } from "../services/api";
import ConfirmModal from "../components/Modal/ConfirmModal";
import "./MatchesList.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function MatchesList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [isRunningMatching, setIsRunningMatching] = useState(false);
  const [matchingResult, setMatchingResult] = useState(null);
  const { token } = useAuthStore();

  // Status update modal state
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    matchId: null,
    currentStatus: null,
    newStatus: null,
    matchDetails: null,
    loading: false,
  });

  // Rejection reason state
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchMatches();
  }, [filter]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== "ALL" ? { status: filter } : {};
      const response = await axios.get(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setMatches(response.data.matches || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(err.response?.data?.error || "Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      PENDING: "status-pending",
      ACCEPTED: "status-accepted",
      REJECTED: "status-rejected",
      COMPLETED: "status-completed",
    };
    return statusClasses[status] || "status-pending";
  };

  const getUrgencyBadgeClass = (level) => {
    if (level >= 5) return "urgency-critical";
    if (level >= 4) return "urgency-high";
    if (level >= 3) return "urgency-medium";
    return "urgency-low";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const runMatchingAlgorithm = async () => {
    setIsRunningMatching(true);
    setMatchingResult(null);
    setError(null);
    try {
      const response = await axios.post(
        `${API_URL}/matches/run-matching`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMatchingResult(response.data);

      // Refresh matches list after running matching
      if (response.data.results?.matched > 0) {
        await fetchMatches();
      }
    } catch (err) {
      console.error("Error running matching algorithm:", err);
      setError(err.response?.data?.error || "Failed to run matching algorithm");
    } finally {
      setIsRunningMatching(false);
    }
  };

  // Open status update modal
  const openStatusModal = (match, newStatus) => {
    setStatusModal({
      isOpen: true,
      matchId: match.matchId,
      currentStatus: match.status,
      newStatus,
      matchDetails: match,
      loading: false,
    });
    setRejectionReason("");
  };

  // Close status update modal
  const closeStatusModal = () => {
    setStatusModal({
      isOpen: false,
      matchId: null,
      currentStatus: null,
      newStatus: null,
      matchDetails: null,
      loading: false,
    });
    setRejectionReason("");
  };

  // Handle status update confirmation
  const handleStatusUpdate = async () => {
    setStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      const reason =
        statusModal.newStatus === "REJECTED" ? rejectionReason : undefined;

      await matchAPI.updateStatus(
        statusModal.matchId,
        statusModal.newStatus,
        reason
      );

      // Refresh matches list
      await fetchMatches();

      // Close modal
      closeStatusModal();

      // Show success message
      setMatchingResult({
        message: `Match status updated to ${statusModal.newStatus}`,
        results: { total: 0, matched: 0, noMatch: 0 },
      });
      setTimeout(() => setMatchingResult(null), 3000);
    } catch (err) {
      console.error("Error updating match status:", err);
      setError(err.response?.data?.error || "Failed to update match status");
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Get available status transitions
  const getAvailableStatusTransitions = (currentStatus) => {
    switch (currentStatus) {
      case "PENDING":
        return ["ACCEPTED", "REJECTED"];
      case "ACCEPTED":
        return ["COMPLETED", "REJECTED"];
      case "REJECTED":
      case "COMPLETED":
        return [];
      default:
        return [];
    }
  };

  return (
    <div className="matches-container">
      <div className="matches-header">
        <h1>🤝 Organ Matches</h1>
        <p>View all automatic organ-patient matches</p>
      </div>

      <div className="matches-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            All Matches
          </button>
          <button
            className={`filter-btn ${filter === "PENDING" ? "active" : ""}`}
            onClick={() => setFilter("PENDING")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === "ACCEPTED" ? "active" : ""}`}
            onClick={() => setFilter("ACCEPTED")}
          >
            Accepted
          </button>
          <button
            className={`filter-btn ${filter === "COMPLETED" ? "active" : ""}`}
            onClick={() => setFilter("COMPLETED")}
          >
            Completed
          </button>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-run-matching"
            onClick={runMatchingAlgorithm}
            disabled={isRunningMatching}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: isRunningMatching ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              opacity: isRunningMatching ? 0.6 : 1,
              transition: "all 0.3s ease",
            }}
          >
            {isRunningMatching ? "⏳ Running..." : "▶️ Run Matching Algorithm"}
          </button>
          <button className="btn-refresh" onClick={fetchMatches}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading matches...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>❌ {error}</p>
        </div>
      )}

      {matchingResult && (
        <div
          className="matching-result"
          style={{
            background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
            border: "2px solid #10b981",
            borderRadius: "12px",
            padding: "20px",
            margin: "20px 0",
            color: "#065f46",
          }}
        >
          <h3
            style={{
              margin: "0 0 10px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            ✅ {matchingResult.message}
          </h3>
          <div style={{ display: "flex", gap: "20px", fontSize: "14px" }}>
            <div>
              <strong>Total Organs:</strong> {matchingResult.results.total}
            </div>
            <div>
              <strong>Matched:</strong> {matchingResult.results.matched}
            </div>
            <div>
              <strong>No Match:</strong> {matchingResult.results.noMatch}
            </div>
          </div>
          {matchingResult.results.details &&
            matchingResult.results.details.length > 0 && (
              <details style={{ marginTop: "15px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "600" }}>
                  View Details
                </summary>
                <div
                  style={{
                    marginTop: "10px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {matchingResult.results.details.map((detail, index) => (
                    <div
                      key={index}
                      style={{
                        background: "white",
                        padding: "10px",
                        margin: "5px 0",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <strong>Organ:</strong> {detail.organId} (
                        {detail.organType}, {detail.bloodType})
                      </div>
                      {detail.matched ? (
                        <>
                          <div>
                            <strong>✅ Matched to:</strong> {detail.patientName}{" "}
                            ({detail.patientId})
                          </div>
                          <div>
                            <strong>Match ID:</strong> {detail.matchId}
                          </div>
                          <div>
                            <strong>Appointment ID:</strong>{" "}
                            {detail.appointmentId}
                          </div>
                        </>
                      ) : (
                        <div>
                          <strong>❌ No Match:</strong>{" "}
                          {detail.message || detail.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          <button
            onClick={() => setMatchingResult(null)}
            style={{
              marginTop: "15px",
              padding: "8px 16px",
              background: "#065f46",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="empty-state">
          <p>📭 No matches found</p>
          <p className="empty-subtitle">
            Matches will appear here when organs are automatically matched to
            patients
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="matches-grid">
          {matches.map((match) => (
            <div key={match.matchId} className="match-card">
              <div className="match-card-header">
                <div className="match-id">
                  <span className="label">Match ID:</span>
                  <span className="value">{match.matchId}</span>
                </div>
                <span
                  className={`status-badge ${getStatusBadgeClass(
                    match.status
                  )}`}
                >
                  {match.status}
                </span>
              </div>

              <div className="match-details">
                <div className="detail-section">
                  <h3>🫀 Organ Details</h3>
                  {match.organ ? (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Organ ID:</span>
                        <span className="detail-value">
                          {match.organ.organId}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">
                          {match.organ.organType}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Blood Type:</span>
                        <span className="blood-badge">
                          {match.organ.bloodType}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Hospital:</span>
                        <span className="detail-value">
                          {match.organ.hospitalName || "N/A"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="no-data">Organ details not available</p>
                  )}
                </div>

                <div className="detail-section">
                  <h3>👤 Patient Details</h3>
                  {match.patient ? (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Patient ID:</span>
                        <span className="detail-value">
                          {match.patient.patientId}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">
                          {match.patient.name}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Blood Type:</span>
                        <span className="blood-badge">
                          {match.patient.bloodType}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Urgency:</span>
                        <span
                          className={`urgency-badge ${getUrgencyBadgeClass(
                            match.patient.urgencyLevel
                          )}`}
                        >
                          Level {match.patient.urgencyLevel}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Hospital:</span>
                        <span className="detail-value">
                          {match.patient.hospitalName || "N/A"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="no-data">Patient details not available</p>
                  )}
                </div>
              </div>

              <div className="match-score">
                <div className="score-item">
                  <span className="score-label">Urgency Points:</span>
                  <span className="score-value">
                    {match.matchScore?.urgencyLevel * 1000 || 0}
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Days Waiting:</span>
                  <span className="score-value">
                    {match.matchScore?.daysWaiting || 0}
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Blood Compatible:</span>
                  <span className="score-value">
                    {match.matchScore?.bloodCompatibility ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              </div>

              <div className="match-footer">
                <div className="match-date">
                  <span className="date-label">Matched on:</span>
                  <span className="date-value">
                    {formatDate(match.matchDate)}
                  </span>
                </div>
                <div className="expiry-time">
                  <span className="date-label">Expires:</span>
                  <span className="date-value">
                    {formatDate(match.expiryTime)}
                  </span>
                </div>
              </div>

              {/* Status Update Actions */}
              {getAvailableStatusTransitions(match.status).length > 0 && (
                <div className="match-actions">
                  <div className="actions-label">Update Status:</div>
                  <div className="actions-buttons">
                    {getAvailableStatusTransitions(match.status).map(
                      (status) => (
                        <button
                          key={status}
                          className={`action-btn action-btn-${status.toLowerCase()}`}
                          onClick={() => openStatusModal(match, status)}
                        >
                          {status === "ACCEPTED" && "✅ Accept"}
                          {status === "REJECTED" && "❌ Reject"}
                          {status === "COMPLETED" && "✔️ Complete"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModal.isOpen}
        onClose={closeStatusModal}
        onConfirm={handleStatusUpdate}
        title={`Update Match Status to ${statusModal.newStatus}?`}
        message={
          statusModal.newStatus === "REJECTED"
            ? "Are you sure you want to reject this match? Please provide a reason."
            : `Are you sure you want to update this match status to ${statusModal.newStatus}?`
        }
        variant={
          statusModal.newStatus === "REJECTED"
            ? "danger"
            : statusModal.newStatus === "COMPLETED"
            ? "success"
            : "warning"
        }
        confirmText={`Update to ${statusModal.newStatus}`}
        cancelText="Cancel"
        loading={statusModal.loading}
        details={
          statusModal.matchDetails
            ? [
                {
                  label: "Match ID",
                  value: statusModal.matchDetails.matchId,
                },
                {
                  label: "Current Status",
                  value: statusModal.currentStatus,
                  variant: "warning",
                },
                {
                  label: "New Status",
                  value: statusModal.newStatus,
                  variant:
                    statusModal.newStatus === "REJECTED" ? "danger" : "success",
                },
                {
                  label: "Organ",
                  value: statusModal.matchDetails.organ
                    ? `${statusModal.matchDetails.organ.organType} (${statusModal.matchDetails.organ.bloodType})`
                    : "N/A",
                },
                {
                  label: "Patient",
                  value: statusModal.matchDetails.patient
                    ? statusModal.matchDetails.patient.name
                    : "N/A",
                },
              ]
            : []
        }
      >
        {statusModal.newStatus === "REJECTED" && (
          <div style={{ marginTop: "15px" }}>
            <label
              htmlFor="rejection-reason"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Rejection Reason:
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}

export default MatchesList;
