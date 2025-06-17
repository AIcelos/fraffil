import googleSheetsService from '../../../lib/googleSheets';

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

  try {
    console.log('Admin stats request received');

    // Get all data from Google Sheets
    const allData = await googleSheetsService.getAllData();
    
    // Get unique influencers
    const influencerNames = [...new Set(allData.map(row => row.ref))];
    
    console.log('Found influencers:', influencerNames);

    // Calculate stats for each influencer
    const influencerStats = await Promise.all(
      influencerNames.map(async (name) => {
        const stats = await googleSheetsService.getInfluencerStats(name);
        return {
          name: name,
          totalSales: stats.totalSales,
          totalRevenue: stats.totalRevenue,
          lastSale: stats.lastSale,
          recentOrders: stats.recentOrders
        };
      })
    );

    // Calculate system totals
    const systemStats = {
      totalRevenue: influencerStats.reduce((sum, inf) => sum + parseFloat(inf.totalRevenue || 0), 0),
      totalOrders: influencerStats.reduce((sum, inf) => sum + inf.totalSales, 0),
      activeInfluencers: influencerStats.filter(inf => inf.totalSales > 0).length,
      totalInfluencers: influencerStats.length,
      influencers: influencerStats.sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))
    };

    console.log('System stats calculated:', {
      totalRevenue: systemStats.totalRevenue,
      totalOrders: systemStats.totalOrders,
      activeInfluencers: systemStats.activeInfluencers
    });

    return res.status(200).json({
      success: true,
      data: systemStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    
    // Fallback data if Google Sheets fails
    const fallbackStats = {
      totalRevenue: 0,
      totalOrders: 0,
      activeInfluencers: 0,
      totalInfluencers: 0,
      influencers: []
    };

    return res.status(200).json({
      success: true,
      data: fallbackStats,
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 