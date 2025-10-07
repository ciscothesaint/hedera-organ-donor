# Organ Waitlist Registry on Hedera 🏥

A transparent, immutable organ waitlist system built on Hedera that prevents queue manipulation and ensures fair organ allocation based on medical criteria and wait time.

## Features

- **Immutable Registration**: Patient registrations stored on Hedera blockchain
- **Fair Queue Management**: Transparent waitlist ordering based on medical urgency and wait time
- **Automated Matching**: Smart contract-based organ matching algorithm
- **Audit Trail**: Complete transparency with Hedera Consensus Service
- **Anti-Manipulation**: Blockchain prevents unauthorized queue changes

## Architecture

### Smart Contracts
- **WaitlistRegistry.sol**: Patient registration and queue management
- **MatchingEngine.sol**: Organ matching based on medical criteria
- **AuditTrail.sol**: Immutable logging of all operations

### Backend (Node.js + Express)
- Hedera SDK integration
- REST API for frontend
- MongoDB for off-chain data
- JWT authentication

### Frontend (React)
- Patient registration interface
- Waitlist dashboard
- Real-time matching notifications
- Audit log viewer

## 🚀 Quick Start

### For Experienced Developers
See **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes!

### For Detailed Instructions
See **[HOW_TO_RUN.md](HOW_TO_RUN.md)** - Complete step-by-step guide with screenshots and troubleshooting.

### One-Command Setup
```bash
# Install all dependencies
npm run install-all && cd tests && npm install && cd ..

# Configure (edit .env with your Hedera credentials)
cd backend && cp .env.example .env

# Deploy contracts to Hedera
npm run deploy:contracts

# Start everything
npm run dev
```

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | ⚡ 5-minute quick start for experienced devs |
| **[HOW_TO_RUN.md](HOW_TO_RUN.md)** | 📖 Complete step-by-step guide with troubleshooting |
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | 🔧 Installation and configuration details |
| **[COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)** | 📘 Full implementation guide with API docs |
| **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** | ✅ Feature checklist and status report |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | 📊 Project overview and architecture |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | 🚢 Production deployment guide |

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **MongoDB** ([Download](https://mongodb.com/try/download/community))
- **Hedera Testnet Account** ([Get Free Account](https://portal.hedera.com))
- **Solidity Compiler**: `npm install -g solc`

## Installation

### 1. Install Dependencies
```bash
npm run install-all
cd tests && npm install && cd ..
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your:
# - HEDERA_ACCOUNT_ID (from Hedera Portal)
# - HEDERA_PRIVATE_KEY (from Hedera Portal)
```

### 3. Start MongoDB
```bash
# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 4. Deploy Smart Contracts
```bash
npm run deploy:contracts
# This automatically updates your .env with contract IDs
```

### 5. Create Admin User
```bash
node scripts/setup-admin.js
# Credentials: admin@organwaitlist.com / admin123
```

### 6. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Open http://localhost:3000
```

## Testing

### Run Test Suite
```bash
cd tests
npm test
```

### Test Patient Registration
1. Open `http://localhost:3000`
2. Login with admin credentials
3. Navigate to "Register Patient"
4. Fill the form and submit
5. Verify blockchain transaction ID

## Environment Variables

Key variables in `backend/.env`:

```env
# Hedera Credentials (from https://portal.hedera.com)
HEDERA_ACCOUNT_ID=0.0.XXXXX
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_NETWORK=testnet

# Contract IDs (auto-filled after deployment)
WAITLIST_CONTRACT_ID=0.0.XXXXX
MATCHING_CONTRACT_ID=0.0.XXXXX
AUDIT_CONTRACT_ID=0.0.XXXXX

# Database
MONGODB_URI=mongodb://localhost:27017/organ-waitlist

# API
PORT=3001
JWT_SECRET=your-secret-key
```

## License

MIT
