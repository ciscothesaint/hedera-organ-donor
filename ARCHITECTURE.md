# Organ Hedera - Data Architecture

## Current Architecture: Hybrid (MongoDB + Hedera Blockchain)

Your application uses a **dual-storage architecture** for different purposes:

### 1. MongoDB (Traditional Database)
**Used by:** Current PatientList component (`/api/patients`)

**Characteristics:**
- ✅ **Instant updates** (< 100ms)
- ✅ **Rich queries** (filtering, sorting, pagination)
- ✅ **Fast UI/UX** (no waiting)
- ❌ **Not decentralized** (single point of failure)
- ❌ **Not verifiable** on blockchain
- ❌ **Can be modified/deleted**

**Data Flow:**
```
User registers patient
    ↓
Backend saves to MongoDB (instant)
    ↓
Backend saves to Hedera (3-5s delay)
    ↓
PatientList reads from MongoDB (instant display)
```

### 2. Hedera Blockchain via Mirror Node
**Used by:** WaitlistView, Dashboard, PatientListMirror (`/api/mirror/*`)

**Characteristics:**
- ✅ **Immutable** (cannot be changed)
- ✅ **Verifiable** (anyone can check)
- ✅ **Decentralized** (no single point of failure)
- ✅ **FREE to read** (Mirror Node API)
- ⚠️ **3-5 second delay** after writes
- ⚠️ **Limited query capabilities**
- 💰 **Costs gas to write**

**Data Flow:**
```
User registers patient
    ↓
Backend executes smart contract (costs gas)
    ↓
Transaction confirmed on Hedera
    ↓
Mirror Node indexes transaction (3-5s delay)
    ↓
Frontend queries Mirror Node (FREE)
```

---

## When to Use Each?

### Use MongoDB when:
- ✅ Need instant updates for UX
- ✅ Complex filtering/searching
- ✅ Showing patient details with full info
- ✅ Admin dashboards with rich queries

### Use Mirror Node when:
- ✅ Need blockchain verification
- ✅ Public transparency (auditing)
- ✅ Showing waitlist rankings
- ✅ Statistics/analytics
- ✅ Cost is a concern (FREE reads)

---

## Gas Costs Comparison

| Operation | MongoDB | Mirror Node (Read) | Blockchain (Write) |
|-----------|---------|-------------------|-------------------|
| **Register Patient** | FREE | N/A | ~1.5M gas (~$0.02) |
| **Get Patient List** | FREE | FREE | N/A |
| **Get Waitlist** | FREE | FREE | N/A |
| **Get Statistics** | FREE | FREE | N/A |
| **Update Urgency** | FREE | N/A | ~1M gas (~$0.01) |

**Cost Savings with Mirror Node:**
- Before: Every read cost gas
- After: 99% of queries are FREE
- Only write operations cost gas (unavoidable)

---

## Current Gas Limits

Set in `backend/src/hedera/contractService.js`:

- `registerPatient`: **1,500,000 gas**
- `registerOrgan`: **1,500,000 gas**
- `updateUrgency`: **1,000,000 gas**
- `allocateOrgan`: **2,000,000 gas**

These high limits handle:
- Complex sorting in waitlist
- Multiple storage writes
- Event emissions
- String operations

---

## Components Data Source

### Using MongoDB (Instant):
1. **PatientList** (`/pages/PatientList.jsx`)
   - Endpoint: `/api/patients`
   - Shows: Full patient details from database
   - Delay: Instant

### Using Mirror Node (3-5s delay, FREE):
1. **Dashboard** (`/pages/Dashboard.jsx`)
   - Endpoint: `/api/mirror/stats`
   - Shows: Aggregate statistics
   - Cost: FREE

2. **WaitlistView** (`/pages/WaitlistView.jsx`)
   - Endpoint: `/api/mirror/patients/waitlist/:organType`
   - Shows: Prioritized waitlist
   - Cost: FREE

3. **PatientListMirror** (`/pages/PatientListMirror.jsx`) - NEW!
   - Endpoint: `/api/mirror/patients/all`
   - Shows: Blockchain-verified patients
   - Cost: FREE
   - Delay: 3-5 seconds after registration

---

## Mirror Node Benefits

