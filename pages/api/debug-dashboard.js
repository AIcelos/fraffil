import { sql } from '@vercel/postgres';
import googleSheetsService from '../../lib/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { influencer = 'finaltest' } = req.query;

  try {
    console.log('🔍 Debug dashboard for:', influencer);

    // Step 1: Test Google Sheets connection
    console.log('📊 Step 1: Testing Google Sheets connection...');
    const connectionTest = await googleSheetsService.testConnection();
    console.log('Connection test result:', connectionTest);

    // Step 2: Get all data from sheets
    console.log('📊 Step 2: Getting all data from sheets...');
    const allData = await googleSheetsService.getAllData();
    console.log('All data from sheets:', allData);

    // Step 3: Get influencer specific data
    console.log('📊 Step 3: Getting influencer data...');
    const influencerData = await googleSheetsService.getInfluencerData(influencer);
    console.log('Influencer data:', influencerData);

    // Step 4: Calculate stats
    console.log('📊 Step 4: Calculating stats...');
    const stats = await googleSheetsService.getInfluencerStats(influencer);
    console.log('Calculated stats:', stats);

    // Step 5: Check database
    console.log('📊 Step 5: Checking database...');
    const dbResult = await sql`
      SELECT ref, name, email, commission, status, created_at
      FROM influencers 
      WHERE ref = ${influencer.toLowerCase()}
      LIMIT 1
    `;
    console.log('Database result:', dbResult.rows[0]);

    return res.status(200).json({
      success: true,
      debug: {
        influencer: influencer,
        connectionTest: connectionTest,
        allDataCount: allData.length,
        allDataSample: allData.slice(0, 3),
        influencerDataCount: influencerData.length,
        influencerDataSample: influencerData,
        calculatedStats: stats,
        databaseRecord: dbResult.rows[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 