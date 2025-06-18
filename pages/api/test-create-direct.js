import { createInfluencer } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Direct test of createInfluencer function');
    
    const testUser = {
      ref: 'directtest',
      name: 'Direct Test User',
      email: 'directtest@test.com',
      password: 'welkom123',
      status: 'active'
    };

    console.log('📝 Creating user with data:', testUser);
    
    const result = await createInfluencer(testUser);
    
    console.log('✅ Result:', result);
    
    return res.status(200).json({
      success: true,
      testData: testUser,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Direct test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 