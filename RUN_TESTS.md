# 🚀 How to Run Tests

## Step-by-Step Guide

### 1. Install Dependencies (First Time Only)

```bash
npm install
```

### 2. Ensure Contracts are Deployed

Your contracts should already be deployed. Verify in `.env`:
```
WAITLIST_CONTRACT_ID=0.0.6967107
MATCHING_CONTRACT_ID=0.0.6967117
AUDIT_CONTRACT_ID=0.0.6967119
```

### 3. Run Tests

#### Option A: Run All Tests (Recommended)
```bash
npm test
```
This will run all 5 test scenarios sequentially (15-20 minutes total).

#### Option B: Run Individual Tests
```bash
# Test 1: Complete Workflow (3-5 minutes)
npm run test:workflow

# Test 2: Blood Compatibility (2-3 minutes)
npm run test:blood

# Test 3: Urgency Priority (2-3 minutes)
npm run test:urgency

# Test 4: Organ Expiry (2-3 minutes)
npm run test:expiry

# Test 5: Concurrent Operations (3-5 minutes)
npm run test:concurrent
```

## What You'll See

```
🧪  ORGAN WAITLIST REGISTRY - COMPREHENSIVE TEST SUITE
================================================================================

Scenarios to run:
  1. 🏥 Complete Workflow
     End-to-end patient registration, organ matching, and allocation
     Estimated time: 3-5 minutes

  2. 🩸 Blood Compatibility
     Blood type compatibility matrix and matching rules
     Estimated time: 2-3 minutes

  ... [more scenarios]

================================================================================

🏥 Running: Complete Workflow
────────────────────────────────────────────────────────────────────────────────

📝 Registering Patient A:
   National ID: NG-001-2025-KID
   Organ Needed: KIDNEY
   Blood Type: O+
   Urgency: 85/100
   ✅ Registered with hash: 0x3f5e...
   📝 Transaction: 0.0.3700702@1759761505.769922366
   🔗 View on HashScan: https://hashscan.io/testnet/transaction/...

... [test continues]

✅ Complete Workflow completed successfully in 234.56s

================================================================================
📊  FINAL TEST SUMMARY
================================================================================

Scenario Results:
  1. 🏥 Complete Workflow        ✅ PASSED (234.56s)
  2. 🩸 Blood Compatibility       ✅ PASSED (156.23s)
  3. ⚠️  Urgency Priority          ✅ PASSED (178.45s)
  4. ⏰ Organ Expiry              ✅ PASSED (145.67s)
  5. ⚡ Concurrent Operations     ✅ PASSED (177.54s)

Overall Statistics:
  Total Scenarios:    5
  Passed:             5
  Failed:             0
  Total Time:         892.45s (14.87 minutes)
  Success Rate:       100%

🎉  All scenarios passed! Your smart contracts are working correctly.
```

## Verify Results

1. **Check Console Output**: Review detailed logs above
2. **Check test-results.json**: JSON report with all statistics
3. **Verify on HashScan**: Visit transaction links to see on-chain data

## Troubleshooting

**If tests fail:**
1. Check that contracts are deployed: `cat backend/.env | grep CONTRACT_ID`
2. Verify HBAR balance in your testnet account
3. Check Hedera testnet status
4. Re-run the failing scenario individually

**Get Help:**
- Read [TEST_SCENARIOS.md](TEST_SCENARIOS.md) for detailed documentation
- Check [HOW_TO_RUN.md](HOW_TO_RUN.md) for deployment guide
