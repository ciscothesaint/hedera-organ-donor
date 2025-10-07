#!/usr/bin/env node

/**
 * Master Test Runner for Organ Waitlist Registry
 *
 * Executes all test scenarios in sequence and generates a comprehensive report
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test scenarios to run
const scenarios = [
    {
        name: 'Complete Workflow',
        file: 'scenario-complete-workflow.js',
        description: 'End-to-end patient registration, organ matching, and allocation',
        icon: '🏥',
        estimatedTime: '3-5 minutes'
    },
    {
        name: 'Blood Compatibility',
        file: 'scenario-blood-compatibility.js',
        description: 'Blood type compatibility matrix and matching rules',
        icon: '🩸',
        estimatedTime: '2-3 minutes'
    },
    {
        name: 'Urgency Priority',
        file: 'scenario-urgency-priority.js',
        description: 'Queue prioritization and urgency-based ordering',
        icon: '⚠️ ',
        estimatedTime: '2-3 minutes'
    },
    {
        name: 'Organ Expiry',
        file: 'scenario-organ-expiry.js',
        description: 'Time-sensitive organ viability and expiry management',
        icon: '⏰',
        estimatedTime: '2-3 minutes'
    },
    {
        name: 'Concurrent Operations',
        file: 'scenario-concurrent-operations.js',
        description: 'Load testing and concurrent transaction handling',
        icon: '⚡',
        estimatedTime: '3-5 minutes'
    }
];

// Test results
const results = {
    scenarios: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    totalTime: 0,
    startTime: null,
    endTime: null
};

/**
 * Print formatted header
 */
