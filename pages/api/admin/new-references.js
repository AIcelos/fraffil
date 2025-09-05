import { sql } from '@vercel/postgres';
import { google } from 'googleapis';

// Get Google Sheets data for new references detection
async function getGoogleSheetsReferences() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        client_id: '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = 'Blad1!A:D';

    console.log('📊 Fetching Google Sheets references...');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1).filter(row => row.length >= 2 && row[1]); // Skip header, filter empty refs
    
    // Get unique references with their stats
    const refStats = {};
    dataRows.forEach(row => {
      const ref = row[1]?.toLowerCase().trim();
      if (!ref) return;
      
      if (!refStats[ref]) {
        refStats[ref] = {
          ref: ref,
          totalSales: 0,
          totalRevenue: 0,
          firstSale: row[0],
          lastSale: row[0],
          orders: []
        };
      }
      
      const amount = row[3] ? parseFloat(row[3]) : 0;
      refStats[ref].totalSales += 1;
      refStats[ref].totalRevenue += amount;
      refStats[ref].orders.push({
        date: row[0],
        orderId: row[2],
        amount: amount
      });
      
      // Update first/last sale dates
      const orderDate = new Date(row[0]);
      const firstDate = new Date(refStats[ref].firstSale);
      const lastDate = new Date(refStats[ref].lastSale);
      
      if (orderDate < firstDate) refStats[ref].firstSale = row[0];
      if (orderDate > lastDate) refStats[ref].lastSale = row[0];
    });

    return Object.values(refStats);

  } catch (error) {
    console.error('❌ Error fetching Google Sheets references:', error);
    return [];
  }
}

// Get registered influencers from database
async function getRegisteredInfluencers() {
  try {
    const result = await sql`
      SELECT username, ref, name, email, status, created_at
      FROM influencers 
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;
    
    return result.rows || [];
  } catch (error) {
    console.error('❌ Error fetching registered influencers:', error);
    return [];
  }
}

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
    console.log('🔍 Fetching new references data...');
    
    // Get data from both sources
    const [sheetsRefs, registeredInfluencers] = await Promise.all([
      getGoogleSheetsReferences(),
      getRegisteredInfluencers()
    ]);

    // Create lookup map for registered influencers
    const registeredRefs = new Set();
    const registeredUsernames = new Set();
    
    registeredInfluencers.forEach(inf => {
      if (inf.ref) registeredRefs.add(inf.ref.toLowerCase());
      if (inf.username) registeredUsernames.add(inf.username.toLowerCase());
    });

    // Find new references (not registered)
    const newReferences = sheetsRefs.filter(ref => 
      !registeredRefs.has(ref.ref.toLowerCase()) && 
      !registeredUsernames.has(ref.ref.toLowerCase())
    );

    // Sort by total revenue (highest first)
    newReferences.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate summary stats
    const summary = {
      totalReferencesInSheets: sheetsRefs.length,
      registeredInfluencers: registeredInfluencers.length,
      newReferences: newReferences.length,
      totalNewRevenue: newReferences.reduce((sum, ref) => sum + ref.totalRevenue, 0),
      totalNewSales: newReferences.reduce((sum, ref) => sum + ref.totalSales, 0)
    };

    console.log(`📊 Found ${newReferences.length} new references out of ${sheetsRefs.length} total`);

    return res.status(200).json({
      success: true,
      data: {
        newReferences,
        registeredInfluencers,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in new-references API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
