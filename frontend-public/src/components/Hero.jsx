import React from 'react';
import '../styles/hero.css';

function Hero() {
  const scrollToWaitlists = () => {
    document.getElementById('waitlists')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMatches = () => {
    document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span>Running on Hedera Testnet</span>
        </div>

        <h1 className="hero-title">
          Transparent. Fair. <br />
          <span className="hero-highlight">Blockchain-Powered</span><br />
          Organ Allocation
        </h1>

        <p className="hero-subtitle">
          Real-time waitlist data, verified on the Hedera blockchain. <br />
          Complete transparency for public trust and accountability.
        </p>

        <div className="hero-features">
          <div className="feature-item">
            <span className="feature-icon">✅</span>
            <span>Immutable Records</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚖️</span>
            <span>Fair Queue Management</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span>100% Transparent</span>
          </div>
        </div>

        <div className="hero-actions">
          <button className="btn btn-primary" onClick={scrollToMatches}>
            🤝 View Organ Matches
          </button>
          <button className="btn btn-secondary" onClick={scrollToWaitlists}>
            View Live Waitlists
          </button>
        </div>

        <div className="hero-trust">
          <div className="trust-item">
            <span className="trust-label">Powered by</span>
            <span className="trust-value">Hedera Hashgraph</span>
          </div>
          <div className="trust-item">
            <span className="trust-label">Network</span>
            <span className="trust-value">Testnet</span>
          </div>
          <div className="trust-item">
            <span className="trust-label">Status</span>
            <span className="trust-value">
              <span className="status-online"></span> Live
            </span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="blockchain-animation">
          <div className="block block-1"></div>
          <div className="block block-2"></div>
          <div className="block block-3"></div>
          <div className="chain-line"></div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
