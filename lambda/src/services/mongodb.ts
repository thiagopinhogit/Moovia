/**
 * MongoDB Connection Service
 * Handles connection pooling and caching for Lambda
 */

import mongoose from 'mongoose';
import { CONFIG } from '../config/constants';

// Cache connection across Lambda invocations
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase(): Promise<typeof mongoose> {
  // Reuse existing connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  if (!CONFIG.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const connection = await mongoose.connect(CONFIG.MONGODB_URI, {
      // Otimizações para Lambda
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Disable mongoose buffering
    });

    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Close MongoDB connection (usually not needed in Lambda)
 */
export async function closeConnection(): Promise<void> {
  if (cachedConnection) {
    await mongoose.connection.close();
    cachedConnection = null;
    console.log('🔌 MongoDB connection closed');
  }
}

/**
 * Check if MongoDB is connected
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