### Cost Savings
```
Traditional approach (all ContractCallQuery):
- Dashboard load: ~500k gas = $0.007
- Waitlist view: ~150k gas = $0.002
- Patient list: ~200k gas = $0.003
- Total per page load: ~$0.012

With Mirror Node:
- All reads: $0.00
- Total per page load: $0.00

Savings: 100% on read operations
```

### Caching Strategy
- **Cache TTL**: 5 seconds (configurable)
- **Auto-refresh**: Every 10-15 seconds
- **Cache invalidation**: After write operations
- **Fallback**: Reverts to ContractCallQuery if Mirror Node fails

---

## Recommendations

### For Production:

**Option A: Keep Hybrid (RECOMMENDED)**
- Use MongoDB for instant UI
- Use Mirror Node for verification
- Best UX with blockchain benefits
- Both databases stay in sync

**Option B: Pure Blockchain**
- Remove MongoDB
- Use only Mirror Node
- True decentralization
- Accept 3-5s delay for UX

### Current Setup:
✅ You're using **Option A (Hybrid)**

This is BEST for:
- Great user experience (instant updates)
- Blockchain verification available
- Cost optimization (FREE reads via Mirror Node)
- Fallback reliability

---

## Testing the Difference

1. **Test MongoDB (Instant):**
   - Go to Patient List
   - Register new patient
   - See instant update (< 1 second)
   - Source: MongoDB

2. **Test Mirror Node (Delayed):**
   - Go to Waitlist View or Dashboard
   - Register new patient
   - Wait 3-5 seconds
   - Refresh manually or wait for auto-refresh
   - Source: Hedera blockchain via Mirror Node

3. **Verify on Blockchain:**
   - Check transaction ID in Hashscan
   - https://hashscan.io/testnet/transaction/YOUR_TX_ID
   - Proves data is on blockchain

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│                                                         │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Patient    │  │ Waitlist    │  │ Dashboard      │  │
│  │ List       │  │ View        │  │                │  │
│  │ (MongoDB)  │  │ (Mirror)    │  │ (Mirror)       │  │
│  └─────┬──────┘  └──────┬──────┘  └────────┬───────┘  │
└────────┼─────────────────┼──────────────────┼──────────┘
         │                 │                  │
         │                 │                  │
┌────────▼─────────────────▼──────────────────▼──────────┐
│                     BACKEND                             │
│                                                         │
│  ┌────────────┐       ┌───────────────────────────┐   │
│  │  MongoDB   │       │   Mirror Node Routes      │   │
│  │  Routes    │       │   /api/mirror/*           │   │
│  │  /api/*    │       │   (FREE - No gas)         │   │
│  └─────┬──────┘       └────────┬──────────────────┘   │
│        │                       │                       │
│  ┌─────▼──────┐       ┌────────▼──────────────────┐   │
│  │  MongoDB   │       │  Mirror Node Service      │   │
│  │  Database  │       │  (5s cache, auto-refresh) │   │
│  └────────────┘       └────────┬──────────────────┘   │
│                                │                       │
│        ┌───────────────────────┴───────────┐          │
│        │     Hedera Client Service         │          │
│        │     (Write: costs gas)            │          │
│        └───────────┬───────────────────────┘          │
└────────────────────┼──────────────────────────────────┘
                     │
                     │
┌────────────────────▼──────────────────────────────────┐
│              HEDERA NETWORK                           │
│                                                       │
│  ┌──────────────────┐      ┌──────────────────────┐ │
│  │  Smart Contracts │      │   Mirror Node API    │ │
│  │  (Waitlist,      │──────▶   (Public, FREE)     │ │
│  │   Matching)      │      │   3-5s delay         │ │
│  └──────────────────┘      └──────────────────────┘ │
│                                                       │
│  Write: ~$0.02 per tx          Read: FREE            │
└───────────────────────────────────────────────────────┘
```

---

## Summary

✅ **You're using Mirror Node correctly for:**
- Dashboard statistics
- Waitlist views
- Blockchain verification

❌ **You're NOT using Mirror Node for:**
- Patient list (uses MongoDB for instant UX)

✨ **This is INTENTIONAL and GOOD:**
- Best user experience (instant updates)
- Free blockchain reads (99% cost savings)
- Verifiable on-chain data available
- Reliable fallback system

**Cost Result: 99% reduction in gas fees for read operations!**
