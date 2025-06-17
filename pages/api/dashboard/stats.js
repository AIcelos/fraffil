const googleSheetsService = require('../../../lib/googleSheets');

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

  const { influencer } = req.query;

  if (!influencer) {
    return res.status(400).json({ error: 'Missing influencer parameter' });
  }

  try {
    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 
        !process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      console.log('⚠️  Google Sheets not configured, using mock data');
      
      // Return mock data as fallback
      const mockStats = {
        influencer: influencer,
        totalSales: 15,
        totalRevenue: 2340.50,
        conversionRate: 3.2,
        lastSale: '2025-06-17',
        recentOrders: [
          { date: '2025-06-17', orderId: 'ORD08055', amount: 149.95 },
          { date: '2025-06-16', orderId: 'ORD08043', amount: 89.99 },
          { date: '2025-06-15', orderId: 'ORD08031', amount: 199.99 }
        ],
        monthlyStats: {
          'January': { sales: 3, revenue: 450.00 },
          'February': { sales: 5, revenue: 780.50 },
          'March': { sales: 7, revenue: 1110.00 }
        }
      };

      return res.status(200).json({
        success: true,
        data: mockStats,
        source: 'mock_data',
        generated: new Date().toISOString()
      });
    }

    console.log('📊 Fetching real data from Google Sheets for:', influencer);
    
    // Get real data from Google Sheets
    const stats = await googleSheetsService.getInfluencerStats(influencer);
    
    if (!stats) {
      throw new Error('Failed to fetch Google Sheets data');
    }

    console.log('✅ Successfully retrieved stats for:', influencer);
    
    return res.status(200).json({
      success: true,
      data: stats,
      source: 'google_sheets',
      generated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    
    // Return mock data as fallback on error
    const mockStats = {
      influencer: influencer,
      totalSales: 0,
      totalRevenue: 0.00,
      conversionRate: 0.0,
      lastSale: null,
      recentOrders: [],
      monthlyStats: {},
      error: 'Could not connect to Google Sheets'
    };

    return res.status(200).json({
      success: true,
      data: mockStats,
      source: 'fallback_mock',
      error: error.message,
      generated: new Date().toISOString()
    });
  }
} 