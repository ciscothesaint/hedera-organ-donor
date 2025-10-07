#!/bin/bash

# Compile Solidity contracts using solc compiler
# This script assumes you have solc installed

echo "🔨 Compiling Solidity contracts..."

# Check if solc is installed
if ! command -v solc &> /dev/null; then
    echo "❌ solc compiler not found. Please install it first:"
    echo "   npm install -g solc"
    exit 1
fi

# Create output directory
mkdir -p contracts/compiled

# Compile contracts
echo "Compiling WaitlistRegistry.sol..."
solc --bin --abi --optimize contracts/WaitlistRegistry.sol -o contracts/compiled/

echo "Compiling MatchingEngine.sol..."
solc --bin --abi --optimize contracts/MatchingEngine.sol -o contracts/compiled/

echo "Compiling AuditTrail.sol..."
solc --bin --abi --optimize contracts/AuditTrail.sol -o contracts/compiled/

echo "✅ Compilation complete! Bytecode saved to contracts/compiled/"
