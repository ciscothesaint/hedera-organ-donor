# Deployment Checklist 📋

Use this checklist to ensure proper setup and deployment of the Organ Waitlist Registry.

## ✅ Pre-Deployment Checklist

### 1. Prerequisites Installation
- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running
- [ ] Hedera testnet account created
- [ ] Solidity compiler installed (`npm install -g solc`)
- [ ] Git installed

### 2. Project Setup
- [ ] Navigate to project directory
- [ ] Run `npm run install-all`
- [ ] All dependencies installed successfully

### 3. Configuration
- [ ] Created `backend/.env` from `.env.example`
- [ ] Added Hedera Account ID to `.env`
- [ ] Added Hedera Private Key to `.env`
- [ ] Set MongoDB URI in `.env`
- [ ] Set JWT secret in `.env`
- [ ] Verified all environment variables

### 4. Database Setup
- [ ] MongoDB service running
- [ ] Database connection tested
- [ ] Created admin user (`node scripts/setup-admin.js`)
- [ ] Verified admin credentials work

### 5. Smart Contracts
- [ ] Compiled contracts (`solc` or `compile-contracts.sh`)
- [ ] Bytecode files generated in `contracts/compiled/`
- [ ] Verified contract compilation successful

### 6. Hedera Deployment
- [ ] Sufficient HBAR in testnet account (get from portal)
- [ ] Deployed contracts (`npm run deploy:contracts`)
- [ ] WaitlistRegistry contract deployed
- [ ] MatchingEngine contract deployed
- [ ] AuditTrail contract deployed
- [ ] HCS topics created
- [ ] Contract IDs saved to `.env`
- [ ] Topic IDs saved to `.env`

### 7. Backend Testing
- [ ] Backend starts without errors (`cd backend && npm run dev`)
- [ ] Server running on port 3001
- [ ] MongoDB connection successful
- [ ] Health check endpoint works (`http://localhost:3001/health`)
- [ ] Login API tested

### 8. Frontend Testing
- [ ] Frontend starts without errors (`cd frontend && npm run dev`)
- [ ] Frontend accessible at `http://localhost:3000`
- [ ] Login page loads
- [ ] Can login with admin credentials
- [ ] Dashboard displays
- [ ] Navigation works

---

## 🧪 Functional Testing Checklist

### Authentication Flow
- [ ] Can login with admin credentials
- [ ] JWT token received
- [ ] Token stored in browser
- [ ] Protected routes work
- [ ] Logout works
- [ ] Invalid credentials rejected

### Patient Management
- [ ] Navigate to "Register Patient"
- [ ] Fill out patient form
- [ ] Submit patient registration
- [ ] Success message displayed
- [ ] Patient appears in "Patients" list
- [ ] Patient data correct
- [ ] Blockchain transaction ID present
- [ ] MongoDB record created

### Organ Management
- [ ] Navigate to "Register Organ"
- [ ] Fill out organ form
- [ ] Submit organ registration
- [ ] Success message displayed
- [ ] Organ appears in "Organs" list
- [ ] Organ data correct
- [ ] Blockchain transaction ID present

### Waitlist Testing
- [ ] Navigate to Heart waitlist
- [ ] Patients displayed in order
- [ ] Urgency levels shown correctly
- [ ] Registration dates displayed
- [ ] Position numbers correct
- [ ] Can view other organ waitlists

### Allocation Workflow
- [ ] Register test patient
- [ ] Register compatible organ
- [ ] Use "Find Match" feature
- [ ] Compatible patient found
- [ ] Allocate organ to patient
- [ ] Allocation recorded on blockchain
- [ ] Patient status updated
- [ ] Organ status changed to "ALLOCATED"

---

## 🚀 Production Deployment Checklist

### Security Hardening
- [ ] Changed default admin password
- [ ] Generated strong JWT secret
- [ ] Enabled HTTPS
- [ ] Set up firewall rules
- [ ] Disabled debug mode
- [ ] Removed development credentials
- [ ] Set NODE_ENV to 'production'
- [ ] Configured CORS properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Environment Configuration
- [ ] Switch to Hedera mainnet
- [ ] Update HEDERA_NETWORK to 'mainnet'
- [ ] Use production MongoDB
- [ ] Update frontend API URL
- [ ] Configure production domain
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx/apache)

### Monitoring & Logging
- [ ] Set up application monitoring
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up log aggregation
- [ ] Configure alerts
- [ ] Set up uptime monitoring
- [ ] Database backup configured
- [ ] Disaster recovery plan

### Performance Optimization
- [ ] Frontend built for production (`npm run build`)
- [ ] Static assets optimized
- [ ] CDN configured (if applicable)
- [ ] Database indexes created
- [ ] Caching configured
- [ ] Load balancer set up (if needed)

### Documentation
- [ ] API documentation complete
- [ ] User manual created
- [ ] Admin guide written
- [ ] Deployment notes documented
- [ ] Troubleshooting guide available

### Legal & Compliance
- [ ] HIPAA compliance verified (if applicable)
- [ ] Data protection policies implemented
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] User consent mechanisms in place
- [ ] Audit trail properly logging all actions

---

## 📊 Post-Deployment Verification

### Smoke Tests
- [ ] Application accessible at production URL
- [ ] HTTPS working correctly
- [ ] Login functionality works
- [ ] Patient registration works
- [ ] Organ registration works
- [ ] Waitlist displays correctly
- [ ] Blockchain transactions succeed
- [ ] Database queries performing well

### Performance Tests
- [ ] Page load times acceptable
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Concurrent users handled

### Security Audit
- [ ] Penetration testing completed
- [ ] Vulnerability scan passed
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled
- [ ] Authentication tested
- [ ] Authorization tested

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB connection failed
**Solution:**
```bash
# Check if MongoDB is running
mongod --version
# Start MongoDB
mongod
```

### Issue: Hedera transaction timeout
**Solution:**
- Check account balance (needs HBAR)
- Verify network connectivity
- Check Hedera network status

### Issue: Contract deployment failed
**Solution:**
- Ensure contracts are compiled
- Check HBAR balance
- Verify private key is correct

### Issue: Frontend cannot reach backend
**Solution:**
- Check CORS configuration
- Verify API URL in frontend
- Check backend is running
- Verify firewall rules

### Issue: Authentication not working
**Solution:**
- Check JWT_SECRET is set
- Verify token expiration
- Check user exists in database
- Verify password is correct

---

## 📝 Deployment Sign-Off

### Completed By
- Name: _________________
- Date: _________________
- Environment: [ ] Development [ ] Staging [ ] Production

### Verification
- [ ] All checklist items completed
- [ ] Testing passed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Backup created
- [ ] Rollback plan ready

### Sign-Off
- Developer: _________________ Date: _______
- QA: _________________ Date: _______
- DevOps: _________________ Date: _______
- Manager: _________________ Date: _______

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ All users can login
✅ Patients can be registered on blockchain
✅ Organs can be registered on blockchain
✅ Waitlists display correctly
✅ Matching algorithm works
✅ Allocations are recorded
✅ Audit trail is complete
✅ No critical errors in logs
✅ Performance meets requirements
✅ Security measures in place

---

**Congratulations on deploying the Organ Waitlist Registry!** 🎊
