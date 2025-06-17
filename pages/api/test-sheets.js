const googleSheetsService = require('../../lib/googleSheets');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Google Sheets connection...');
    
    // Check environment variables
    const hasSpreadsheetId = !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const hasClientEmail = !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
    console.log('📋 Environment check:', {
      hasSpreadsheetId,
      hasClientEmail,
      hasPrivateKey
    });

    if (!hasSpreadsheetId || !hasClientEmail || !hasPrivateKey) {
      return res.status(200).json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasSpreadsheetId,
          hasClientEmail,
          hasPrivateKey
        },
        message: 'Please configure your .env.local file'
      });
    }

    // Test connection
    const connectionTest = await googleSheetsService.testConnection();
    
    if (!connectionTest) {
      return res.status(200).json({
        success: false,
        error: 'Connection test failed',
        message: 'Check your credentials and spreadsheet permissions'
      });
    }

    // Get sheet structure info
    console.log('📊 Getting sheet structure...');
    const sheetInfo = await googleSheetsService.getSheetInfo();

    // Get sample data
    console.log('📊 Fetching sample data...');
    const allData = await googleSheetsService.getAllData();
    const sampleData = allData.slice(0, 5); // First 5 rows

    // Test influencer stats
    console.log('🧮 Testing stats calculation...');
    const testInfluencer = 'annemieke';
    const stats = await googleSheetsService.getInfluencerStats(testInfluencer);

    // Check for other influencers in data
    const uniqueRefs = [...new Set(allData.map(row => row.ref).filter(ref => ref))];
    console.log('👥 Found influencers:', uniqueRefs);

    return res.status(200).json({
      success: true,
      message: 'Google Sheets connection successful!',
      data: {
        sheetInfo: sheetInfo,
        totalRows: allData.length,
        sampleData: sampleData,
        uniqueInfluencers: uniqueRefs,
        testStats: stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Google Sheets test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 