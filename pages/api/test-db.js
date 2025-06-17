import { getInfluencer, getAllInfluencers } from '../../lib/database.js';

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
    console.log('🔍 Testing database connection...');
    
    // Test 1: Get all influencers
    const allInfluencers = await getAllInfluencers();
    console.log('📋 All influencers:', allInfluencers);
    
    // Test 2: Get specific influencer
    const testUser = await getInfluencer('testuser');
    console.log('👤 testuser profile:', testUser);
    
    // Test 3: Get finaltest influencer
    const finaltest = await getInfluencer('finaltest');
    console.log('👤 finaltest profile:', finaltest);
    
    return res.status(200).json({
      success: true,
      data: {
        allInfluencers,
        testUser,
        finaltest,
        totalCount: allInfluencers.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 