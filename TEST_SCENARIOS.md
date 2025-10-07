# 🧪 Test Scenarios Documentation

## Overview

This document describes the comprehensive test suite for the Organ Waitlist Registry smart contracts deployed on Hedera Hashgraph. The test suite validates all critical functionality through realistic end-to-end scenarios.

## Table of Contents

- [Running the Tests](#running-the-tests)
- [Test Scenarios](#test-scenarios)
  - [1. Complete Workflow](#1-complete-workflow)
  - [2. Blood Compatibility](#2-blood-compatibility)
  - [3. Urgency Priority](#3-urgency-priority)
  - [4. Organ Expiry](#4-organ-expiry)
  - [5. Concurrent Operations](#5-concurrent-operations)
- [Understanding Test Results](#understanding-test-results)
- [Troubleshooting](#troubleshooting)
- [Verification on HashScan](#verification-on-hashscan)

---

## Running the Tests

### Prerequisites

1. **Deployed Contracts**: Smart contracts must be deployed to Hedera testnet
2. **Environment Configuration**: `.env` file must contain contract IDs
3. **Dependencies Installed**: Run `npm install` in the backend directory
4. **Hedera Account**: Testnet account with sufficient HBAR balance

### Quick Start

```bash
# Run all test scenarios
node tests/run-all-scenarios.js

# Run individual scenarios
npx mocha tests/scenario-complete-workflow.js
npx mocha tests/scenario-blood-compatibility.js
npx mocha tests/scenario-urgency-priority.js
npx mocha tests/scenario-organ-expiry.js
npx mocha tests/scenario-concurrent-operations.js
```

### Expected Duration

- **Complete test suite**: 15-20 minutes
- **Individual scenarios**: 2-5 minutes each

---

## Test Scenarios

### 1. Complete Workflow

**File**: `tests/scenario-complete-workflow.js`
**Icon**: 🏥
**Duration**: 3-5 minutes

#### Description

Simulates a complete end-to-end organ transplant workflow from patient registration through organ allocation.

#### Test Flow

```
┌─────────────────────────────────────┐
│  Phase 1: Patient Registration      │
│  ├─ Register 5 patients             │
│  ├─ Different organ types           │
│  ├─ Various urgency levels          │
│  └─ Verify queue positions          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Phase 2: Organ Offers              │
│  ├─ Offer 3 organs                  │
│  ├─ Different blood types           │
│  ├─ Various viability windows       │
│  └─ Log to HCS                      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Phase 3: Matching Algorithm        │
│  ├─ Run matching for each organ     │
│  ├─ Calculate compatibility scores  │
│  ├─ Rank candidates                 │
│  └─ Select best matches             │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Phase 4: Urgency Updates           │
│  ├─ Update patient urgency          │
│  ├─ Recalculate queue positions     │
│  └─ Verify reordering               │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Phase 5: Allocation                │
│  ├─ Allocate organs to patients     │
│  ├─ Verify transactions             │
│  └─ Update blockchain state         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Phase 6: Audit Trail               │
│  ├─ Retrieve all transactions       │
│  ├─ Verify HCS events               │
│  └─ Generate audit report           │
└─────────────────────────────────────┘
```

#### Test Data

- **5 Patients**: Different organ needs, blood types, urgency levels
- **3 Organs**: KIDNEY, HEART, LIVER
- **Multiple Transactions**: 15+ blockchain transactions
- **Queue Updates**: Dynamic reordering based on urgency

#### Success Criteria

✅ All 5 patients registered successfully
✅ All 3 organs offered successfully
✅ Matching algorithm finds compatible matches
✅ Urgency updates trigger queue reordering
✅ Allocations complete within time limits
✅ All events logged to Hedera Consensus Service

---

### 2. Blood Compatibility

**File**: `tests/scenario-blood-compatibility.js`
**Icon**: 🩸
**Duration**: 2-3 minutes

#### Description

Validates the blood type compatibility matrix for organ transplants, ensuring only medically compatible matches are allowed.

#### Blood Type Compatibility Matrix

```
Recipient Blood Type → Compatible Donors

AB+ (Universal Recipient)
    ✅ Can receive from: O-, O+, A-, A+, B-, B+, AB-, AB+
    ❌ Cannot receive from: None (universal recipient)

AB-
    ✅ Can receive from: O-, A-, B-, AB-
    ❌ Cannot receive from: O+, A+, B+, AB+

A+
    ✅ Can receive from: O-, O+, A-, A+
    ❌ Cannot receive from: B-, B+, AB-, AB+

A-
    ✅ Can receive from: O-, A-
    ❌ Cannot receive from: O+, A+, B-, B+, AB-, AB+

B+
    ✅ Can receive from: O-, O+, B-, B+
    ❌ Cannot receive from: A-, A+, AB-, AB+

B-
    ✅ Can receive from: O-, B-
    ❌ Cannot receive from: O+, A-, A+, B+, AB-, AB+

O+
    ✅ Can receive from: O-, O+
    ❌ Cannot receive from: A-, A+, B-, B+, AB-, AB+

O- (Most Restrictive)
    ✅ Can receive from: O-
    ❌ Cannot receive from: O+, A-, A+, B-, B+, AB-, AB+

O- (Universal Donor)
    ✅ Can donate to: All blood types
```

#### Test Phases

1. **Compatibility Matrix Validation**: Test all 64 blood type combinations
2. **Universal Donor (O-) Testing**: Verify O- can match all recipients
3. **Universal Recipient (AB+) Testing**: Verify AB+ can receive from all donors
4. **Incompatible Rejection**: Ensure incompatible matches are blocked
5. **Rh Factor Testing**: Validate positive/negative compatibility rules
6. **ABO Group Testing**: Verify ABO group compatibility logic

#### Success Criteria

✅ All 64 blood type combinations validated
✅ O- successfully matches all blood types
✅ AB+ successfully receives from all blood types
✅ Incompatible matches correctly rejected
✅ Rh factor rules enforced
✅ ABO group compatibility verified

---

### 3. Urgency Priority

**File**: `tests/scenario-urgency-priority.js`
**Icon**: ⚠️
**Duration**: 2-3 minutes

#### Description

Tests the prioritization algorithm that determines patient queue order based on urgency, medical scores, and wait time.

#### Composite Score Formula

```
Composite Score = (Urgency × 10) + Medical Score + Wait Time Bonus

Where:
  - Urgency: 0-100 (patient's medical urgency)
  - Medical Score: 0-100 (compatibility and medical factors)
  - Wait Time Bonus: Days waited on the list
```

#### Priority Calculation Example

```
Patient A: Urgency 95 → (95 × 10) + 85 + 0 = 1035
Patient B: Urgency 80 → (80 × 10) + 75 + 0 = 875
Patient C: Urgency 60 → (60 × 10) + 70 + 0 = 670
Patient D: Urgency 40 → (40 × 10) + 65 + 30 = 495  (+ 30 days wait bonus)
Patient E: Urgency 25 → (25 × 10) + 60 + 0 = 310

Queue Order: A → B → C → D → E
```

#### Test Phases

1. **Initial Registration**: Register 5 patients with different urgency levels
2. **Queue Verification**: Verify patients ordered by composite score
3. **Urgency Escalation**: Increase patient urgency and verify queue reordering
4. **Urgency Downgrade**: Decrease patient urgency and verify queue reordering
5. **Wait Time Simulation**: Calculate future positions with wait time bonus
6. **Formula Verification**: Validate composite score calculation

#### Dynamic Reordering Example

```
BEFORE Update:
  1. Critical Patient    (Score: 1035)
  2. High Urgency        (Score: 875)
  3. Medium Urgency      (Score: 670)
  4. Low Urgency         (Score: 495)
  5. Stable Patient      (Score: 310)

ACTION: Escalate "Medium Urgency" to 98

AFTER Update:
  1. Medium Urgency ⬆️   (Score: 1050)  ← Moved up!
  2. Critical Patient    (Score: 1035)
  3. High Urgency        (Score: 875)
  4. Low Urgency         (Score: 495)
  5. Stable Patient      (Score: 310)
```

#### Success Criteria

✅ Patients correctly ordered by composite score
✅ Queue positions retrieved from blockchain
✅ Urgency updates trigger immediate reordering
✅ Wait time bonus calculated accurately
✅ Composite score formula validated

---

### 4. Organ Expiry

**File**: `tests/scenario-organ-expiry.js`
**Icon**: ⏰
**Duration**: 2-3 minutes

#### Description

Tests organ viability time limits and time-sensitive matching to ensure organs are allocated before expiry.

#### Organ Viability Times

| Organ Type | Typical Viability | Critical Window |
|------------|-------------------|-----------------|
| Heart      | 4-6 hours         | Last 2 hours    |
| Lungs      | 4-6 hours         | Last 2 hours    |
| Liver      | 12-24 hours       | Last 6 hours    |
| Kidney     | 24-36 hours       | Last 12 hours   |
| Pancreas   | 12-24 hours       | Last 6 hours    |

#### Viability Status Indicators

```
🟢 GOOD (75-100% viable)
   → Sufficient time for careful matching
   → Normal matching priority

🟡 NOTICE (50-75% viable)
   → Begin accelerated matching
   → Prepare transport logistics

🟠 WARNING (25-50% viable)
   → Expedite matching process
   → Consider broader search radius

🔴 CRITICAL (0-25% viable)
   → IMMEDIATE allocation required
   → Broaden criteria, consider non-local matches
   → Maximum urgency
```

#### Test Phases

1. **Patient Registration**: Register patients for time-sensitive organs
2. **Organ Offers**: Offer organs with varying viability times
3. **Time-Sensitive Matching**: Prioritize organs approaching expiry
4. **Expiry Calculation**: Calculate remaining viability in real-time
5. **Allocation Before Expiry**: Successfully allocate before time runs out
6. **Expiry Prevention**: Demonstrate urgency escalation strategies
7. **Post-Expiry Handling**: Mark expired organs as unavailable

#### Expiry Timeline Visualization

```
KIDNEY (30 hours viability):
[███████████████████████████░░░░░░░░] 75% remaining
Elapsed: 450m | Remaining: 1350m
Status: 🟢 GOOD - Standard matching process

LIVER (18 hours viability):
[███████████████████░░░░░░░░░░░░░░░░] 55% remaining
Elapsed: 486m | Remaining: 594m
Status: 🟡 NOTICE - Accelerate matching

HEART (4 hours viability):
[██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 20% remaining
Elapsed: 192m | Remaining: 48m
Status: 🔴 CRITICAL - IMMEDIATE allocation required!
```

#### Success Criteria

✅ Organs offered with correct viability times
✅ Remaining viability calculated accurately
✅ Critical organs prioritized for matching
✅ Allocations completed before expiry
✅ Expiry warnings triggered appropriately
✅ Expired organs marked as unavailable

---

### 5. Concurrent Operations

**File**: `tests/scenario-concurrent-operations.js`
**Icon**: ⚡
**Duration**: 3-5 minutes

#### Description

Tests system behavior under concurrent load, validating transaction ordering, race condition handling, and overall throughput.

#### Test Phases

**Phase 1: Concurrent Patient Registrations**
- Register 10 patients simultaneously
- Verify all transactions complete successfully
- Measure throughput and latency

**Phase 2: Concurrent Organ Offers**
- Offer 5 organs simultaneously
- Ensure no transaction conflicts
- Validate consensus ordering

**Phase 3: Race Condition Testing**
- Send 3 simultaneous urgency updates for same patient
- Verify blockchain handles conflicts correctly
- Ensure data consistency

**Phase 4: Load Testing**
- Execute 20 mixed operations (patients + organs)
- Measure system performance under load
- Validate success rate

**Phase 5: Transaction Ordering**
- Verify transactions processed in consensus order
- Validate no data corruption
- Ensure state consistency

#### Performance Metrics

```
┌────────────────────────────────────────────────────┐
│  Concurrent Patient Registrations (10 patients)    │
├────────────────────────────────────────────────────┤
│  Total time:           12,456ms                    │
│  Average per patient:  1,246ms                     │
│  Success rate:         10/10 (100%)                │
│  Throughput:           0.80 registrations/second   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  Concurrent Organ Offers (5 organs)                │
├────────────────────────────────────────────────────┤
│  Total time:           8,234ms                     │
│  Average per offer:    1,647ms                     │
│  Success rate:         5/5 (100%)                  │
│  Throughput:           0.61 offers/second          │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  Load Test (20 mixed operations)                   │
├────────────────────────────────────────────────────┤
│  Total time:           28,567ms                    │
│  Average per op:       1,428ms                     │
│  Success rate:         18/20 (90%)                 │
│  Throughput:           0.70 operations/second      │
└────────────────────────────────────────────────────┘
```

#### Success Criteria

✅ 80%+ success rate for concurrent registrations
✅ No transaction conflicts or data corruption
✅ Race conditions handled gracefully
✅ 70%+ success rate under load testing
✅ Transactions processed in consensus order
✅ System remains stable under concurrent load

---

## Understanding Test Results

### Console Output

Each test scenario provides detailed console output with:

- **Status Icons**:
  - ✅ Success
  - ❌ Failure
  - ⚠️  Warning
  - ℹ️  Information
  - 🔍 Verification
  - 📊 Statistics

- **Transaction Information**:
  - Transaction ID
  - Patient hash
  - Organ ID
  - Timestamp
  - HashScan link

- **Performance Metrics**:
  - Execution time
  - Success rate
  - Throughput
  - Queue positions

### Test Results File

After running the full suite, a JSON report is generated:

**Location**: `tests/test-results.json`

**Contents**:
```json
{
  "timestamp": "2025-10-06T15:30:00.000Z",
  "totalScenarios": 5,
  "passedScenarios": 5,
  "failedScenarios": 0,
  "totalTime": 892.45,
  "scenarios": [
    {
      "name": "Complete Workflow",
      "passed": true,
      "time": 234.56,
      "icon": "🏥"
    }
  ],
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "win32",
    "contractIds": {
      "waitlist": "0.0.6967107",
      "matching": "0.0.6967117",
      "audit": "0.0.6967119"
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Contract IDs Not Found

**Error**: `❌ Error: Contract IDs not found in environment variables`

**Solution**:
```bash
# Verify .env file exists and contains:
WAITLIST_CONTRACT_ID=0.0.XXXXXXX
MATCHING_CONTRACT_ID=0.0.XXXXXXX
AUDIT_CONTRACT_ID=0.0.XXXXXXX
```

#### 2. Insufficient HBAR Balance

**Error**: `INSUFFICIENT_PAYER_BALANCE`

**Solution**:
- Get free testnet HBAR from: https://portal.hedera.com
- Check balance: `node scripts/check-balance.js`

#### 3. Transaction Timeout

**Error**: `Error: Transaction timed out`

**Solution**:
- Increase timeout in test file (already set to 300s)
- Check Hedera testnet status
- Retry after a few minutes

#### 4. Private Key Format Error

**Error**: `BadKeyError: invalid private key length`

**Solution**:
- Verify private key in `.env` is in DER format (96 hex chars)
- Should start with `302e020100300506032b657004220420` or `3030020100300706052b8104000a04220420`
- Get key from Hedera Portal if needed

#### 5. Test Failures

**Scenario**: Some tests fail but not all

**Debugging Steps**:
1. Check transaction IDs on HashScan
2. Verify contract state is correct
3. Re-run individual failing scenario
4. Check blockchain logs for errors
5. Ensure sufficient gas limits

---

## Verification on HashScan

### View Transactions

All test transactions can be verified on HashScan testnet:

**Base URL**: https://hashscan.io/testnet

### What to Check

1. **Transaction Details**:
   - Go to: `https://hashscan.io/testnet/transaction/[TRANSACTION_ID]`
   - Verify status: SUCCESS
   - Check gas used
   - Review transaction contents

2. **Contract Interactions**:
   - Go to: `https://hashscan.io/testnet/contract/[CONTRACT_ID]`
   - View all contract calls
   - Check state changes
   - Review events emitted

3. **HCS Topic Messages**:
   - Go to: `https://hashscan.io/testnet/topic/[TOPIC_ID]`
   - View all messages
   - Verify event logging
   - Check message contents

### Example Verification

```
Transaction: 0.0.3700702@1759761505.769922366
https://hashscan.io/testnet/transaction/0.0.3700702@1759761505.769922366

Should show:
✅ Status: SUCCESS
✅ Fee: ~0.05 HBAR
✅ Contract: 0.0.6967107 (WaitlistRegistry)
✅ Function: registerPatient
✅ Gas Used: 150,000
```

---

## Next Steps

After running the test suite:

1. **Review Results**: Check console output and `test-results.json`
2. **Verify on HashScan**: Confirm all transactions on blockchain
3. **Check HCS Topics**: Verify event logging
4. **Run Individual Tests**: Deep-dive into specific scenarios
5. **Performance Tuning**: Optimize gas usage if needed
6. **Production Deployment**: Deploy to mainnet when ready

---

## Support

For issues or questions:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [HOW_TO_RUN.md](HOW_TO_RUN.md)
3. Check Hedera docs: https://docs.hedera.com
4. Review test logs carefully

---

## License

MIT License - See [LICENSE](LICENSE) file
