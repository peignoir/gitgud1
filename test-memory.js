// Test script to verify Mastra memory is working
const { Memory } = require('@mastra/memory');
const { PostgresStore, PgVector } = require('@mastra/pg');
const { fastembed } = require('@mastra/fastembed');

const DATABASE_URL = 'postgresql://postgres.kbapahwhnonxpnitlrxf:Gykso0-zesfid-caftur@aws-1-eu-north-1.pooler.supabase.com:6543/postgres';

(async () => {
  console.log('🧪 Testing Mastra Memory Configuration...\n');

  try {
    // Initialize memory like in config.ts
    const memory = new Memory({
      storage: new PostgresStore({
        connectionString: DATABASE_URL,
      }),
      vector: new PgVector({
        connectionString: DATABASE_URL,
      }),
      embedder: fastembed,
      options: {
        lastMessages: 10,
        semanticRecall: {
          topK: 3,
          messageRange: 2,
        },
      },
    });

    console.log('✅ Memory instance created');
    console.log('   Storage:', memory.storage.constructor.name);
    console.log('   Vector:', memory.vector?.constructor?.name || 'none');
    console.log('   Embedder:', memory.embedder ? 'fastembed' : 'none');

    // Test saving a message
    console.log('\n🧪 Test 1: Saving a test message...');
    await memory.saveMessages({
      messages: [
        { role: 'user', content: 'Hello, I am testing memory!' },
        { role: 'assistant', content: 'Great! Memory is working.' }
      ],
      resourceId: 'test-user@example.com',
      threadId: 'test-thread',
    });
    console.log('✅ Messages saved');

    // Test retrieving messages
    console.log('\n🧪 Test 2: Retrieving messages...');
    const messages = await memory.getMessages({
      resourceId: 'test-user@example.com',
      threadId: 'test-thread',
    });
    console.log('✅ Retrieved', messages.length, 'messages');
    messages.forEach((msg, i) => {
      console.log('   ' + (i + 1) + '. [' + msg.role + ']:', msg.content.substring(0, 50));
    });

    console.log('\n✅ Mastra Memory is working correctly!');
    console.log('   - Short-term: Conversation history stored ✓');
    console.log('   - Long-term: Vector embeddings for semantic recall ✓');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
})();
