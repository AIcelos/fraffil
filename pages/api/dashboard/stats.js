import { sql } from '@vercel/postgres';
import { google } from 'googleapis';

// Direct Google Sheets implementation to avoid import issues
async function getGoogleSheetsData(influencer) {
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

    console.log(`📊 Fetching Google Sheets data for ${influencer}...`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    // Skip header row and filter for this influencer
    const dataRows = rows.slice(1).filter(row => 
      row.length >= 2 && row[1] && row[1].toLowerCase() === influencer.toLowerCase()
    );
    
    console.log(`📊 Found ${dataRows.length} orders for ${influencer}`);
    
    if (dataRows.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        lastSale: null,
        recentOrders: []
      };
    }

    // Calculate stats
    let totalRevenue = 0;
    const orders = [];
    
    dataRows.forEach(row => {
      const amount = row[3] ? parseFloat(row[3]) : 75.00; // Use amount from sheets or fallback
      totalRevenue += amount;
      
      orders.push({
        date: row[0] || '',
        orderId: row[2] || '',
        amount: amount
      });
    });
    
    const totalSales = dataRows.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Sort orders by date (newest first)
    const sortedOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastSale = sortedOrders[0]?.date || null;
    const recentOrders = sortedOrders.slice(0, 5);

    console.log(`📊 Calculated stats for ${influencer}:`, {
      totalSales,
      totalRevenue: totalRevenue.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      lastSale
    });

    return {
      totalSales,
      totalRevenue,
      avgOrderValue,
      lastSale,
      recentOrders
    };

  } catch (error) {
    console.error('❌ Google Sheets error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept both 'username' and 'influencer' parameters for compatibility
  const { username, influencer } = req.query;
  const targetUser = username || influencer;

  if (!targetUser) {
    return res.status(400).json({ error: 'Username or influencer parameter is required' });
  }

  try {
    console.log('📊 Dashboard stats request for:', targetUser);

    // Get influencer info from database
    const result = await sql`
      SELECT ref, name, email, commission, status, created_at
      FROM influencers 
      WHERE ref = ${targetUser.toLowerCase()}
      LIMIT 1
    `;
    
    const influencerData = result.rows[0];
    
    if (!influencerData) {
      console.log('❌ Influencer not found:', targetUser);
      return res.status(404).json({ error: 'Influencer not found' });
    }

    if (influencerData.status !== 'active') {
      console.log('❌ Inactive influencer:', targetUser);
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Get real stats from Google Sheets using direct implementation
    let googleSheetsStats = null;
    try {
      console.log('📊 Fetching Google Sheets data for:', targetUser);
      googleSheetsStats = await getGoogleSheetsData(targetUser);
      console.log('✅ Google Sheets data retrieved:', googleSheetsStats);
    } catch (error) {
      console.error('⚠️ Google Sheets error:', error);
      // Continue with fallback data
    }

    // Calculate commission based on real data
    const commissionRate = parseFloat(influencerData.commission) || 6.0;
    const totalRevenue = googleSheetsStats?.totalRevenue || 0;
    const totalCommission = (totalRevenue * commissionRate) / 100;

    // Build stats object with real data
    const stats = {
      totalSales: googleSheetsStats?.totalSales || 0,
      totalRevenue: totalRevenue,
      totalCommission: totalCommission,
      avgOrderValue: googleSheetsStats?.avgOrderValue || 0,
      recentOrders: googleSheetsStats?.recentOrders || [],
      lastSale: googleSheetsStats?.lastSale || null,
      commissionRate: commissionRate,
      accountStatus: influencerData.status,
      memberSince: influencerData.created_at,
      // TODO: Calculate monthly stats from Google Sheets data
      thisMonth: {
        sales: 0,
        revenue: 0,
        commission: 0
      },
      lastMonth: {
        sales: 0,
        revenue: 0,
        commission: 0
      }
    };

    console.log('✅ Dashboard stats calculated for:', targetUser, {
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue.toFixed(2),
      totalCommission: stats.totalCommission.toFixed(2),
      dataSource: googleSheetsStats ? 'Google Sheets (direct)' : 'fallback'
    });

    res.status(200).json({
      success: true,
      data: stats,
      influencer: {
        name: influencerData.name,
        email: influencerData.email,
        username: influencerData.ref,
        commission: influencerData.commission,
        status: influencerData.status
      },
      dataSource: googleSheetsStats ? 'Google Sheets (direct)' : 'fallback',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 