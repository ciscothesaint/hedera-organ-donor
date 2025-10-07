const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const patientRoutes = require('./routes/patientRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Import old auth routes (from api folder)
const authRoutes = require('./api/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Connect to MongoDB
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('✅ MongoDB connected successfully');
    }).catch((error) => {
        console.error('❌ MongoDB connection error:', error);
    });
} else {
    console.warn('⚠️  MongoDB URI not configured');
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Organ Waitlist Registry',
        network: process.env.HEDERA_NETWORK || 'testnet',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);          // Authentication routes
app.use('/api/patients', patientRoutes);   // Patient management
app.use('/api/matching', matchingRoutes);  // Organ matching
app.use('/api/public', publicRoutes);      // Public endpoints

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
    console.log(`\n🏥 Organ Waitlist Registry - Backend Server`);
    console.log(`⛓️  Network: ${process.env.HEDERA_NETWORK || 'testnet'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    process.exit(0);
});

module.exports = app;
