const googleSheetsService = require('../../../../lib/googleSheets');

export default async function handler(req, res) {
  const { ref } = req.query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // GET - Fetch influencer profile
      console.log(`📊 Fetching influencer profile for: ${ref}`);
      
      const influencerData = await getInfluencerProfile(ref);
      
      if (influencerData) {
        return res.status(200).json({
          success: true,
          data: influencerData
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Influencer profile not found'
        });
      }
      
    } else if (req.method === 'POST') {
      // POST - Create or update influencer profile
      console.log(`💾 Saving influencer profile for: ${ref}`);
      console.log('📋 Profile data:', req.body);
      
      const profileData = req.body;
      profileData.ref = ref; // Ensure ref matches URL parameter
      
      const result = await saveInfluencerProfile(profileData);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Influencer profile saved successfully'
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('❌ Influencer API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

async function getInfluencerProfile(ref) {
  try {
    // Initialize Google Sheets
    const sheets = googleSheetsService.sheets;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Try to read from Influencers sheet
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Influencers!A:I', // A=Ref, B=Name, C=Email, D=Phone, E=Instagram, F=TikTok, G=Commission, H=Status, I=Notes
      });
      
      const rows = response.data.values || [];
      console.log(`📊 Found ${rows.length} rows in Influencers sheet`);
      
      if (rows.length > 1) {
        // Find influencer by ref (assuming first row is headers)
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        const influencerRow = dataRows.find(row => row[0] === ref);
        
        if (influencerRow) {
          return {
            ref: influencerRow[0] || ref,
            name: influencerRow[1] || ref,
            email: influencerRow[2] || '',
            phone: influencerRow[3] || '',
            instagram: influencerRow[4] || '',
            tiktok: influencerRow[5] || '',
            commission: parseFloat(influencerRow[6]) || 10,
            status: influencerRow[7] || 'active',
            notes: influencerRow[8] || ''
          };
        }
      }
    } catch (sheetsError) {
      console.log('📋 Influencers sheet not found, will create on first save');
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching influencer profile:', error);
    throw error;
  }
}

async function saveInfluencerProfile(profileData) {
  try {
    const sheets = googleSheetsService.sheets;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Ensure Influencers sheet exists
    await ensureInfluencersSheetExists();
    
    // Get current data
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Influencers!A:I',
      });
    } catch (error) {
      // Sheet doesn't exist, create headers
      response = { data: { values: [] } };
    }
    
    const rows = response.data.values || [];
    
    // If no headers, add them
    if (rows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Influencers!A1:I1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Ref', 'Name', 'Email', 'Phone', 'Instagram', 'TikTok', 'Commission', 'Status', 'Notes']]
        }
      });
      rows.push(['Ref', 'Name', 'Email', 'Phone', 'Instagram', 'TikTok', 'Commission', 'Status', 'Notes']);
    }
    
    // Prepare row data
    const rowData = [
      profileData.ref,
      profileData.name || profileData.ref,
      profileData.email || '',
      profileData.phone || '',
      profileData.instagram || '',
      profileData.tiktok || '',
      profileData.commission || 10,
      profileData.status || 'active',
      profileData.notes || ''
    ];
    
    // Find existing row or determine new row position
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const existingRowIndex = dataRows.findIndex(row => row[0] === profileData.ref);
    
    if (existingRowIndex >= 0) {
      // Update existing row
      const rowNumber = existingRowIndex + 2; // +1 for headers, +1 for 1-based indexing
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Influencers!A${rowNumber}:I${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      console.log(`✅ Updated influencer ${profileData.ref} at row ${rowNumber}`);
    } else {
      // Add new row
      const newRowNumber = rows.length + 1;
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Influencers!A${newRowNumber}:I${newRowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      console.log(`✅ Added new influencer ${profileData.ref} at row ${newRowNumber}`);
    }
    
    return profileData;
    
  } catch (error) {
    console.error('❌ Error saving influencer profile:', error);
    throw error;
  }
}

async function ensureInfluencersSheetExists() {
  try {
    const sheets = googleSheetsService.sheets;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    
    if (!sheetNames.includes('Influencers')) {
      console.log('📋 Creating Influencers sheet...');
      
      // Add new sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Influencers'
              }
            }
          }]
        }
      });
      
      console.log('✅ Influencers sheet created');
    }
    
  } catch (error) {
    console.error('❌ Error ensuring Influencers sheet exists:', error);
    // Don't throw - we can still try to use the sheet
  }
} 