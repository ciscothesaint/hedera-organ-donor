# Complete Step-by-Step Guide: How to Run the Organ Waitlist Registry 🚀

This guide will walk you through **every single step** needed to run the project from scratch, including setting up Hedera, deploying contracts, configuring the environment, and starting the application.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Get Hedera Testnet Account](#get-hedera-testnet-account)
3. [Install Project Dependencies](#install-project-dependencies)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Set Up MongoDB](#set-up-mongodb)
6. [Compile Smart Contracts](#compile-smart-contracts)
7. [Deploy Contracts to Hedera](#deploy-contracts-to-hedera)
8. [Create Admin User](#create-admin-user)
9. [Start the Backend Server](#start-the-backend-server)
10. [Start the Frontend Application](#start-the-frontend-application)
11. [Test the Application](#test-the-application)
12. [Run Test Suite](#run-test-suite)
13. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software

Install the following software on your machine:

#### A. Node.js (v18 or higher)
```bash
# Check if installed
node --version  # Should show v18.x.x or higher

# If not installed, download from:
# https://nodejs.org/
```

#### B. MongoDB
```bash
# Check if installed
mongod --version

# If not installed:
# - Windows: https://www.mongodb.com/try/download/community
# - Mac: brew install mongodb-community
# - Linux: sudo apt-get install mongodb
```

#### C. Git
```bash
# Check if installed
git --version

# If not installed:
# https://git-scm.com/downloads
```

#### D. Solidity Compiler (solc)
```bash
# Install globally
npm install -g solc

# Verify installation
solc --version
```

---

## 2. Get Hedera Testnet Account

### Step 1: Go to Hedera Portal
Open your browser and navigate to:
```
https://portal.hedera.com
```

### Step 2: Create Account
1. Click **"Create Account"** or **"Sign Up"**
2. Fill in your details
3. Verify your email

### Step 3: Generate Testnet Account
1. Once logged in, go to **"Testnet"** section
2. Click **"Create Testnet Account"**
3. You will receive:
   - **Account ID**: `0.0.XXXXXXX`
   - **Private Key**: `302e020100300506032b657004220420...`

### Step 4: Fund Your Account
1. In the portal, find the **"Add Testnet HBAR"** or **"Faucet"** button
2. Request testnet HBAR (usually 10,000 HBAR for testing)
3. Wait for confirmation (usually instant)

### Step 5: Save Your Credentials
**IMPORTANT**: Save these securely - you'll need them later:
```
Account ID: 0.0.XXXXXXX
Private Key: 302e020100300506032b657004220420...
Network: testnet
```

---

## 3. Install Project Dependencies

### Step 1: Navigate to Project Directory
```bash
cd organhedera
```

### Step 2: Install Root Dependencies
```bash
npm install
```

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 4: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 5: Install Test Dependencies
```bash
cd tests
npm install
cd ..
```

### Alternative: Install All at Once
```bash
# From root directory
npm run install-all
cd tests && npm install && cd ..
```

### Verify Installation
```bash
# Check if node_modules exist
ls backend/node_modules | head -5
ls frontend/node_modules | head -5
```

**Expected Output**: You should see directories like `@hashgraph`, `express`, `react`, etc.

---

## 4. Configure Environment Variables

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Create .env File
```bash
# Copy the example file
cp .env.example .env

# Or on Windows:
copy .env.example .env
```

### Step 3: Edit .env File
Open `.env` file in your text editor and fill in the values:

```bash
# Use nano, vim, or any text editor
nano .env
# Or
code .env  # If using VS Code
```

### Step 4: Configure Hedera Credentials

Replace the placeholder values with your actual credentials:

```env
# ============================================
# HEDERA TESTNET CREDENTIALS
# ============================================
# Replace with YOUR account ID from Hedera Portal
HEDERA_ACCOUNT_ID=0.0.XXXXXXX

# Replace with YOUR private key from Hedera Portal
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

# Network (keep as testnet for now)
HEDERA_NETWORK=testnet

# ============================================
# CONTRACT IDs (Leave empty for now)
# ============================================
# These will be filled automatically after deployment
WAITLIST_CONTRACT_ID=
MATCHING_CONTRACT_ID=
AUDIT_CONTRACT_ID=

# ============================================
# HCS TOPIC IDs (Leave empty for now)
# ============================================
# These will be filled automatically after deployment
PATIENT_REGISTRATION_TOPIC_ID=
ORGAN_MATCH_TOPIC_ID=
AUDIT_LOG_TOPIC_ID=

# ============================================
# DATABASE CONFIGURATION
# ============================================
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/organ-waitlist

# ============================================
# API CONFIGURATION
# ============================================
# Port for backend server
PORT=3001

# Environment (development, production)
NODE_ENV=development

# ============================================
# JWT AUTHENTICATION
# ============================================
# Secret key for JWT tokens (change this to a random string)
JWT_SECRET=your-super-secret-key-change-me-in-production

# Token expiration time
JWT_EXPIRE=7d

# ============================================
# RATE LIMITING (Optional)
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Verify Configuration
```bash
# Check if .env file exists and has content
cat .env | grep HEDERA_ACCOUNT_ID
```

**Expected Output**: Should show your account ID (not empty)

---

## 5. Set Up MongoDB

### Option A: Local MongoDB Installation

#### Windows
```bash
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod --dbpath C:\data\db
```

#### Mac
```bash
# Start MongoDB
brew services start mongodb-community

# Or run directly
mongod --config /usr/local/etc/mongod.conf
```

#### Linux
```bash
# Start MongoDB service
sudo systemctl start mongod

# Check status
sudo systemctl status mongod
```

### Option B: MongoDB Docker Container
```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# Verify it's running
docker ps | grep mongodb
```

### Verify MongoDB is Running
```bash
# Try connecting with mongo shell
mongosh

# Or check the port
netstat -an | grep 27017
```

**Expected Output**: Should see MongoDB listening on port 27017

---

## 6. Compile Smart Contracts

### Step 1: Navigate to Contracts Directory
```bash
cd contracts
```

### Step 2: Create Compiled Directory
```bash
mkdir -p compiled
```

### Step 3: Compile WaitlistRegistry
```bash
solc --bin --abi --optimize WaitlistRegistry.sol -o compiled/
```

### Step 4: Compile MatchingEngine
```bash
solc --bin --abi --optimize MatchingEngine.sol -o compiled/
```

### Step 5: Compile AuditTrail
```bash
solc --bin --abi --optimize AuditTrail.sol -o compiled/
```

### Alternative: Use Compilation Script (Unix/Mac)
```bash
# Make script executable
chmod +x ../scripts/compile-contracts.sh

# Run script
../scripts/compile-contracts.sh
```

### Verify Compilation
```bash
# Check if compiled files exist
ls compiled/

# Should show files like:
# WaitlistRegistry.bin
# WaitlistRegistry.abi
# MatchingEngine.bin
# MatchingEngine.abi
# AuditTrail.bin
# AuditTrail.abi
```

**Expected Output**: You should see `.bin` and `.abi` files for each contract

### Troubleshooting Compilation

#### Error: "solc: command not found"
```bash
# Install solc globally
npm install -g solc
```

#### Error: "Compilation failed"
```bash
# Check Solidity version
solc --version

# Should be 0.8.x or higher
# If not, update solc:
npm update -g solc
```

---

## 7. Deploy Contracts to Hedera

### Step 1: Navigate to Root Directory
```bash
cd ..  # From contracts directory
```

### Step 2: Verify Hedera Credentials
```bash
# Check if credentials are set
cd backend
cat .env | grep HEDERA_ACCOUNT_ID
```

Make sure you see your actual account ID, not a placeholder.

### Step 3: Run Deployment Script
```bash
# From root directory
npm run deploy:contracts
```

### What Happens During Deployment:

1. **Connects to Hedera Testnet**
   ```
   ✅ Connected to Hedera Network
   ```

2. **Deploys WaitlistRegistry Contract**
   ```
   📝 Deploying WaitlistRegistry contract...
   ✅ WaitlistRegistry deployed with Contract ID: 0.0.XXXXX
   ```

3. **Deploys MatchingEngine Contract**
   ```
   📝 Deploying MatchingEngine contract...
   ✅ MatchingEngine deployed with Contract ID: 0.0.XXXXX
   ```

4. **Deploys AuditTrail Contract**
   ```
   📝 Deploying AuditTrail contract...
   ✅ AuditTrail deployed with Contract ID: 0.0.XXXXX
   ```

5. **Creates HCS Topics**
   ```
   📝 Creating Hedera Consensus Service Topics...
   ✅ Topic created: 0.0.XXXXX - Patient Registration Events
   ✅ Topic created: 0.0.XXXXX - Organ Match Events
   ✅ Topic created: 0.0.XXXXX - Audit Log Events
   ```

6. **Updates .env File**
   ```
   📝 Updating .env file with deployed contract IDs...
   ✅ .env file updated
   ```

### Step 4: Verify Deployment

Check your `.env` file to confirm it was updated:
```bash
cat backend/.env | grep CONTRACT_ID
cat backend/.env | grep TOPIC_ID
```

**Expected Output**:
```env
WAITLIST_CONTRACT_ID=0.0.12345
MATCHING_CONTRACT_ID=0.0.12346
AUDIT_CONTRACT_ID=0.0.12347
PATIENT_REGISTRATION_TOPIC_ID=0.0.12348
ORGAN_MATCH_TOPIC_ID=0.0.12349
AUDIT_LOG_TOPIC_ID=0.0.12350
```

### Step 5: Verify on Hedera

Visit HashScan to verify your contracts:
```
https://hashscan.io/testnet/contract/0.0.XXXXX
```

Replace `0.0.XXXXX` with your contract IDs.

### Troubleshooting Deployment

#### Error: "INSUFFICIENT_ACCOUNT_BALANCE"
```bash
# Your account needs more HBAR
# Go back to Hedera Portal and request more testnet HBAR
```

#### Error: "INVALID_SIGNATURE"
```bash
# Your private key is incorrect
# Double-check your .env file:
cat backend/.env | grep HEDERA_PRIVATE_KEY
```

#### Error: "Cannot find module"
```bash
# Install dependencies again
cd backend && npm install
```

---

## 8. Create Admin User

### Step 1: Run Admin Setup Script
```bash
# From root directory
node scripts/setup-admin.js
```

### Expected Output:
```
🔧 Setting up admin user...

✅ MongoDB connected successfully
✅ Admin user created successfully!

=============================================================
Admin Credentials:
=============================================================
Email:    admin@organwaitlist.com
Password: admin123
=============================================================

⚠️  IMPORTANT: Change the admin password in production!
```

### Step 2: Save Admin Credentials
```
Email: admin@organwaitlist.com
Password: admin123
```

**IMPORTANT**: These are default credentials for testing. Change them in production!

### Troubleshooting Admin Creation

#### Error: "MongoDB connection error"
```bash
# Make sure MongoDB is running
mongod --version

# Start MongoDB if not running
# (See Step 5 above)
```

#### Admin Already Exists
```
⚠️  Admin user already exists:
   Email: admin@organwaitlist.com
   Username: admin
```
This is fine - admin was already created.

---

## 9. Start the Backend Server

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Expected Output:
```
✅ Hedera client initialized successfully
   Network: testnet
   Operator: 0.0.XXXXX

✅ MongoDB connected successfully

🚀 Server running on port 3001
📊 Health check: http://localhost:3001/health
🔗 API endpoint: http://localhost:3001/api

🏥 Organ Waitlist Registry - Backend Server
⛓️  Network: testnet
```

### Step 3: Verify Backend is Running

Open a new terminal and test:
```bash
# Test health endpoint
curl http://localhost:3001/health

# Or open in browser:
# http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "OK",
  "service": "Organ Waitlist Registry",
  "network": "testnet",
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

### Keep Backend Running
**Don't close this terminal** - keep the backend server running.

---

## 10. Start the Frontend Application

### Step 1: Open New Terminal
Open a **new terminal window** (keep backend running in the other one).

### Step 2: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Expected Output:
```
  VITE v5.2.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 4: Open Application in Browser
```
http://localhost:3000
```

Your browser should automatically open. If not, manually navigate to the URL.

### Step 5: Verify Frontend is Running

You should see:
- **Login page** with the Organ Waitlist Registry title
- Email and password fields
- "Powered by Hedera Hashgraph" message

---

## 11. Test the Application

### Step 1: Login as Admin

1. Navigate to `http://localhost:3000`
2. Enter credentials:
   - **Email**: `admin@organwaitlist.com`
   - **Password**: `admin123`
3. Click **"Login"**

### Step 2: Explore Dashboard

After login, you should see:
- **Dashboard** with statistics
- **Sidebar menu** with navigation options
- Network badge showing "Hedera Testnet"

### Step 3: Register a Test Patient

1. Click **"Register Patient"** in sidebar
2. Fill in the form:
   ```
   Patient ID: TEST123456
   Organ Type: Kidney
   Blood Type: O+
   Urgency Score: 75
   Location: Lagos
   Hospital ID: HOSP001
   ```
3. Click **"Register Patient"**

### Step 4: Verify Registration

After submission, you should see:
- ✅ **Success message**
- **Patient Hash**: `0x1a2b3c...` (SHA-256 hash of your ID)
- **Transaction ID**: `0.0.XXX@XXXXXXXXX.XXX`
- **Status**: `SUCCESS`
- **QR Code** placeholder
- **Next steps** guidance

### Step 5: Check Queue Position

1. Save the patient hash from the registration
2. Use the public endpoint to check position:

```bash
# In a new terminal
curl -X POST http://localhost:3001/api/public/check-position \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "TEST123456"}'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "patientHash": "0x1a2b3c...",
    "queuePosition": "1",
    "message": "Your current position in the queue"
  }
}
```

### Step 6: View Waitlist

1. In the UI, click **"❤️ Heart"** or **"🫘 Kidney"** in sidebar
2. You should see the waitlist with your registered patient

### Step 7: Test Organ Registration

1. Click **"Register Organ"** in sidebar
2. Fill in form:
   ```
   Organ ID: ORG001
   Organ Type: Kidney
   Blood Type: O+
   Weight: 300 grams
   Viability: 6 hours
   Hospital ID: HOSP001
   ```
3. Click **"Register Organ"**
4. Verify success message with transaction ID

---

## 12. Run Test Suite

### Step 1: Open New Terminal
Keep backend and frontend running, open a new terminal.

### Step 2: Navigate to Tests Directory
```bash
cd tests
```

### Step 3: Run Tests
```bash
npm test
```

### Expected Output:
```
  Patient Registration
Test suite initialized
    Patient ID Hashing
      ✓ should hash patient ID consistently
      ✓ should produce different hashes for different IDs

    Patient Registration on Blockchain
      ✓ should register a new patient (5234ms)
✅ Patient registered: 0x1a2b3c...
      ✓ should reject invalid urgency score

    Queue Position
      ✓ should get queue position for registered patient (2145ms)
✅ Queue position: 1

    Urgency Update
      ✓ should update patient urgency (3521ms)
✅ Urgency updated

    Waitlist Query
      ✓ should get waitlist for organ type (2034ms)
✅ Waitlist count for KIDNEY: 1


  7 passing (15s)
```

### Troubleshooting Tests

#### Tests Timeout
```bash
# Increase timeout in test file
# Edit: tests/test-registration.js
# Change: this.timeout(30000) to this.timeout(60000)
```

#### Contract Not Found
```bash
# Make sure contracts are deployed
cat backend/.env | grep WAITLIST_CONTRACT_ID

# Should show a valid contract ID, not empty
```

---

## 13. Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
```bash
# Start MongoDB
mongod

# Or on Mac:
brew services start mongodb-community

# Or with Docker:
docker start mongodb
```

#### 2. Hedera Client Initialization Failed
```
Error: Failed to initialize Hedera client
```

**Solution**:
```bash
# Check your credentials
cd backend
cat .env | grep HEDERA

# Make sure Account ID and Private Key are correct
# No spaces, no quotes, exact copy from Hedera Portal
```

#### 3. Contract ID Not Found
```
Error: CONTRACT_ID_NOT_FOUND
```

**Solution**:
```bash
# Deploy contracts
npm run deploy:contracts

# Verify .env was updated
cat backend/.env | grep CONTRACT_ID
```

#### 4. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
```bash
# Find and kill process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env:
PORT=3002
```

#### 5. Insufficient HBAR Balance
```
Error: INSUFFICIENT_ACCOUNT_BALANCE
```

**Solution**:
1. Go to https://portal.hedera.com
2. Login to your account
3. Navigate to Testnet section
4. Click "Add Testnet HBAR"
5. Wait for confirmation
6. Try deployment again

#### 6. Frontend Can't Connect to Backend
```
Network Error or CORS Error
```

**Solution**:
```bash
# Check backend is running on port 3001
curl http://localhost:3001/health

# Check CORS is enabled in backend/src/index.js
# Should have: app.use(cors());

# Restart both servers
```

#### 7. Admin Login Fails
```
Invalid credentials
```

**Solution**:
```bash
# Recreate admin user
node scripts/setup-admin.js

# Use exact credentials:
# Email: admin@organwaitlist.com
# Password: admin123
```

#### 8. Test Suite Fails
```
Error: Patient registration failed
```

**Solution**:
```bash
# Make sure:
# 1. Backend is running
cd backend && npm run dev

# 2. Contracts are deployed
cat backend/.env | grep CONTRACT_ID

# 3. MongoDB is running
mongosh

# 4. Hedera account has HBAR
# Check at https://hashscan.io/testnet/account/0.0.XXXXX
```

---

## 🎉 Success Checklist

Confirm all these are working:

- [ ] MongoDB is running
- [ ] Backend starts without errors (`http://localhost:3001/health` returns OK)
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Can login with admin credentials
- [ ] Dashboard displays statistics
- [ ] Can register a test patient
- [ ] Patient registration returns a hash and transaction ID
- [ ] Can view waitlists
- [ ] Test suite passes (at least 5/7 tests)

---

## 📊 Quick Reference

### Ports
- **Backend API**: `http://localhost:3001`
- **Frontend UI**: `http://localhost:3000`
- **MongoDB**: `mongodb://localhost:27017`

### Admin Credentials
- **Email**: `admin@organwaitlist.com`
- **Password**: `admin123`

### Important Commands
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Run tests
cd tests && npm test

# Deploy contracts
npm run deploy:contracts

# Create admin
node scripts/setup-admin.js

# Check health
curl http://localhost:3001/health
```

### Important Files
- **Backend Config**: `backend/.env`
- **Contracts**: `contracts/*.sol`
- **Deployment Script**: `scripts/deploy-contracts.js`
- **Test Suite**: `tests/test-registration.js`

---

## 📞 Need Help?

1. **Check Logs**: Look at terminal output for error messages
2. **Review Documentation**:
   - [SETUP_GUIDE.md](SETUP_GUIDE.md)
   - [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
   - [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
3. **Hedera Resources**:
   - Portal: https://portal.hedera.com
   - Docs: https://docs.hedera.com
   - HashScan: https://hashscan.io/testnet
4. **Check Issues**: Review troubleshooting section above

---

## 🎊 Congratulations!

If you've followed all steps successfully, you now have:
- ✅ Hedera testnet account with HBAR
- ✅ Smart contracts deployed to Hedera
- ✅ Backend server running with Hedera integration
- ✅ Frontend application connected to backend
- ✅ MongoDB database configured
- ✅ Admin user created
- ✅ Test suite passing

**Your Organ Waitlist Registry is now fully operational!** 🚀

---

## 📝 Next Steps

1. **Experiment**: Try registering more patients, organs, and running matches
2. **Customize**: Modify the UI, add features, adjust matching algorithm
3. **Production**: See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for production deployment
4. **Mainnet**: When ready, switch to Hedera mainnet (see guide below)

### Switching to Mainnet

```bash
# 1. Get mainnet account at https://portal.hedera.com
# 2. Update backend/.env:
HEDERA_NETWORK=mainnet
HEDERA_ACCOUNT_ID=0.0.XXXXX  # Your mainnet account
HEDERA_PRIVATE_KEY=...        # Your mainnet key

# 3. Redeploy contracts:
npm run deploy:contracts

# 4. Restart servers
```

**Remember**: Mainnet uses real HBAR that costs real money!
