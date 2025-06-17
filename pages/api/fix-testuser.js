import { createInfluencer, getInfluencer } from '../../lib/database.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Fixing testuser database entry...');
    
    // Check if testuser already exists
    const existingUser = await getInfluencer('testuser');
    
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'testuser already exists in database',
        data: existingUser
      });
    }
    
    // Create testuser with 6% commission
    const testUserData = {
      ref: 'testuser',
      name: 'Test User',
      email: '',
      phone: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      commission: 6.00,
      status: 'active',
      notes: 'Created via fix script'
    };
    
    const result = await createInfluencer(testUserData);
    console.log('✅ Created testuser:', result);
    
    return res.status(200).json({
      success: true,
      message: 'testuser created successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Fix testuser error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 