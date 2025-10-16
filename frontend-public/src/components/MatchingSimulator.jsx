import React, { useState } from 'react';
import mirrorAPI from '../services/mirrorApi';
import { getUrgencyStars, formatScore, getProbabilityColor } from '../utils/matchingUtils';

const ORGAN_TYPES = ['HEART', 'LIVER', 'KIDNEY', 'LUNG', 'PANCREAS'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function MatchingSimulator() {
  const [organType, setOrganType] = useState('HEART');
  const [bloodType, setBloodType] = useState('O+');
  const [weight, setWeight] = useState(250);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await mirrorAPI.simulateMatching({
        organType,
        bloodType,
        weight: parseInt(weight)
      });

      setResults(response.data);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.error || 'Failed to simulate matching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="matching-simulator">
      <div className="simulator-header">
        <h3>=, Organ Matching Simulator</h3>
        <p>Test the matching algorithm with hypothetical organ data</p>
      </div>

      <form onSubmit={handleSimulate} className="simulator-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="organType">Organ Type</label>
            <select
              id="organType"
              value={organType}
              onChange={(e) => setOrganType(e.target.value)}
              className="form-select"
            >
              {ORGAN_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bloodType">Blood Type</label>
            <select
              id="bloodType"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="form-select"
            >
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (grams)</label>
            <input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="form-input"
              min="50"
              max="5000"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-simulate"
          disabled={loading}
        >
          {loading ? 'ó Simulating...' : '¶ Run Simulation'}
        </button>
      </form>

      {error && (
        <div className="simulator-error">
          <p>L {error}</p>
        </div>
      )}

      {results && (
        <div className="simulation-results">
          <div className="results-header">
            <h4>Simulation Results</h4>
            <div className="results-summary">
              <span className="summary-item">
                <strong>{results.topMatches?.length || 0}</strong> Compatible Matches
              </span>
              <span className="summary-item">
                <strong>{results.totalWaitlist || 0}</strong> Total in Queue
              </span>
            </div>
          </div>

          <div className="algorithm-info">
            <h5>=Ê Algorithm Used:</h5>
            <p className="formula">{results.algorithm?.formula}</p>
            <p className="note"> {results.algorithm?.bloodCompatibility}</p>
          </div>

          {results.topMatches && results.topMatches.length > 0 ? (
            <div className="matches-list">
              <h5>Top Matches (Ranked by Score):</h5>
              {results.topMatches.map((match) => (
                <div key={match.rank} className="match-card">
                  <div className="match-header">
                    <span className="match-rank">#{match.rank}</span>
                    <span className="match-patient">
                      Patient {match.patientId}
                      {match.firstName && ` - ${match.firstName} ${match.lastName}`}
                    </span>
                    <span className="match-blood">{match.bloodType}</span>
                  </div>

                  <div className="match-body">
                    <div className="match-stats">
                      <div className="stat">
                        <span className="stat-label">Urgency</span>
                        <span className="stat-value">
                          {getUrgencyStars(match.urgencyLevel)}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Medical Score</span>
                        <span className="stat-value">{match.medicalScore}/100</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Days Waiting</span>
                        <span className="stat-value">{match.daysWaiting}</span>
                      </div>
                    </div>

                    <div className="match-score">
                      <div className="score-breakdown">
                        <div className="breakdown-item">
                          <span className="breakdown-label">Urgency Points:</span>
                          <span className="breakdown-value">
                            +{formatScore(match.breakdown.urgencyPoints)}
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Medical Score:</span>
                          <span className="breakdown-value">
                            +{match.breakdown.medicalScorePoints}
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Wait Time:</span>
                          <span className="breakdown-value">
                            +{match.breakdown.waitTimePoints}
                          </span>
                        </div>
                        <div className="breakdown-total">
                          <span className="breakdown-label">Total Score:</span>
                          <span className="breakdown-value total">
                            {formatScore(match.totalScore)}
                          </span>
                        </div>
                      </div>

                      <div className="match-probability">
                        <span className="probability-label">Match Probability:</span>
                        <div className="probability-bar-container">
                          <div
                            className="probability-bar"
                            style={{
                              width: `${match.matchProbability}%`,
                              backgroundColor: getProbabilityColor(match.matchProbability)
                            }}
                          />
                        </div>
                        <span
                          className="probability-value"
                          style={{ color: getProbabilityColor(match.matchProbability) }}
                        >
                          {match.matchProbability}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-matches">
              <p>L No compatible matches found</p>
              <p className="no-matches-hint">
                No patients in the {results.simulatedOrgan?.organType} waitlist
                have compatible blood type with donor {results.simulatedOrgan?.bloodType}
              </p>
            </div>
          )}

          <div className="results-footer">
            <p className="footer-note">
              =° This simulation used FREE blockchain queries via Hedera Mirror Node
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchingSimulator;
