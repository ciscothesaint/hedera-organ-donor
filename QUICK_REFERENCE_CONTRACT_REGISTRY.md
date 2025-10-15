# Contract Registry - Quick Reference

## What is it?
A centralized system for managing smart contract addresses. No more manual copying between .env files!

---

## Quick Start

### Deploy Contracts
```bash
node scripts/deploy-contracts.js
```
✅ Registry automatically updated
✅ All services get new addresses

### Check Registry
```bash
cat contract-registry/deployments.json
```

### Sync to .env (Optional)
```bash
node scripts/sync-contract-addresses.js testnet
```

---

## Usage in Code

### Backend (Node.js)
```javascript
const contractRegistry = require('./config/contracts');

// Get contract address
const daoAddress = contractRegistry.getContractAddress('GovernanceDAO');

// Get topic ID
const topicId = contractRegistry.getTopicId('PatientRegistration');

// Get network info
const mirrorUrl = contractRegistry.getMirrorNodeUrl();
```

### Frontend (React)
```javascript
import contractRegistry from './config/contracts';

// Get contract address
const daoAddress = contractRegistry.getContractAddress('GovernanceDAO');
```

---

## Available Contracts

| Contract Name | Purpose |
|--------------|---------|
| `WaitlistRegistry` | Patient waitlist management |
| `MatchingEngine` | Organ matching algorithm |
| `AuditTrail` | Audit logging |
| `GovernanceDAO` | Decentralized governance |

## Available Topics

| Topic Name | Purpose |
|-----------|---------|
| `PatientRegistration` | Patient registration events |
| `OrganMatch` | Organ matching events |
| `AuditLog` | Audit trail events |

---

## Common Commands

```bash
# Deploy to testnet
HEDERA_NETWORK=testnet node scripts/deploy-contracts.js

# Deploy to mainnet
HEDERA_NETWORK=mainnet node scripts/deploy-contracts.js

# Sync addresses to .env
node scripts/sync-contract-addresses.js testnet

# View deployment history
cat contract-registry/deployments.json | grep deploymentHistory

# Check last update
cat contract-registry/deployments.json | grep lastUpdated
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Contract address not found" | Deploy contracts first |
| "Network not found" | Set HEDERA_NETWORK to testnet or mainnet |
| "Registry not found" | Run from project root |
| Old addresses in use | Restart backend server |

---

## File Locations

- **Registry:** `contract-registry/deployments.json`
- **Backend Loader:** `backend/src/config/contracts.js`
- **Frontend Loaders:** `frontend-*/src/config/contracts.js`
- **Deployment Script:** `scripts/deploy-contracts.js`
- **Sync Script:** `scripts/sync-contract-addresses.js`

---

## Benefits

✅ Single source of truth
✅ No manual copying
✅ Git version control
✅ Automatic updates
✅ Multi-network support
✅ Deployment history

---

## Migration

### Before (❌ Old Way)
```javascript
const contractId = process.env.WAITLIST_CONTRACT_ID;
```

### After (✅ New Way)
```javascript
const contractRegistry = require('./config/contracts');
const contractId = contractRegistry.getContractAddress('WaitlistRegistry');
```

---

## Registry Loader API

### Methods
- `getContractAddress(name)` - Get contract ID
- `getTopicId(name)` - Get topic ID
- `getAllContracts()` - Get all contracts
- `getAllTopics()` - Get all topics
- `getNetwork()` - Get network config
- `getNetworkName()` - Get network name
- `getMirrorNodeUrl()` - Get Mirror Node URL
- `isContractDeployed(name)` - Check if deployed
- `getVersion()` - Get registry version
- `getLastUpdated()` - Get last update time
- `getDeploymentHistory()` - Get deployment log

---

## Example: Full Deployment Flow

```bash
# 1. Deploy contracts
node scripts/deploy-contracts.js

# 2. Verify registry
cat contract-registry/deployments.json

# 3. Commit to git
git add contract-registry/deployments.json
git commit -m "Deploy contracts to testnet"

# 4. Restart backend
cd backend && npm run dev

# Done! All services now use new addresses
```

---

## Need Help?

- **Full Documentation:** `CONTRACT_REGISTRY_IMPLEMENTATION.md`
- **Registry README:** `contract-registry/README.md`
- **Issues:** Check troubleshooting section above
