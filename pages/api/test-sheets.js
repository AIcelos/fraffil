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
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID, // Show the actual ID
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

    // Check for new references if requested
    let newReferences = null;
    console.log('🔍 Checking for new references, query param:', req.query.newReferences);
    
    if (req.query.newReferences === 'true') {
      try {
        console.log('📊 Getting registered influencers from database...');
        // Get registered influencers from database
        const { sql } = await import('@vercel/postgres');
        const result = await sql`
          SELECT username, ref, name, email, status, created_at
          FROM influencers 
          WHERE status = 'active'
          ORDER BY created_at DESC
        `;
        
        const registeredInfluencers = result.rows || [];
        console.log('👥 Found registered influencers:', registeredInfluencers.length);
        
        const registeredRefs = new Set();
        const registeredUsernames = new Set();
        
        registeredInfluencers.forEach(inf => {
          if (inf.ref) registeredRefs.add(inf.ref.toLowerCase());
          if (inf.username) registeredUsernames.add(inf.username.toLowerCase());
        });

        // Find new references (not registered)
        const allRefs = [...new Set(sampleData.map(row => row.ref).filter(Boolean))];
        console.log('📋 All refs from sheets:', allRefs);
        
        const newRefs = allRefs.filter(ref => 
          !registeredRefs.has(ref.toLowerCase()) && 
          !registeredUsernames.has(ref.toLowerCase())
        );
        console.log('🆕 New refs found:', newRefs);

        // Get stats for new references
        newReferences = newRefs.map(ref => {
          const refData = sampleData.filter(row => row.ref === ref);
          const totalRevenue = refData.reduce((sum, row) => sum + (row.amount || 0), 0);
          return {
            ref: ref,
            totalSales: refData.length,
            totalRevenue: totalRevenue,
            firstSale: refData[0]?.date,
            lastSale: refData[refData.length - 1]?.date
          };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        console.log('📊 New references processed:', newReferences);

      } catch (error) {
        console.error('❌ Error getting new references:', error);
        newReferences = { error: error.message };
      }
    } else {
      console.log('ℹ️ New references not requested');
    }

    return res.status(200).json({
      success: true,
      message: 'Google Sheets connection successful!',
      data: {
        sheetInfo,
        totalRows: sampleData.length,
        sampleData: sampleData.slice(0, 5), // First 5 rows
        uniqueInfluencers,
        testStats,
        newReferences: newReferences
      },
      environment: {
        hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        googleSheetsUrl: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 
          `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}/edit` : 
          'Not configured'
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