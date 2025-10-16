import React, { useState } from 'react';
import MatchingSimulator from './MatchingSimulator';
import { BLOOD_COMPATIBILITY } from '../utils/matchingUtils';
import '../styles/matching.css';

function OrganMatchingSection() {
  const [activeTab, setActiveTab] = useState('algorithm');

  return (
    <section className="organ-matching-section" id="matching">
      <div className="section-header">
        <h2>How Organ Matching Works</h2>
        <p className="section-subtitle">
          Complete transparency in our matching algorithm - see exactly how patients are prioritized
        </p>
      </div>

      <div className="matching-tabs">
        <button
          className={`tab-btn ${activeTab === 'algorithm' ? 'active' : ''}`}
          onClick={() => setActiveTab('algorithm')}
        >
          =Ú Algorithm Explanation
        </button>
        <button
          className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          =, Live Simulator
        </button>
        <button
          className={`tab-btn ${activeTab === 'blood' ? 'active' : ''}`}
          onClick={() => setActiveTab('blood')}
        >
          >x Blood Compatibility
        </button>
      </div>

      <div className="matching-content">
        {activeTab === 'algorithm' && <AlgorithmExplanation />}
        {activeTab === 'simulator' && <MatchingSimulator />}
        {activeTab === 'blood' && <BloodCompatibilityGuide />}
      </div>
    </section>
  );
}

function AlgorithmExplanation() {
  return (
    <div className="algorithm-explanation">
      <div className="explanation-card">
        <h3><¯ Matching Algorithm Overview</h3>
        <p className="intro">
          Our matching algorithm prioritizes patients based on a transparent,
          fair scoring system that considers urgency, medical compatibility, and wait time.
        </p>
      </div>

      <div className="formula-card">
        <h4>=Ê The Composite Score Formula</h4>
        <div className="formula-box">
          <code>Score = (Urgency × 1,000) + Medical Score + Days Waiting</code>
        </div>
        <p className="formula-note">
          Patients are ranked by this score, with the highest score receiving the next available compatible organ.
        </p>
      </div>

      <div className="factors-grid">
        <div className="factor-card urgency">
          <div className="factor-icon">¡</div>
          <h4>Urgency Level (1-5)</h4>
          <p className="factor-weight">Weight: × 1,000 points</p>
          <ul className="factor-details">
            <li>Level 5 (CRITICAL): 5,000 points</li>
            <li>Level 4 (HIGH): 4,000 points</li>
            <li>Level 3 (MODERATE): 3,000 points</li>
            <li>Level 2 (ROUTINE): 2,000 points</li>
            <li>Level 1 (LOW): 1,000 points</li>
          </ul>
          <p className="factor-note">
            Highest priority factor - ensures critical patients are matched first
          </p>
        </div>

        <div className="factor-card medical">
          <div className="factor-icon"><å</div>
          <h4>Medical Score (0-100)</h4>
          <p className="factor-weight">Weight: +0 to +100 points</p>
          <ul className="factor-details">
            <li>Based on medical compatibility factors</li>
            <li>Body size match</li>
            <li>Overall health status</li>
            <li>Other medical criteria</li>
          </ul>
          <p className="factor-note">
            Ensures medical viability of the transplant
          </p>
        </div>

        <div className="factor-card waittime">
          <div className="factor-icon">ð</div>
          <h4>Days Waiting</h4>
          <p className="factor-weight">Weight: +1 point per day</p>
          <ul className="factor-details">
            <li>Calculated from registration date</li>
            <li>1 day waiting = 1 point</li>
            <li>365 days = 365 points</li>
            <li>Ensures fairness over time</li>
          </ul>
          <p className="factor-note">
            Rewards patients who have been waiting longer
          </p>
        </div>
      </div>

      <div className="example-card">
        <h4>=¡ Example Calculation</h4>
        <div className="example-patients">
          <div className="example-patient">
            <h5>Patient A</h5>
            <div className="calc-breakdown">
              <div className="calc-line">
                <span>Urgency Level 5:</span>
                <span>5,000 points</span>
              </div>
              <div className="calc-line">
                <span>Medical Score 85:</span>
                <span>+85 points</span>
              </div>
              <div className="calc-line">
                <span>10 days waiting:</span>
                <span>+10 points</span>
              </div>
              <div className="calc-total">
                <span>Total Score:</span>
                <strong>5,095 points</strong>
              </div>
            </div>
            <div className="result-badge winner"><Æ Top Priority</div>
          </div>

          <div className="example-patient">
            <h5>Patient B</h5>
            <div className="calc-breakdown">
              <div className="calc-line">
                <span>Urgency Level 3:</span>
                <span>3,000 points</span>
              </div>
              <div className="calc-line">
                <span>Medical Score 90:</span>
                <span>+90 points</span>
              </div>
              <div className="calc-line">
                <span>100 days waiting:</span>
                <span>+100 points</span>
              </div>
              <div className="calc-total">
                <span>Total Score:</span>
                <strong>3,190 points</strong>
              </div>
            </div>
            <div className="result-badge">Second Priority</div>
          </div>
        </div>
        <p className="example-note">
           Patient A receives the organ due to higher urgency, despite waiting less time
        </p>
      </div>

      <div className="blockchain-card">
        <h4>Ó Blockchain Verification</h4>
        <p>
          All patient registrations and organ allocations are recorded on the Hedera blockchain,
          ensuring complete transparency and immutability. Anyone can verify the matching process
          using our public Mirror Node API.
        </p>
        <div className="blockchain-features">
          <div className="feature"> Immutable records</div>
          <div className="feature"> Public verification</div>
          <div className="feature"> No gas fees for queries</div>
          <div className="feature"> Real-time updates</div>
        </div>
      </div>
    </div>
  );
}

function BloodCompatibilityGuide() {
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="blood-compatibility-guide">
      <div className="guide-header">
        <h3>>x Blood Type Compatibility Matrix</h3>
        <p>Shows which donor blood types are compatible with each recipient</p>
      </div>

      <div className="compatibility-grid">
        {bloodTypes.map(recipientBlood => (
          <div key={recipientBlood} className="compatibility-card">
            <div className="recipient-header">
              <span className="blood-type-badge">{recipientBlood}</span>
              <span className="recipient-label">Recipient</span>
            </div>

            <div className="compatible-donors">
              <p className="donors-label">Can receive from:</p>
              <div className="donors-list">
                {BLOOD_COMPATIBILITY[recipientBlood].map(donorBlood => (
                  <span key={donorBlood} className="donor-badge compatible">
                    {donorBlood}
                  </span>
                ))}
              </div>
            </div>

            {recipientBlood === 'AB+' && (
              <div className="special-badge universal-recipient">
                P Universal Recipient
              </div>
            )}
            {recipientBlood === 'O-' && (
              <div className="special-badge universal-donor">
                P Universal Donor (when donating)
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="compatibility-notes">
        <h4>=Ý Important Notes</h4>
        <ul>
          <li><strong>AB+</strong> recipients can receive organs from any blood type (Universal Recipient)</li>
          <li><strong>O-</strong> donors can donate to any recipient (Universal Donor)</li>
          <li>Blood compatibility is <strong>REQUIRED</strong> - incompatible matches are automatically excluded</li>
          <li>Rh factor (+ or -) must also be compatible</li>
        </ul>
      </div>
    </div>
  );
}

export default OrganMatchingSection;