function printHeader() {
    console.log('\n' + colors.bright + colors.cyan + '='.repeat(80));
    console.log('🧪  ORGAN WAITLIST REGISTRY - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(80) + colors.reset + '\n');
    console.log('This suite will run all test scenarios to validate the smart contracts.\n');
    console.log(colors.bright + 'Scenarios to run:' + colors.reset);
    scenarios.forEach((scenario, idx) => {
        console.log(`  ${idx + 1}. ${scenario.icon} ${colors.bright}${scenario.name}${colors.reset}`);
        console.log(`     ${scenario.description}`);
        console.log(`     ${colors.cyan}Estimated time: ${scenario.estimatedTime}${colors.reset}\n`);
    });
    console.log(colors.yellow + 'Total estimated time: 15-20 minutes' + colors.reset);
    console.log(colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

/**
 * Run a single test scenario
 */
function runScenario(scenario) {
    return new Promise((resolve) => {
        console.log('\n' + colors.bright + colors.blue + '─'.repeat(80));
        console.log(`${scenario.icon}  Running: ${scenario.name}`);
        console.log('─'.repeat(80) + colors.reset + '\n');

        const startTime = Date.now();
        const testFile = path.join(__dirname, scenario.file);

        // Check if file exists
        if (!fs.existsSync(testFile)) {
            console.error(colors.red + `❌ Test file not found: ${scenario.file}` + colors.reset);
            resolve({
                name: scenario.name,
                passed: false,
                failed: 0,
                total: 0,
                time: 0,
                error: 'File not found'
            });
            return;
        }

        // Run mocha test
        const mocha = spawn('npx', ['mocha', testFile, '--timeout', '300000', '--colors'], {
            cwd: path.join(__dirname, '..'),
            shell: true,
            stdio: 'inherit'
        });

        mocha.on('close', (code) => {
            const endTime = Date.now();
            const elapsed = (endTime - startTime) / 1000;

            const result = {
                name: scenario.name,
                icon: scenario.icon,
                passed: code === 0,
                exitCode: code,
                time: elapsed
            };

            if (code === 0) {
                console.log('\n' + colors.green + colors.bright +
                    `✅ ${scenario.name} completed successfully in ${elapsed.toFixed(2)}s` +
                    colors.reset + '\n');
            } else {
                console.log('\n' + colors.red + colors.bright +
                    `❌ ${scenario.name} failed (exit code: ${code})` +
                    colors.reset + '\n');
            }

            resolve(result);
        });

        mocha.on('error', (error) => {
            console.error(colors.red + `❌ Error running ${scenario.name}: ${error.message}` + colors.reset);
            resolve({
                name: scenario.name,
                icon: scenario.icon,
                passed: false,
                error: error.message,
                time: (Date.now() - startTime) / 1000
            });
        });
    });
}

/**
 * Print final summary
 */
function printSummary() {
    const totalTime = (results.endTime - results.startTime) / 1000;
    const passedScenarios = results.scenarios.filter(s => s.passed).length;
    const failedScenarios = results.scenarios.filter(s => !s.passed).length;

    console.log('\n' + colors.bright + colors.cyan + '='.repeat(80));
    console.log('📊  FINAL TEST SUMMARY');
    console.log('='.repeat(80) + colors.reset + '\n');

    console.log(colors.bright + 'Scenario Results:' + colors.reset);
    console.log('─'.repeat(80));

    results.scenarios.forEach((scenario, idx) => {
        const status = scenario.passed ?
            colors.green + '✅ PASSED' :
            colors.red + '❌ FAILED';
        const time = scenario.time ? `${scenario.time.toFixed(2)}s` : 'N/A';

        console.log(`  ${idx + 1}. ${scenario.icon} ${colors.bright}${scenario.name.padEnd(25)}${colors.reset} ${status}${colors.reset} ${colors.cyan}(${time})${colors.reset}`);
    });

    console.log('─'.repeat(80) + '\n');

    console.log(colors.bright + 'Overall Statistics:' + colors.reset);
    console.log(`  Total Scenarios:    ${results.scenarios.length}`);
    console.log(`  ${colors.green}Passed:${colors.reset}             ${passedScenarios}`);
    console.log(`  ${colors.red}Failed:${colors.reset}             ${failedScenarios}`);
    console.log(`  ${colors.cyan}Total Time:${colors.reset}         ${totalTime.toFixed(2)}s (${(totalTime / 60).toFixed(2)} minutes)`);
    console.log(`  ${colors.yellow}Success Rate:${colors.reset}       ${((passedScenarios / results.scenarios.length) * 100).toFixed(1)}%`);

    console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset + '\n');

    if (failedScenarios === 0) {
        console.log(colors.green + colors.bright + '🎉  All scenarios passed! Your smart contracts are working correctly.' + colors.reset + '\n');
    } else {
        console.log(colors.yellow + '⚠️   Some scenarios failed. Please review the logs above for details.' + colors.reset + '\n');
    }

    // Print next steps
    console.log(colors.bright + 'Next Steps:' + colors.reset);
    console.log('  1. Review detailed test output above');
    console.log('  2. Check transaction IDs on HashScan: https://hashscan.io/testnet');
    console.log('  3. Verify HCS topic messages for event logging');
    console.log('  4. Review TEST_SCENARIOS.md for scenario descriptions\n');

    // Save results to file
    saveResults();
}

/**
 * Save test results to JSON file
 */
function saveResults() {
    const resultsFile = path.join(__dirname, 'test-results.json');
    const reportData = {
        timestamp: new Date().toISOString(),
        totalScenarios: results.scenarios.length,
        passedScenarios: results.scenarios.filter(s => s.passed).length,
        failedScenarios: results.scenarios.filter(s => !s.passed).length,
        totalTime: (results.endTime - results.startTime) / 1000,
        scenarios: results.scenarios,
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            contractIds: {
                waitlist: process.env.WAITLIST_CONTRACT_ID,
                matching: process.env.MATCHING_CONTRACT_ID,
                audit: process.env.AUDIT_CONTRACT_ID
            }
        }
    };

    try {
        fs.writeFileSync(resultsFile, JSON.stringify(reportData, null, 2));
        console.log(colors.cyan + `📄 Test results saved to: ${resultsFile}` + colors.reset + '\n');
    } catch (error) {
        console.error(colors.red + `Failed to save results: ${error.message}` + colors.reset);
    }
}

/**
 * Main execution
 */
async function main() {
    printHeader();

    // Verify environment
    if (!process.env.WAITLIST_CONTRACT_ID || !process.env.MATCHING_CONTRACT_ID) {
        console.error(colors.red + '\n❌ Error: Contract IDs not found in environment variables.' + colors.reset);
        console.error(colors.yellow + 'Please ensure contracts are deployed and .env is configured.\n' + colors.reset);
        process.exit(1);
    }

    console.log(colors.green + '✅ Environment verified' + colors.reset);
    console.log(colors.cyan + `   Waitlist Contract: ${process.env.WAITLIST_CONTRACT_ID}` + colors.reset);
    console.log(colors.cyan + `   Matching Contract: ${process.env.MATCHING_CONTRACT_ID}` + colors.reset);
    console.log(colors.cyan + `   Audit Contract:    ${process.env.AUDIT_CONTRACT_ID || 'Not set'}` + colors.reset);

    console.log('\n' + colors.yellow + '⏳ Starting test execution...' + colors.reset + '\n');

    results.startTime = Date.now();

    // Run scenarios sequentially
    for (const scenario of scenarios) {
        const result = await runScenario(scenario);
        results.scenarios.push(result);

        // Optional: Add delay between scenarios
        if (scenarios.indexOf(scenario) < scenarios.length - 1) {
            console.log(colors.cyan + '⏳ Waiting 3 seconds before next scenario...' + colors.reset);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    results.endTime = Date.now();

    printSummary();

    // Exit with appropriate code
    const failedScenarios = results.scenarios.filter(s => !s.passed).length;
    process.exit(failedScenarios > 0 ? 1 : 0);
}

// Run the test suite
main().catch(error => {
    console.error(colors.red + '\n❌ Fatal error running test suite:' + colors.reset);
    console.error(error);
    process.exit(1);
});
