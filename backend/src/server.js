const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db/connection');
const authRoutes = require('./api/authRoutes');
const patientRoutes = require('./api/patientRoutes');
const organRoutes = require('./api/organRoutes');
const mirrorRoutes = require('./routes/mirrorRoutes');

// DAO Routes
const daoAuthRoutes = require('./api/daoAuthRoutes');
const daoProposalRoutes = require('./api/daoProposalRoutes');
const daoRoleRoutes = require('./api/daoRoleRoutes');

// Admin DAO Management Routes
const adminDaoRoutes = require('./api/adminDaoRoutes');
const systemSettingsRoutes = require('./api/systemSettingsRoutes');
const notificationRoutes = require('./api/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Organ Waitlist Registry API',
    });
});

// Admin Platform API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/organs', organRoutes);
app.use('/api/mirror', mirrorRoutes); // FREE queries - no gas fees!
app.use('/api/admin', adminDaoRoutes); // Admin DAO user management
app.use('/api/settings', systemSettingsRoutes); // System settings (admin only)
app.use('/api/notifications', notificationRoutes); // Notifications for users

// DAO Platform API Routes (Separate authentication)
app.use('/api/dao/auth', daoAuthRoutes);
app.use('/api/dao/proposals', daoProposalRoutes);
app.use('/api/dao/roles', daoRoleRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDB();

        // Start listening
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
            console.log(`💰 Mirror Node (FREE queries): http://localhost:${PORT}/api/mirror`);
            console.log(`\n🏥 Organ Waitlist Registry - Backend Server`);
            console.log(`⛓️  Network: ${process.env.HEDERA_NETWORK || 'testnet'}`);
            console.log(`🔗 Mirror Node: Enabled (99% gas fee reduction!)\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
