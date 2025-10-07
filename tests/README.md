# 🧪 Test Suite

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
# or
npm run test:all
```

### Run Individual Test Scenarios

```bash
# Complete workflow (patient registration → matching → allocation)
npm run test:workflow

# Blood type compatibility testing
npm run test:blood

# Urgency priority and queue management
npm run test:urgency

# Organ viability and expiry testing
npm run test:expiry

# Concurrent operations and load testing
npm run test:concurrent
```

## Available Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `npm test` | Run all test scenarios | 15-20 min |
| `npm run test:all` | Same as `npm test` | 15-20 min |
| `npm run test:workflow` | Complete end-to-end workflow | 3-5 min |
| `npm run test:blood` | Blood compatibility tests | 2-3 min |
| `npm run test:urgency` | Urgency prioritization tests | 2-3 min |
| `npm run test:expiry` | Organ expiry management | 2-3 min |
| `npm run test:concurrent` | Load and concurrency tests | 3-5 min |

## Prerequisites

Before running tests ensure contracts are deployed and environment is configured.

See [TEST_SCENARIOS.md](../TEST_SCENARIOS.md) for full documentation.
