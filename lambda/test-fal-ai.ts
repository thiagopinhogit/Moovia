/**
 * Teste Rápido - Fal AI Integration
 * Execute: npx ts-node test-fal-ai.ts
 */

import { generateVideo, checkVideoStatus } from './src/services/falVideo';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFalAI() {
  console.log('🧪 Testando Integração Fal AI\n');
  console.log('============================================\n');

  // Check if FAL_KEY is configured
  if (!process.env.FAL_KEY) {
    console.error('❌ FAL_KEY não configurada!');
    console.log('\n📝 Para configurar:');
    console.log('1. Obtenha sua key em: https://fal.ai/dashboard/keys');
    console.log('2. Crie arquivo .env com: FAL_KEY=sua_chave_aqui');
    console.log('3. Execute novamente: npx ts-node test-fal-ai.ts\n');
    process.exit(1);
  }

  console.log('✅ FAL_KEY configurada\n');

  // Test 1: Generate Video (Text-to-Video)
  console.log('📹 Teste 1: Text-to-Video (5s)');
  console.log('─────────────────────────────────────────\n');

  const textToVideoResult = await generateVideo({
    model: 'kling-v2.5-turbo-pro',
    prompt: 'A beautiful sunset over the ocean with waves crashing on the beach',
    duration: '5',
    aspectRatio: '16:9',
    negativePrompt: 'blur, distortion, low quality',
    cfgScale: 0.5,
  });

  console.log('Result:', {
    success: textToVideoResult.success,
    taskId: textToVideoResult.taskId,
    status: textToVideoResult.status,
    error: textToVideoResult.error,
  });

  if (!textToVideoResult.success) {
    console.error('\n❌ Teste falhou:', textToVideoResult.error);
    process.exit(1);
  }

  console.log('✅ Vídeo submetido com sucesso!\n');
  console.log(`Task ID: ${textToVideoResult.taskId}\n`);

  // Test 2: Check Status
  console.log('🔍 Teste 2: Verificando Status');
  console.log('─────────────────────────────────────────\n');

  const taskId = textToVideoResult.taskId!;
  
  console.log('Aguardando processamento (isso pode levar 1-3 minutos)...\n');

  let attempts = 0;
  const maxAttempts = 36; // 3 minutos (36 * 5s)

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResult = await checkVideoStatus(taskId);

    attempts++;
    console.log(`[${attempts}/${maxAttempts}] Status: ${statusResult.status}`);

    if (statusResult.status === 'completed' && statusResult.videoUrl) {
      console.log('\n🎉 SUCESSO! Vídeo gerado!');
      console.log('─────────────────────────────────────────\n');
      console.log('Video URL:', statusResult.videoUrl);
      console.log('\n✅ Todos os testes passaram!\n');
      process.exit(0);
    }

    if (statusResult.status === 'failed') {
      console.error('\n❌ Geração falhou:', statusResult.error);
      process.exit(1);
    }
  }

  console.log('\n⚠️ Timeout - vídeo ainda processando após 3 minutos');
  console.log('Você pode verificar o status manualmente com:');
  console.log(`checkVideoStatus('${taskId}')`);
  console.log('\nOu aguardar mais tempo. Geralmente leva 1-2 minutos.\n');
}

// Run test
testFalAI().catch(error => {
  console.error('\n❌ Erro no teste:', error);
  process.exit(1);
});

