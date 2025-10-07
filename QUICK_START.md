# Quick Start Guide - TL;DR Version ⚡

**For experienced developers who just need the commands.**

---

## 🚀 First Time Setup (5 minutes)

```bash
# 1. Clone/Navigate to project
cd organhedera

# 2. Install everything
npm run install-all
cd tests && npm install && cd ..

# 3. Configure Hedera credentials
cd backend
cp .env.example .env
nano .env  # Add your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY

# 4. Start MongoDB
mongod

# 5. Deploy contracts (New terminal)
npm run deploy:contracts

# 6. Create admin user
node scripts/setup-admin.js

# 7. Start backend (New terminal)
cd backend && npm run dev

# 8. Start frontend (New terminal)
cd frontend && npm run dev

# 9. Open browser
# http://localhost:3000
# Login: admin@organwaitlist.com / admin123
```

---

## 📋 Daily Usage

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev

# Open: http://localhost:3000
```

---

## 🧪 Run Tests

```bash
cd tests
npm test
```

---

## 📝 Important Info

| What | Where |
|------|-------|
| Backend | http://localhost:3001 |
| Frontend | http://localhost:3000 |
| Health Check | http://localhost:3001/health |
| Admin Email | admin@organwaitlist.com |
| Admin Password | admin123 |
| Network | Hedera Testnet |

---

## 🔑 Get Hedera Credentials

1. https://portal.hedera.com
2. Create account
3. Generate testnet account
4. Request testnet HBAR
5. Copy Account ID and Private Key to `.env`

---

## 🛠️ Troubleshooting One-Liners

```bash
# MongoDB not running?
mongod

# Port already in use?
lsof -ti:3001 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3001  # Windows (then taskkill)

# Need more HBAR?
# Go to https://portal.hedera.com → Add Testnet HBAR

# Contracts not deployed?
npm run deploy:contracts

# Admin doesn't exist?
node scripts/setup-admin.js

# Fresh start?
rm -rf backend/node_modules frontend/node_modules
npm run install-all
```

---

## 📚 Full Documentation

- **Detailed Guide**: [HOW_TO_RUN.md](HOW_TO_RUN.md)
- **Setup**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Complete Guide**: [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
- **Implementation**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

## 🎯 Testing Patient Registration

```bash
# 1. Login to http://localhost:3000
# 2. Go to "Register Patient"
# 3. Fill form:
#    - Patient ID: TEST123
#    - Organ: Kidney
#    - Blood: O+
#    - Urgency: 75
#    - Location: Lagos
# 4. Submit
# 5. Check for hash and transaction ID
```

---

## 🔌 Key API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Register patient
curl -X POST http://localhost:3001/api/patients/register \
  -H "Content-Type: application/json" \
  -d '{"nationalId":"TEST123","organType":"KIDNEY","bloodType":"O+","urgencyScore":75,"location":"Lagos","hospitalId":"HOSP001"}'

# Check position
curl -X POST http://localhost:3001/api/public/check-position \
  -H "Content-Type: application/json" \
  -d '{"nationalId":"TEST123"}'

# Get waitlist
curl http://localhost:3001/api/patients/waitlist/KIDNEY
```

---

## ✅ Success Checklist

- [ ] MongoDB running
- [ ] Backend returns OK on /health
- [ ] Frontend loads at :3000
- [ ] Can login as admin
- [ ] Can register patient
- [ ] Tests pass (cd tests && npm test)

---

**That's it! You're ready to go.** 🎉

For detailed explanations, see [HOW_TO_RUN.md](HOW_TO_RUN.md)
