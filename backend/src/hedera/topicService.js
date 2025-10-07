const {
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicMessageQuery,
    TopicId,
} = require('@hashgraph/sdk');

/**
 * Create a new HCS topic
 */
async function createTopic(client, memo) {
    try {
        const transaction = new TopicCreateTransaction()
            .setTopicMemo(memo)
            .setAdminKey(client.operatorPublicKey)
            .setSubmitKey(client.operatorPublicKey);

        const txResponse = await transaction.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const topicId = receipt.topicId;

        console.log(`✅ Topic created: ${topicId} - ${memo}`);

        return topicId;
    } catch (error) {
        console.error('Error creating topic:', error);
        throw error;
    }
}

/**
 * Submit a message to an HCS topic
 */
async function submitMessage(client, topicId, message) {
    try {
        const transaction = new TopicMessageSubmitTransaction()
            .setTopicId(TopicId.fromString(topicId))
            .setMessage(JSON.stringify(message));

        const txResponse = await transaction.execute(client);
        const receipt = await txResponse.getReceipt(client);

        return {
            success: receipt.status.toString() === 'SUCCESS',
            transactionId: txResponse.transactionId.toString(),
        };
    } catch (error) {
        console.error('Error submitting message:', error);
        throw error;
    }
}

/**
 * Subscribe to topic messages
 */
function subscribeToTopic(client, topicId, onMessage) {
    try {
        new TopicMessageQuery()
            .setTopicId(TopicId.fromString(topicId))
            .subscribe(client, null, (message) => {
                const messageString = Buffer.from(message.contents).toString();
                const messageData = JSON.parse(messageString);

                onMessage({
                    consensusTimestamp: message.consensusTimestamp.toString(),
                    sequenceNumber: message.sequenceNumber.toString(),
                    data: messageData,
                });
            });

        console.log(`✅ Subscribed to topic: ${topicId}`);
    } catch (error) {
        console.error('Error subscribing to topic:', error);
        throw error;
    }
}

/**
 * Log patient registration to HCS
 */
async function logPatientRegistration(client, topicId, patientData) {
    const message = {
        type: 'PATIENT_REGISTRATION',
        timestamp: new Date().toISOString(),
        data: patientData,
    };

    return await submitMessage(client, topicId, message);
}

/**
 * Log organ match to HCS
 */
async function logOrganMatch(client, topicId, matchData) {
    const message = {
        type: 'ORGAN_MATCH',
        timestamp: new Date().toISOString(),
        data: matchData,
    };

    return await submitMessage(client, topicId, message);
}

/**
 * Log audit event to HCS
 */
async function logAuditEvent(client, topicId, eventData) {
    const message = {
        type: 'AUDIT_EVENT',
        timestamp: new Date().toISOString(),
        data: eventData,
    };

    return await submitMessage(client, topicId, message);
}

module.exports = {
    createTopic,
    submitMessage,
    subscribeToTopic,
    logPatientRegistration,
    logOrganMatch,
    logAuditEvent,
};
