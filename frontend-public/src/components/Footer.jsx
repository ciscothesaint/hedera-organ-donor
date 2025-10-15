import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>🏥 Organ Waitlist Registry</h3>
          <p>
            Transparent, blockchain-powered organ allocation system ensuring fairness and
            accountability.
          </p>
          <div className="footer-badge">
            <span className="badge-icon">⛓️</span>
            <span>Powered by Hedera Testnet</span>
          </div>
        </div>

        <div className="footer-section">
          <h4>Portals</h4>
          <ul className="footer-links">
            <li>
              <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                Admin Portal →
              </a>
            </li>
            <li>
              <a href="http://localhost:5174" target="_blank" rel="noopener noreferrer">
                DAO Governance →
              </a>
            </li>
            <li>
              <a href="http://localhost:5175">Public Transparency (You are here)</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Blockchain Resources</h4>
          <ul className="footer-links">
            <li>
              <a
                href="https://hashscan.io/testnet"
                target="_blank"
                rel="noopener noreferrer"
              >
                HashScan Explorer ↗
              </a>
            </li>
            <li>
              <a href="https://hedera.com" target="_blank" rel="noopener noreferrer">
                Hedera Network ↗
              </a>
            </li>
            <li>
              <a
                href="https://docs.hedera.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation ↗
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Smart Contracts</h4>
          <ul className="footer-contracts">
            <li>
              <span className="contract-name">Waitlist:</span>
              <code>0.0.6977728</code>
            </li>
            <li>
              <span className="contract-name">Matching:</span>
              <code>0.0.6977730</code>
            </li>
            <li>
              <span className="contract-name">Audit:</span>
              <code>0.0.6977733</code>
            </li>
            <li>
              <span className="contract-name">DAO:</span>
              <code>0.0.6977735</code>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {currentYear} Organ Waitlist Registry. Built on Hedera Hashgraph for complete
          transparency.
        </p>
        <p className="footer-disclaimer">
          All data is publicly verifiable on the blockchain. No central authority controls the
          queue.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
