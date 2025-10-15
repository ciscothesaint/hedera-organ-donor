const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
}

module.exports = { connectDB, disconnectDB };
