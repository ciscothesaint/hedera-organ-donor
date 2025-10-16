const express = require('express');
const NotificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const notificationService = new NotificationService();

/**
 * Get user notifications
 * GET /api/notifications
 * Query params:
 * - limit: number of notifications (default: 20)
 * - skip: pagination offset (default: 0)
 * - unreadOnly: boolean to get only unread (default: false)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const {
            limit = 20,
            skip = 0,
            unreadOnly = false
        } = req.query;

        const result = await notificationService.getUserNotifications(userId, {
            limit: parseInt(limit),
            skip: parseInt(skip),
            unreadOnly: unreadOnly === 'true'
        });

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get patient notifications (for public frontend)
 * GET /api/notifications/patient/:patientId
 */
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const {
            limit = 10,
            skip = 0
        } = req.query;

        const notifications = await notificationService.getPatientNotifications(patientId, {
            limit: parseInt(limit),
            skip: parseInt(skip)
        });

        res.json({
            success: true,
            notifications
        });

    } catch (error) {
        console.error('Error fetching patient notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
router.post('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await notificationService.markAsRead(id);

        res.json({
            success: true,
            notification: result.notification
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Mark multiple notifications as read
 * POST /api/notifications/read-multiple
 * Body: { notificationIds: [...] }
 */
router.post('/read-multiple', authenticate, async (req, res) => {
    try {
        const { notificationIds } = req.body;

        if (!Array.isArray(notificationIds)) {
            return res.status(400).json({
                success: false,
                error: 'notificationIds must be an array'
            });
        }

        const result = await notificationService.markMultipleAsRead(notificationIds);

        res.json({
            success: true,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get unread count
 * GET /api/notifications/unread/count
 */
router.get('/unread/count', authenticate, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const result = await notificationService.getUserNotifications(userId, {
            limit: 0,
            unreadOnly: true
        });

        res.json({
            success: true,
            unreadCount: result.unreadCount
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
