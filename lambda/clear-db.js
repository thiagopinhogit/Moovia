/**
 * Script to clear credit-related collections in MongoDB Atlas
 * Usage: node clear-db.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the lambda directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function clearCollections() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('   Please check your .env file in the lambda directory');
      process.exit(1);
    }
    
    console.log(`   Using URI: ${mongoUri.substring(0, 20)}...`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    
    // Clear CreditTransactions
    console.log('\n🗑️  Clearing CreditTransactions...');
    const creditTransactionsResult = await db.collection('credittransactions').deleteMany({});
    console.log(`   Deleted ${creditTransactionsResult.deletedCount} credit transactions`);
    
    // Clear UserCredits
    console.log('🗑️  Clearing UserCredits...');
    const userCreditsResult = await db.collection('usercredits').deleteMany({});
    console.log(`   Deleted ${userCreditsResult.deletedCount} user credits`);
    
    console.log('\n✅ All collections cleared successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - CreditTransactions: ${creditTransactionsResult.deletedCount} deleted`);
    console.log(`   - UserCredits: ${userCreditsResult.deletedCount} deleted`);
    
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
clearCollections();

