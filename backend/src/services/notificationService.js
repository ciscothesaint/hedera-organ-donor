const Notification = require('../db/models/Notification');
const Patient = require('../db/models/Patient');
const User = require('../db/models/User');

/**
 * Notification Service
 * Handles creation and management of notifications
 */
class NotificationService {

    /**
     * Create notification for proposal execution
     * @param {Object} proposal - Proposal document
     * @param {Object} executionResult - Result from execution service
     */
    async notifyProposalExecution(proposal, executionResult) {
        try {
            console.log(`📬 Creating notifications for proposal #${proposal.proposalId} execution...`);

            const notifications = [];

            // Get action summary
            const actionSummary = this.getActionSummary(proposal, executionResult);

            // Notify all DAO users about execution
            const daoUsers = await User.find({
                'daoProfile.isAuthorizedVoter': true,
                isActive: true
            }).select('_id');

            const daoUserIds = daoUsers.map(u => u._id.toString());

            const daoNotifications = await Notification.createProposalExecutedNotification({
                proposalId: proposal.proposalId,
                proposalType: proposal.proposalType,
                executedBy: proposal.creatorName,
                actionSummary,
                targetUsers: daoUserIds
            });

            notifications.push(...daoNotifications);

            // Create patient-specific notifications based on proposal type
            if (proposal.proposalType === 'URGENCY_UPDATE') {
                const urgencyNotification = await this.notifyUrgencyChange(proposal, executionResult);
                notifications.push(urgencyNotification);
            } else if (proposal.proposalType === 'PATIENT_REMOVAL') {
                const removalNotification = await this.notifyPatientRemoval(proposal, executionResult);
                notifications.push(removalNotification);
            }

            console.log(`✅ Created ${notifications.length} notifications`);

            return {
                success: true,
                count: notifications.length,
                notifications
            };

        } catch (error) {
            console.error('❌ Error creating notifications:', error);
            throw new Error(`Notification creation failed: ${error.message}`);
        }
    }

    /**
     * Notify about urgency level change
     * @param {Object} proposal - Proposal document
     * @param {Object} executionResult - Execution result
     */
    async notifyUrgencyChange(proposal, executionResult) {
        try {
            const patientId = proposal.patientHash.split(' ')[0];
            const patient = await Patient.findOne({ patientId });

            if (!patient) {
                throw new Error(`Patient ${patientId} not found`);
            }

            const patientName = `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`;

            const notification = await Notification.createUrgencyChangedNotification({
                patientId,
                patientName,
                oldUrgency: proposal.currentValue,
                newUrgency: proposal.proposedValue,
                proposalId: proposal.proposalId,
                changedBy: proposal.creatorName
            });

            console.log(`📬 Created urgency change notification for patient ${patientId}`);

            return notification;

        } catch (error) {
            console.error('❌ Error creating urgency change notification:', error);
            throw error;
        }
    }

    /**
     * Notify about patient removal
     * @param {Object} proposal - Proposal document
     * @param {Object} executionResult - Execution result
     */
    async notifyPatientRemoval(proposal, executionResult) {
        try {
            const patientId = proposal.patientHash.split(' ')[0];
            const patient = await Patient.findOne({ patientId });

            if (!patient) {
                throw new Error(`Patient ${patientId} not found`);
            }

            const patientName = `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`;

            const notification = await Notification.createPatientRemovedNotification({
                patientId,
                patientName,
                reason: proposal.reasoning,
                proposalId: proposal.proposalId
            });

            console.log(`📬 Created patient removal notification for ${patientId}`);

            return notification;

        } catch (error) {
            console.error('❌ Error creating patient removal notification:', error);
            throw error;
        }
    }

    /**
     * Get human-readable action summary
     * @param {Object} proposal - Proposal document
     * @param {Object} executionResult - Execution result
     * @returns {string} Action summary
     */
    getActionSummary(proposal, executionResult) {
        switch (proposal.proposalType) {
            case 'URGENCY_UPDATE':
                return `Changed patient urgency from level ${proposal.currentValue} to ${proposal.proposedValue}`;

            case 'PATIENT_REMOVAL':
                return `Removed patient from waitlist`;

            case 'SYSTEM_PARAMETER':
                return `Updated system parameter from ${proposal.currentValue} to ${proposal.proposedValue}`;

            case 'EMERGENCY_OVERRIDE':
                return `Applied emergency override`;

            default:
                return `Executed ${proposal.proposalType} proposal`;
        }
    }

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     */
    async getUserNotifications(userId, options = {}) {
        try {
            return await Notification.getUserNotifications(userId, options);
        } catch (error) {
            console.error('❌ Error getting user notifications:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a patient
     * @param {string} patientId - Patient ID
     * @param {Object} options - Query options
     */
    async getPatientNotifications(patientId, options = {}) {
        try {
            return await Notification.getPatientNotifications(patientId, options);
        } catch (error) {
            console.error('❌ Error getting patient notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     */
    async markAsRead(notificationId) {
        try {
            const notification = await Notification.findById(notificationId);

            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.markAsRead();

            return {
                success: true,
                notification
            };

        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark multiple notifications as read
     * @param {Array<string>} notificationIds - Array of notification IDs
     */
    async markMultipleAsRead(notificationIds) {
        try {
            const result = await Notification.markMultipleAsRead(notificationIds);

            return {
                success: true,
                modifiedCount: result.modifiedCount
            };

        } catch (error) {
            console.error('❌ Error marking notifications as read:', error);
            throw error;
        }
    }

    /**
     * Delete old read notifications (cleanup)
     * @param {number} daysOld - Number of days old
     */
    async cleanupOldNotifications(daysOld = 30) {
        try {
            const deletedCount = await Notification.deleteOldNotifications(daysOld);

            console.log(`🗑️  Cleaned up ${deletedCount} old notifications`);

            return {
                success: true,
                deletedCount
            };

        } catch (error) {
            console.error('❌ Error cleaning up notifications:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;
