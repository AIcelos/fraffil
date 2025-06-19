import { sql } from '@vercel/postgres';
import { google } from 'googleapis';

// Direct Google Sheets implementation for admin stats
async function getAllGoogleSheetsData() {
  try {
    // Create auth client
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

    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = 'Blad1!A:D'; // Use known sheet name

    console.log('📊 Admin: Fetching all Google Sheets data...');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    // Skip header row and process all data
    const dataRows = rows.slice(1).filter(row => row.length >= 2);
    
    console.log(`📊 Admin: Found ${dataRows.length} total orders in Google Sheets`);
    
    // Group data by influencer
    const influencerData = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    
    dataRows.forEach(row => {
      const influencer = row[1]?.toLowerCase();
      const amount = row[3] ? parseFloat(row[3]) : 75.00;
      
      if (!influencer) return;
      
      if (!influencerData[influencer]) {
        influencerData[influencer] = {
          totalSales: 0,
          totalRevenue: 0,
          orders: []
        };
      }
      
      influencerData[influencer].totalSales += 1;
      influencerData[influencer].totalRevenue += amount;
      influencerData[influencer].orders.push({
        date: row[0] || '',
        orderId: row[2] || '',
        amount: amount
      });
      
      totalRevenue += amount;
      totalOrders += 1;
    });

    return {
      totalRevenue,
      totalOrders,
      influencerData
    };

  } catch (error) {
    console.error('❌ Admin Google Sheets error:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      influencerData: {}
    };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  try {
    console.log('📊 Admin stats request...');

    // Get all influencers from database
    const dbResult = await sql`
      SELECT ref, name, email, commission, status, created_at, phone, instagram, tiktok, youtube, notes
      FROM influencers 
      ORDER BY created_at DESC
    `;
    
    const dbInfluencers = dbResult.rows;
    console.log(`📊 Found ${dbInfluencers.length} influencers in database`);

    // Get Google Sheets data for all influencers
    const sheetsData = await getAllGoogleSheetsData();
    console.log('📊 Google Sheets data retrieved:', {
      totalRevenue: sheetsData.totalRevenue.toFixed(2),
      totalOrders: sheetsData.totalOrders,
      influencersWithData: Object.keys(sheetsData.influencerData).length
    });

    // Calculate total commission
    let totalCommission = 0;
    
    // Merge database and sheets data
    const influencers = dbInfluencers.map(user => {
      const influencerKey = user.ref.toLowerCase();
      const googleData = sheetsData.influencerData[influencerKey] || {
        totalSales: 0,
        totalRevenue: 0,
        orders: []
      };
      
      const commissionRate = parseFloat(user.commission) || 6.0;
      const commission = (googleData.totalRevenue * commissionRate) / 100;
      totalCommission += commission;
      
      // Get last sale date
      const lastSale = googleData.orders.length > 0 
        ? googleData.orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
        : null;
      
      return {
        name: user.ref,
        email: user.email || '',
        phone: user.phone || '',
        commission: commissionRate,
        totalSales: googleData.totalSales,
        totalRevenue: googleData.totalRevenue,
        totalCommission: commission,
        lastSale: lastSale,
        recentOrders: googleData.orders.slice(0, 5),
        status: user.status || 'active',
        instagram: user.instagram || '',
        tiktok: user.tiktok || '',
        youtube: user.youtube || '',
        notes: user.notes || '',
        profileComplete: true,
        created_at: user.created_at
      };
    });

    const systemStats = {
      totalRevenue: sheetsData.totalRevenue,
      totalOrders: sheetsData.totalOrders,
      totalCommission: totalCommission,
      activeInfluencers: dbInfluencers.filter(user => user.status === 'active').length,
      totalInfluencers: dbInfluencers.length,
      influencers: influencers
    };

    console.log('✅ Admin stats calculated:', {
      totalRevenue: systemStats.totalRevenue.toFixed(2),
      totalOrders: systemStats.totalOrders,
      totalCommission: systemStats.totalCommission.toFixed(2),
      activeInfluencers: systemStats.activeInfluencers,
      totalInfluencers: systemStats.totalInfluencers
    });

    res.status(200).json({
      success: true,
      data: systemStats,
      dataSource: 'Google Sheets + PostgreSQL',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 