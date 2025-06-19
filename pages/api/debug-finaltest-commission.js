import { sql } from '@vercel/postgres';
import { GoogleSheetsService } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
  try {
    console.log('🔍 Debugging finaltest commission discrepancy...');

    // 1. Check database commission for finaltest
    console.log('📊 Checking database...');
    const dbResult = await sql`
      SELECT ref, name, email, commission, status, created_at, updated_at
      FROM influencers 
      WHERE ref = 'finaltest'
      LIMIT 1
    `;

    const dbUser = dbResult.rows[0];
    console.log('💾 Database result:', dbUser);

    // 2. Check Google Sheets for finaltest data
    console.log('📊 Checking Google Sheets...');
    const googleSheetsService = new GoogleSheetsService();
    
    // Get all data from sheets
    const allSheetsData = await googleSheetsService.getAllData();
    console.log('📋 Total Google Sheets rows:', allSheetsData.length);

    // Filter for finaltest
    const finaltestOrders = allSheetsData.filter(row => 
      row.ref && row.ref.toLowerCase() === 'finaltest'
    );
    console.log('🎯 finaltest orders in Google Sheets:', finaltestOrders);

    // Get stats calculation
    const finaltestStats = await googleSheetsService.getInfluencerStats('finaltest');
    console.log('📊 finaltest stats from Google Sheets:', finaltestStats);

    // 3. Check if there's a commission configuration in Google Sheets
    console.log('🔧 Checking for commission configuration...');
    
    // Try to get sheet info to see structure
    const sheetInfo = await googleSheetsService.getSheetInfo();
    console.log('📋 Sheet structure:', sheetInfo);

    // 4. Check if there's a separate configuration sheet
    try {
      const configData = await googleSheetsService.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        range: 'Config!A:C', // Try to get config sheet
      });
      console.log('⚙️ Config sheet data:', configData.data.values);
    } catch (configError) {
      console.log('⚠️ No Config sheet found:', configError.message);
    }

    // 5. Check initialization script data
    console.log('🚀 Checking initialization script data...');
    
    // Check what the init script would have set
    const initScriptCommission = 12.5; // From scripts/init-database.js
    console.log('🔧 Init script would set commission to:', initScriptCommission);

    // 6. Summary
    const analysis = {
      database: {
        found: !!dbUser,
        commission: dbUser?.commission || 'NOT FOUND',
        lastUpdated: dbUser?.updated_at || 'NEVER',
        status: dbUser?.status || 'UNKNOWN'
      },
      googleSheets: {
        ordersFound: finaltestOrders.length,
        sampleOrders: finaltestOrders.slice(0, 3),
        calculatedStats: finaltestStats
      },
      initScript: {
        expectedCommission: initScriptCommission,
        matches: dbUser?.commission === initScriptCommission
      },
      discrepancy: {
        exists: dbUser && dbUser.commission !== initScriptCommission,
        dbValue: dbUser?.commission,
        expectedValue: initScriptCommission,
        difference: dbUser ? (initScriptCommission - dbUser.commission) : 'N/A'
      }
    };

    console.log('🎯 Final analysis:', analysis);

    return res.status(200).json({
      success: true,
      message: 'finaltest commission analysis complete',
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 