import React from 'react';

function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Patient Registration',
      description: 'Medical facility registers patient on blockchain with anonymized data',
      icon: '👨‍⚕️',
      details: ['Encrypted patient hash', 'Blood type & medical criteria', 'Immutable timestamp'],
    },
    {
      number: '2',
      title: 'Fair Queue Management',
      description: 'Automated FIFO (First-In-First-Out) with medical urgency weighting',
      icon: '⚖️',
      details: ['Transparent queue position', 'Urgency-based prioritization', 'No human intervention'],
    },
    {
      number: '3',
      title: 'Organ Matching',
      description: 'Smart contract automatically matches organs to compatible patients',
      icon: '🔗',
      details: ['Blood type compatibility', 'Medical criteria matching', 'Instant notification'],
    },
    {
      number: '4',
      title: 'DAO Governance',
      description: 'Medical professionals vote on exceptional cases through decentralized governance',
      icon: '🗳️',
      details: ['Doctor-only voting', 'Transparent decisions', 'Audit trail for all votes'],
    },
  ];

  return (
    <div className="how-it-works">
      <div className="how-header">
        <h2>How It Works</h2>
        <p>A transparent, fair, and automated organ allocation system</p>
      </div>

      <div className="steps-timeline">
        {steps.map((step, index) => (
          <div key={step.number} className="step-card">
            <div className="step-number">{step.number}</div>
            <div className="step-icon">{step.icon}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
            <ul className="step-details">
              {step.details.map((detail, i) => (
                <li key={i}>
                  <span className="detail-bullet">✓</span>
                  {detail}
                </li>
              ))}
            </ul>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>

      <div className="how-footer">
        <div className="footer-highlight">
          <h4>🔒 Privacy & Transparency</h4>
          <p>
            Patient identities are protected through cryptographic hashing, while queue positions
            and allocation decisions remain fully transparent and verifiable.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
