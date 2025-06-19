import googleSheetsService from '../../lib/googleSheets';

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
    
    // Environment check
    const env = {
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    };
    console.log('📋 Environment check:', env);

    // Initialize connection
    await googleSheetsService.initialize();
    console.log('✅ Google Sheets API initialized');
    
    // Test connection
    const connectionTest = await googleSheetsService.testConnection();
    if (!connectionTest) {
      throw new Error('Connection test failed');
    }

    // Check for upgrade header request
    if (req.query.upgradeHeaders === 'true') {
      console.log('🔧 Upgrading Google Sheets headers...');
      
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      const sheetName = await googleSheetsService.getSheetName();
      
      // Check current headers
      const currentInfo = await googleSheetsService.getSheetInfo();
      console.log('📋 Current headers:', currentInfo.headers);
      
      if (currentInfo.headers.length === 3 && !currentInfo.headers.includes('Bedrag')) {
        // Add Bedrag header to D1
        await googleSheetsService.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!D1`,
          valueInputOption: 'RAW',
          resource: {
            values: [['Bedrag']]
          }
        });
        
        console.log('✅ Added "Bedrag" header to column D');
        
        return res.status(200).json({
          success: true,
          message: 'Headers upgraded successfully!',
          oldHeaders: currentInfo.headers,
          newHeaders: ['Datum', 'Ref', 'OrderID', 'Bedrag']
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Headers already up to date',
          headers: currentInfo.headers
        });
      }
    }

    // Get sheet structure
    console.log('📊 Getting sheet structure...');
    const sheetInfo = await googleSheetsService.getSheetInfo();
    
    // Get sample data
    console.log('📊 Fetching sample data...');
    const sampleData = await googleSheetsService.getAllData();
    
    // Get unique influencers
    const uniqueInfluencers = [...new Set(sampleData.map(row => row.ref).filter(Boolean))];
    console.log('👥 Found influencers:', uniqueInfluencers);
    
    // Test stats calculation for finaltest instead of annemieke
    console.log('🧮 Testing stats calculation for finaltest...');
    const testStats = await googleSheetsService.getInfluencerStats('finaltest');

    return res.status(200).json({
      success: true,
      message: 'Google Sheets connection successful!',
      data: {
        sheetInfo,
        totalRows: sampleData.length,
        sampleData: sampleData.slice(0, 5), // First 5 rows
        uniqueInfluencers,
        testStats
      },
      upgradeInfo: {
        message: 'To upgrade headers, call this endpoint with ?upgradeHeaders=true',
        currentHeaders: sheetInfo.headers,
        expectedHeaders: sheetInfo.expectedHeaders
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 