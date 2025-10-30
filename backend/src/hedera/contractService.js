const {
    ContractCreateFlow,
    ContractExecuteTransaction,
    ContractCallQuery,
    ContractFunctionParameters,
    ContractId,
    Hbar,
} = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');

/**
 * Deploy a smart contract to Hedera
 */
async function deployContract(client, contractName, constructorParams = null) {
    try {
        // Read compiled contract bytecode
        const bytecode = fs.readFileSync(
            path.join(__dirname, `../../contracts/${contractName}.bin`)
        );

        let contractCreateFlow = new ContractCreateFlow()
            .setGas(4000000) // Maximum gas limit for complex contracts
            .setMaxChunks(30) // Allow large bytecode to be split across multiple transactions
            .setBytecode(bytecode);

        if (constructorParams) {
            contractCreateFlow.setConstructorParameters(constructorParams);
        }

        const txResponse = await contractCreateFlow.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const contractId = receipt.contractId;

        console.log(`✅ ${contractName} deployed with Contract ID: ${contractId}`);

        return contractId;
    } catch (error) {
        console.error(`❌ Error deploying ${contractName}:`, error);
        throw error;
    }
}

/**
 * Execute a contract function
 */
async function executeContractFunction(
    client,
    contractId,
    functionName,
    params = new ContractFunctionParameters(),
    gas = 100000
) {
    try {
        const transaction = new ContractExecuteTransaction()
            .setContractId(ContractId.fromString(contractId))
            .setGas(gas)
            .setFunction(functionName, params);

        const txResponse = await transaction.execute(client);
        const receipt = await txResponse.getReceipt(client);

        return {
            success: receipt.status.toString() === 'SUCCESS',
            receipt,
            transactionId: txResponse.transactionId.toString(),
        };
    } catch (error) {
        console.error(`Error executing ${functionName}:`, error);
        throw error;
    }
}

/**
 * Query a contract function (read-only)
 */
async function queryContractFunction(
    client,
    contractId,
    functionName,
    params = new ContractFunctionParameters(),
    gas = 100000
) {
    try {
        const query = new ContractCallQuery()
            .setContractId(ContractId.fromString(contractId))
            .setGas(gas)
            .setFunction(functionName, params);

        const result = await query.execute(client);

        return result;
    } catch (error) {
        console.error(`Error querying ${functionName}:`, error);
        throw error;
    }
}

/**
 * Register a patient on the waitlist contract
 */
async function registerPatient(client, contractId, patientData) {
    const params = new ContractFunctionParameters()
        .addString(patientData.patientId)
        .addString(patientData.firstName)
        .addString(patientData.lastName)
        .addString(patientData.organType)
        .addUint8(patientData.urgencyLevel)
        .addUint256(patientData.medicalScore)
        .addString(patientData.bloodType)
        .addUint256(patientData.weight)
        .addUint256(patientData.height);

    return await executeContractFunction(
        client,
        contractId,
        'registerPatient',
        params,
        1500000  // Increased to 1.5M gas for complex contract operations
    );
}

/**
 * Get patient details from contract
 */
async function getPatient(client, contractId, patientId) {
    const params = new ContractFunctionParameters()
        .addString(patientId);

    const result = await queryContractFunction(
        client,
        contractId,
        'getPatient',
        params
    );

    return result;
}

/**
 * Get waitlist for organ type
 */
async function getWaitlist(client, contractId, organType) {
    const params = new ContractFunctionParameters()
        .addString(organType);

    const result = await queryContractFunction(
        client,
        contractId,
        'getWaitlist',
        params
    );

    return result;
}

/**
 * Update patient urgency
 */
async function updateUrgency(client, contractId, patientId, newUrgency) {
    const params = new ContractFunctionParameters()
        .addString(patientId)
        .addUint8(newUrgency);

    return await executeContractFunction(
        client,
        contractId,
        'updateUrgency',
        params,
        1000000  // Increased to 1M gas for urgency updates
    );
}

/**
 * Register an organ
 */
async function registerOrgan(client, contractId, organData) {
    const params = new ContractFunctionParameters()
        .addString(organData.organId)
        .addString(organData.organType)
        .addString(organData.bloodType)
        .addUint256(organData.weight)
        .addUint256(organData.viabilityHours);

    return await executeContractFunction(
        client,
        contractId,
        'registerOrgan',
        params,
        1500000  // Increased to 1.5M gas for complex contract operations
    );
}


/**
 * Allocate organ to patient
 */
async function allocateOrgan(client, contractId, organId, patientId) {
    const params = new ContractFunctionParameters()
        .addString(organId)
        .addString(patientId);

    return await executeContractFunction(
        client,
        contractId,
        'allocateOrgan',
        params,
        2000000  // Increased to 2M gas for allocation operations
    );
}
async function acceptAllocation(client, contractId, allocationId) {
    const params = new ContractFunctionParameters()
        .addString(allocationId);

    return await executeContractFunction(
        client,
        contractId,
        'acceptAllocation',
        params,
        1000000  // Adjust gas as needed
    );
}
async function rejectAllocation(client, contractId, allocationId,reason) {
    const params = new ContractFunctionParameters()
        .addString(allocationId)
        .addString(reason)

    return await executeContractFunction(
        client,
        contractId,
        'rejectAllocation',
        params,
        2000000  // Adjust gas as needed
    );
}
async function completeTransplant(client, contractId, allocationData) {
    const params = new ContractFunctionParameters()
        .addString(allocationData.allocationId);

    return await executeContractFunction(
        client,
        contractId,
        'completeTransplant',
        params,
        1000000
    );
}


module.exports = {
    deployContract,
    executeContractFunction,
    queryContractFunction,
    registerPatient,
    getPatient,
    getWaitlist,
    updateUrgency,
    registerOrgan,
    allocateOrgan,
    acceptAllocation,
    rejectAllocation,
    completeTransplant,
};
