/**
 * Script to clear credit-related collections from MongoDB Atlas
 * Run: node clear-credits.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function clearCollections() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;

    // Clear CreditTransactions
    console.log('\n🗑️  Clearing CreditTransactions...');
    const transactionsResult = await db.collection('credittransactions').deleteMany({});
    console.log(`✅ Deleted ${transactionsResult.deletedCount} documents from CreditTransactions`);

    // Clear UserCredits
    console.log('\n🗑️  Clearing UserCredits...');
    const creditsResult = await db.collection('usercredits').deleteMany({});
    console.log(`✅ Deleted ${creditsResult.deletedCount} documents from UserCredits`);

    console.log('\n✨ All credit data cleared successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - CreditTransactions: ${transactionsResult.deletedCount} deleted`);
    console.log(`   - UserCredits: ${creditsResult.deletedCount} deleted`);

  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
}

clearCollections();

