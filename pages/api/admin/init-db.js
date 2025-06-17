import { initializeDatabase } from '../../../lib/database.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting database initialization...');
    
    const result = await initializeDatabase();
    
    console.log('✅ Database initialization completed successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: [
        'influencers',
        'admin_users', 
        'system_settings'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Database initialization failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 