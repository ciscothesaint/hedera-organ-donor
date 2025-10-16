const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Target user (null for public notifications)
    userId: {
        type: String,
        default: null,
        index: true
    },

    // Target patient (for patient-specific notifications)
    patientId: {
        type: String,
        default: null,
        index: true
    },

    // Notification type
    type: {
        type: String,
        enum: [
            'URGENCY_CHANGED',
            'PATIENT_REMOVED',
            'PROPOSAL_CREATED',
            'PROPOSAL_APPROVED',
            'PROPOSAL_REJECTED',
            'PROPOSAL_EXECUTED',
            'SYSTEM_ALERT'
        ],
        required: true,
        index: true
    },

    // Notification content
    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    // Related entities
    relatedProposalId: {
        type: Number,
        default: null
    },

    relatedPatientId: {
        type: String,
        default: null
    },

    // Additional data (JSON)
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Read status
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },

    readAt: {
        type: Date,
        default: null
    },

    // Priority
    priority: {
        type: String,
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        default: 'NORMAL'
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ patientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to create urgency changed notification
notificationSchema.statics.createUrgencyChangedNotification = async function(data) {
    const {
        patientId,
        patientName,
        oldUrgency,
        newUrgency,
        proposalId,
        changedBy
    } = data;

    const notification = new this({
        type: 'URGENCY_CHANGED',
        patientId,
        title: 'Urgency Level Updated',
        message: `${patientName}'s urgency level changed from ${oldUrgency} to ${newUrgency}`,
        relatedProposalId: proposalId,
        relatedPatientId: patientId,
        priority: newUrgency >= 4 ? 'HIGH' : 'NORMAL',
        metadata: {
            oldUrgency,
            newUrgency,
            changedBy,
            patientName
        }
    });

    await notification.save();
    return notification;
};

// Static method to create patient removed notification
notificationSchema.statics.createPatientRemovedNotification = async function(data) {
    const {
        patientId,
        patientName,
        reason,
        proposalId
    } = data;

    const notification = new this({
        type: 'PATIENT_REMOVED',
        patientId,
        title: 'Patient Removed from Waitlist',
        message: `${patientName} has been removed from the waitlist. Reason: ${reason}`,
        relatedProposalId: proposalId,
        relatedPatientId: patientId,
        priority: 'HIGH',
        metadata: {
            reason,
            patientName
        }
    });

    await notification.save();
    return notification;
};

// Static method to create proposal executed notification
notificationSchema.statics.createProposalExecutedNotification = async function(data) {
    const {
        proposalId,
        proposalType,
        executedBy,
        actionSummary,
        targetUsers = [] // Array of user IDs to notify
    } = data;

    const notifications = [];

    // Create notification for each target user
    for (const userId of targetUsers) {
        const notification = new this({
            type: 'PROPOSAL_EXECUTED',
            userId,
            title: 'Proposal Executed',
            message: `Proposal #${proposalId} has been executed: ${actionSummary}`,
            relatedProposalId: proposalId,
            priority: 'NORMAL',
            metadata: {
                proposalType,
                executedBy,
                actionSummary
            }
        });

        await notification.save();
        notifications.push(notification);
    }

    return notifications;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const {
        limit = 20,
        skip = 0,
        unreadOnly = false
    } = options;

    const query = { userId };

    if (unreadOnly) {
        query.isRead = false;
    }

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ userId, isRead: false });

    return {
        notifications,
        total,
        unreadCount
    };
};

// Static method to get patient notifications
notificationSchema.statics.getPatientNotifications = async function(patientId, options = {}) {
    const {
        limit = 10,
        skip = 0
    } = options;

    const notifications = await this.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    return notifications;
};

// Static method to mark multiple as read
notificationSchema.statics.markMultipleAsRead = async function(notificationIds) {
    return this.updateMany(
        { _id: { $in: notificationIds } },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );
};

// Static method to delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await this.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
    });

    console.log(`🗑️  Deleted ${result.deletedCount} old notifications`);
    return result.deletedCount;
};

module.exports = mongoose.model('Notification', notificationSchema);
