const googleSheetsService = require('../../../lib/googleSheets');
const { getInfluencer } = require('../../../lib/database');

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
      const mockRevenue = 2340.50;
      const mockCommissionRate = 5;
      const mockStats = {
        influencer: influencer,
        totalSales: 15,
        totalRevenue: mockRevenue,
        conversionRate: 3.2,
        lastSale: '2025-06-17',
        commission: {
          rate: mockCommissionRate,
          total: (mockRevenue * mockCommissionRate) / 100,
          avgPerOrder: ((mockRevenue * mockCommissionRate) / 100) / 15,
          thisMonth: 0
        },
        orderMetrics: {
          avgOrderValue: mockRevenue / 15,
          totalOrders: 15,
          totalRevenue: mockRevenue
        },
        recentOrders: [
          { date: '2025-06-17', orderId: 'ORD08055', amount: 149.95 },
          { date: '2025-06-16', orderId: 'ORD08043', amount: 89.99 },
          { date: '2025-06-15', orderId: 'ORD08031', amount: 199.99 }
        ],
        monthlyStats: {
          'January': { sales: 3, revenue: 450.00 },
          'February': { sales: 5, revenue: 780.50 },
          'March': { sales: 7, revenue: 1110.00 }
        },
        profile: null
      };

      return res.status(200).json({
        success: true,
        data: mockStats,
        source: 'mock_data',
        generated: new Date().toISOString()
      });
    }

    console.log('📊 Fetching real data from Google Sheets for:', influencer);
    
    // Get influencer profile from database (for commission rate)
    let influencerProfile = null;
    try {
      console.log('🔍 Attempting to fetch influencer profile for:', influencer);
      influencerProfile = await getInfluencer(influencer);
      console.log('📋 Raw database result:', JSON.stringify(influencerProfile, null, 2));
      if (influencerProfile) {
        console.log('✅ Found profile - ref:', influencerProfile.ref, 'commission:', influencerProfile.commission);
      } else {
        console.log('❌ No profile found in database for:', influencer);
      }
    } catch (dbError) {
      console.log('⚠️  Database error for influencer:', influencer, 'Error:', dbError.message);
      console.log('📋 Full error:', dbError);
    }

    // Get real data from Google Sheets
    const stats = await googleSheetsService.getInfluencerStats(influencer);
    
    if (!stats) {
      throw new Error('Failed to fetch Google Sheets data');
    }

    // Calculate commission information
    const commissionRate = influencerProfile?.commission || 5; // Default 5%
    const totalRevenue = parseFloat(stats.totalRevenue) || 0;
    const totalCommission = (totalRevenue * commissionRate) / 100;
    const avgOrderValue = stats.totalSales > 0 ? totalRevenue / stats.totalSales : 0;
    const avgCommissionPerOrder = stats.totalSales > 0 ? totalCommission / stats.totalSales : 0;

    // Add commission data to stats
    const enrichedStats = {
      ...stats,
      commission: {
        rate: commissionRate,
        total: totalCommission,
        avgPerOrder: avgCommissionPerOrder,
        thisMonth: 0 // TODO: Calculate current month commission
      },
      orderMetrics: {
        avgOrderValue: avgOrderValue,
        totalOrders: stats.totalSales,
        totalRevenue: totalRevenue
      },
      profile: influencerProfile ? {
        name: influencerProfile.name,
        email: influencerProfile.email,
        phone: influencerProfile.phone
      } : null
    };

    console.log('✅ Successfully retrieved enriched stats for:', influencer);
    
    return res.status(200).json({
      success: true,
      data: enrichedStats,
      source: 'google_sheets_with_db',
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
      commission: {
        rate: 5,
        total: 0,
        avgPerOrder: 0,
        thisMonth: 0
      },
      orderMetrics: {
        avgOrderValue: 0,
        totalOrders: 0,
        totalRevenue: 0
      },
      recentOrders: [],
      monthlyStats: {},
      profile: null,
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