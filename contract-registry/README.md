# Contract Registry

Centralized registry for all smart contract deployments across Hedera networks.

## Purpose

This registry serves as the **single source of truth** for all deployed smart contract addresses, eliminating the need to manually update multiple `.env` files across different projects.

## Structure

```
contract-registry/
├── deployments.json    # Main registry file
└── README.md          # This file
```

## Usage

### Backend (Node.js)

```javascript
const contractRegistry = require('./src/config/contracts');

// Get contract address
const daoAddress = contractRegistry.getContractAddress('GovernanceDAO');
const waitlistAddress = contractRegistry.getContractAddress('WaitlistRegistry');

// Get topic ID
const topicId = contractRegistry.getTopicId('PatientRegistration');

// Get network info
const network = contractRegistry.getNetwork();
const mirrorNode = contractRegistry.getMirrorNodeUrl();
```

### Frontend (React)

```javascript
import contractRegistry from './config/contracts';

// Get contract address
const daoAddress = contractRegistry.getContractAddress('GovernanceDAO');
```

## Deployment Process

When you deploy contracts using `scripts/deploy-contracts.js`:

1. Contracts are compiled and deployed to Hedera
2. Deployment script automatically updates `contract-registry/deployments.json`
3. All projects (backend, frontend-public, frontend-dao) automatically get the new addresses
4. Deployment history is recorded with timestamps and transaction IDs

## Benefits

✅ **Single source of truth** - One file to update, all projects stay in sync
✅ **Automatic propagation** - No manual copying of addresses
✅ **Version control** - Git tracks all deployment changes
✅ **Environment support** - Testnet, mainnet, and custom networks
✅ **Audit trail** - Complete deployment history with metadata
✅ **CI/CD friendly** - Easy integration with deployment pipelines

## Network Configuration

The registry supports multiple networks:

- `testnet` - Hedera testnet (default for development)
- `mainnet` - Hedera mainnet (production)

Switch networks using the `HEDERA_NETWORK` environment variable:

```bash
HEDERA_NETWORK=testnet  # or mainnet
```

## Schema

### Contract Entry

```json
{
  "address": "0.0.4567890",
  "deployedAt": "2025-10-15T10:00:00Z",
  "deployedBy": "0.0.123456",
  "transactionId": "0.0.123456@1696953600.123456789",
  "version": "1.0.0",
  "bytecodeHash": "sha256:abc123...",
  "abiPath": "backend/contracts/ContractName.abi"
}
```

### Topic Entry

```json
{
  "topicId": "0.0.5678901",
  "createdAt": "2025-10-15T10:00:00Z",
  "description": "Topic description"
}
```

## Maintenance

### Manual Updates

If you need to manually update contract addresses:

1. Edit `contract-registry/deployments.json`
2. Update the appropriate contract address under the correct network
3. Update `lastUpdated` timestamp
4. Commit changes to git

### Rollback

To rollback to a previous deployment:

1. Check git history: `git log contract-registry/deployments.json`
2. Checkout previous version: `git checkout <commit-hash> contract-registry/deployments.json`
3. Restart applications to load old addresses

## Migration from .env

Old approach (manual sync required):
```bash
# backend/.env
DAO_CONTRACT_ID=0.0.4567893

# frontend-public/.env
DAO_CONTRACT_ID=0.0.4567893  # Manual copy!

# frontend-dao/.env
DAO_CONTRACT_ID=0.0.4567893  # Manual copy!
```

New approach (automatic sync):
```bash
# contract-registry/deployments.json (single update)
"GovernanceDAO": {
  "address": "0.0.4567893"
}

# All projects load from registry automatically!
```

## Troubleshooting

### "Contract address not found"

Make sure the contract has been deployed and the registry has been updated. Check `deployments.json` to verify the address exists.

### "Network not found"

Verify your `HEDERA_NETWORK` environment variable matches a network in the registry (testnet or mainnet).

### "Registry file not found"

Ensure you're running the application from the project root, or adjust the registry path in the config loader.
