# Organ Waitlist Registry Setup Guide 🏥

Complete guide to set up and run the Organ Waitlist Registry on Hedera.

## Prerequisites

### 1. Software Requirements
- **Node.js** 18+ ([Download](https://nodejs.org))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/downloads))

### 2. Hedera Testnet Account
1. Visit [Hedera Portal](https://portal.hedera.com)
2. Create a testnet account
3. Save your Account ID and Private Key

### 3. Solidity Compiler (for contract compilation)
```bash
npm install -g solc
```

---

## Installation Steps

### Step 1: Clone or Navigate to Project
```bash
cd organhedera
```

### Step 2: Install Dependencies
```bash
npm run install-all
```

This will install dependencies for:
- Root workspace
- Backend
- Frontend

### Step 3: Configure Environment Variables

Create `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your Hedera credentials:

```env
# Hedera Testnet Credentials
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet

# MongoDB
MONGODB_URI=mongodb://localhost:27017/organ-waitlist

# API
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
```

### Step 4: Start MongoDB

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Step 5: Compile Smart Contracts

```bash
cd contracts
solc --bin --abi --optimize WaitlistRegistry.sol -o compiled/
solc --bin --abi --optimize MatchingEngine.sol -o compiled/
solc --bin --abi --optimize AuditTrail.sol -o compiled/
```

Or use the script (Unix/Mac):
```bash
chmod +x scripts/compile-contracts.sh
./scripts/compile-contracts.sh
```

### Step 6: Deploy Contracts to Hedera

```bash
npm run deploy:contracts
```

This will:
- Deploy all 3 smart contracts to Hedera testnet
- Create HCS topics for event logging
- Update your `.env` file with contract IDs

### Step 7: Create Admin User

```bash
node scripts/setup-admin.js
```

Default admin credentials:
- **Email:** admin@organwaitlist.com
- **Password:** admin123

⚠️ **Change this in production!**

### Step 8: Start the Application

Open 2 terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 9: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

Login with admin credentials:
- Email: `admin@organwaitlist.com`
- Password: `admin123`

---

## Project Structure

```
organhedera/
├── contracts/              # Solidity smart contracts
│   ├── WaitlistRegistry.sol
│   ├── MatchingEngine.sol
│   └── AuditTrail.sol
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── hedera/       # Hedera integration
│   │   ├── api/          # REST API routes
│   │   ├── services/     # Business logic
│   │   ├── db/           # Database models
│   │   └── middleware/   # Auth & validation
│   └── .env
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── scripts/              # Deployment scripts
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Register patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id/urgency` - Update urgency
- `GET /api/patients/waitlist/:organType` - Get waitlist

### Organs
- `GET /api/organs` - Get all organs
- `POST /api/organs` - Register organ
- `POST /api/organs/allocate` - Allocate organ
- `POST /api/organs/:id/accept` - Accept allocation
- `POST /api/organs/:id/reject` - Reject allocation
- `POST /api/organs/:id/complete` - Complete transplant

---

## Smart Contracts on Hedera

### WaitlistRegistry
Manages patient registration and waitlist queue:
- Register patients with medical data
- Update urgency levels
- Sort waitlist by composite score
- Remove patients from queue

### MatchingEngine
Handles organ allocation:
- Register organs with viability data
- Find compatible matches
- Allocate organs to patients
- Track allocation status

### AuditTrail
Immutable logging system:
- Log all operations
- Track state changes
- Query historical data
- Verify data integrity

---

## Hedera Consensus Service (HCS)

Three topics log events:
1. **Patient Registration Topic** - Patient registrations
2. **Organ Match Topic** - Organ allocations
3. **Audit Log Topic** - All system events

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
mongod
```

### Hedera Transaction Failed
```
Error: INSUFFICIENT_ACCOUNT_BALANCE
```
**Solution:** Fund your testnet account at [Hedera Portal](https://portal.hedera.com)

### Contract Deployment Failed
```
Error: CONTRACT_BYTECODE_EMPTY
```
**Solution:** Compile contracts first
```bash
./scripts/compile-contracts.sh
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:** Kill process using the port
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

---

## Testing

### Test Patient Registration Flow

1. **Login** as admin
2. Navigate to **Register Patient**
3. Fill in patient details
4. Submit form
5. Check **Patients** page - patient should appear
6. View blockchain transaction ID

### Test Organ Allocation Flow

1. **Register an organ**
2. Navigate to organ waitlist
3. Use **Find Match** to find compatible patient
4. **Allocate** organ to patient
5. **Accept** allocation
6. **Complete** transplant

---

## Production Deployment

### Security Checklist

- [ ] Change admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Use environment-specific configs
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Use Hedera mainnet

### Deploy to Hedera Mainnet

1. Update `.env`:
```env
HEDERA_NETWORK=mainnet
```

2. Redeploy contracts:
```bash
npm run deploy:contracts
```

3. Update frontend API URL

---

## Support & Resources

- [Hedera Documentation](https://docs.hedera.com)
- [Hedera SDK (JavaScript)](https://github.com/hashgraph/hedera-sdk-js)
- [MongoDB Documentation](https://docs.mongodb.com)
- [React Documentation](https://react.dev)

---

## License

MIT License
