import React from 'react';

function BlockchainVerification() {
  const hashScanUrl = import.meta.env.VITE_HASHSCAN_URL || 'https://hashscan.io/testnet';

  const contracts = [
    {
      name: 'Waitlist Registry',
      id: '0.0.6977728',
      description: 'Patient registration and queue management',
    },
    {
      name: 'Matching Engine',
      id: '0.0.6977730',
      description: 'Organ allocation and matching logic',
    },
    {
      name: 'Audit Trail',
      id: '0.0.6977733',
      description: 'Complete transaction history',
    },
    {
      name: 'Governance DAO',
      id: '0.0.6977735',
      description: 'Medical professional voting on exceptions',
    },
  ];

  return (
    <div className="blockchain-verification">
      <div className="verification-header">
        <h2>Blockchain Verification</h2>
        <p>All data is publicly verifiable on the Hedera blockchain</p>
      </div>

      <div className="contracts-grid">
        {contracts.map((contract) => (
          <div key={contract.id} className="contract-card">
            <div className="contract-header">
              <h3>{contract.name}</h3>
              <span className="verified-badge">
                <span className="verified-icon">✓</span>
                Verified
              </span>
            </div>
            <p className="contract-description">{contract.description}</p>
            <div className="contract-id">
              <span className="id-label">Contract ID:</span>
              <code className="id-value">{contract.id}</code>
            </div>
            <a
              href={`${hashScanUrl}/contract/${contract.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              View on HashScan ↗
            </a>
          </div>
        ))}
      </div>

      <div className="verification-footer">
        <div className="footer-card">
          <h4>🔍 Why Blockchain?</h4>
          <ul>
            <li>Immutable waitlist records - no tampering possible</li>
            <li>Complete transparency - anyone can verify the queue</li>
            <li>Provable fairness - FIFO with medical criteria</li>
            <li>Decentralized governance - medical professionals vote</li>
          </ul>
        </div>

        <div className="footer-card">
          <h4>⛓️ Powered by Hedera</h4>
          <p>
            Hedera Hashgraph provides fast, secure, and environmentally sustainable blockchain
            infrastructure with:
          </p>
          <ul>
            <li>10,000+ transactions per second</li>
            <li>3-5 second finality</li>
            <li>Carbon negative network</li>
            <li>Enterprise-grade security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BlockchainVerification;
