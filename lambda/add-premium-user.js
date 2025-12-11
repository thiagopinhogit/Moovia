/**
 * Script para adicionar/atualizar usuário como Premium no MongoDB
 * Uso: node add-premium-user.js USER_ID
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Erro: forneça o userId como argumento');
  console.log('Uso: node add-premium-user.js $RCAnonymousID:3363085efadd4f52a48e90d4e74aa4f4');
  process.exit(1);
}

// Schema simplificado
const ApiUsageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  subscriptionTier: { type: String, enum: ['free', 'premium'], default: 'free' },
  subscriptionActive: { type: Boolean, default: false },
  requestCount: {
    daily: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  lastRequest: { type: Date },
  lastDailyReset: { type: Date, default: Date.now },
  lastMonthlyReset: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ApiUsage = mongoose.model('ApiUsage', ApiUsageSchema);

async function addPremiumUser() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado!');

    console.log(`\n📝 Atualizando usuário: ${userId}`);
    
    const result = await ApiUsage.findOneAndUpdate(
      { userId },
      {
        userId,
        subscriptionTier: 'premium',
        subscriptionActive: true,
        updatedAt: new Date(),
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log('\n✅ Usuário atualizado com sucesso!');
    console.log('\n📊 Dados:');
    console.log('   User ID:', result.userId);
    console.log('   Tier:', result.subscriptionTier);
    console.log('   Active:', result.subscriptionActive);
    console.log('   Requests:', result.requestCount);
    console.log('\n🎉 Agora você pode usar o app!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada.');
  }
}

addPremiumUser();

