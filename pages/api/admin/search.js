import { sql } from '@vercel/postgres';
import { google } from 'googleapis';

// Get Google Sheets data for search enhancement
async function getGoogleSheetsSearchData() {
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1).filter(row => row.length >= 2);
    
    // Group by influencer for search data
    const influencerData = {};
    
    dataRows.forEach(row => {
      const influencer = row[1]?.toLowerCase();
      const amount = row[3] ? parseFloat(row[3]) : 75.00;
      
      if (!influencer) return;
      
      if (!influencerData[influencer]) {
        influencerData[influencer] = {
          totalSales: 0,
          totalRevenue: 0,
          lastSaleDate: null
        };
      }
      
      influencerData[influencer].totalSales += 1;
      influencerData[influencer].totalRevenue += amount;
      
      // Track most recent sale
      const saleDate = row[0] || '';
      if (saleDate && (!influencerData[influencer].lastSaleDate || saleDate > influencerData[influencer].lastSaleDate)) {
        influencerData[influencer].lastSaleDate = saleDate;
      }
    });

    return influencerData;
  } catch (error) {
    console.error('❌ Google Sheets search data error:', error);
    return {};
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    const { 
      query = '', 
      filters = '{}',
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = req.query;

    console.log('🔍 Search request:', { query, filters, sortBy, sortOrder });

    // Parse filters
    let parsedFilters = {};
    try {
      parsedFilters = JSON.parse(filters);
    } catch (e) {
      console.log('⚠️ Invalid filters JSON, using empty filters');
    }

    // Get Google Sheets data for enhanced search
    const sheetsData = await getGoogleSheetsSearchData();

    // Build base SQL query
    let sqlQuery = `
      SELECT ref, name, email, phone, commission, status, instagram, tiktok, youtube, notes, created_at
      FROM influencers
    `;
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Global search across multiple fields
    if (query && query.trim()) {
      const searchTerm = `%${query.toLowerCase()}%`;
      whereConditions.push(`(
        LOWER(ref) LIKE $${paramIndex} OR 
        LOWER(name) LIKE $${paramIndex} OR 
        LOWER(email) LIKE $${paramIndex} OR 
        LOWER(notes) LIKE $${paramIndex} OR
        LOWER(instagram) LIKE $${paramIndex} OR
        LOWER(tiktok) LIKE $${paramIndex} OR
        LOWER(youtube) LIKE $${paramIndex}
      )`);
      queryParams.push(searchTerm);
      paramIndex++;
    }

    // Apply filters
    if (parsedFilters.status && parsedFilters.status.length > 0) {
      const statusPlaceholders = parsedFilters.status.map(() => `$${paramIndex++}`).join(',');
      whereConditions.push(`status IN (${statusPlaceholders})`);
      queryParams.push(...parsedFilters.status);
    }

    if (parsedFilters.commissionMin !== undefined) {
      whereConditions.push(`commission >= $${paramIndex}`);
      queryParams.push(parseFloat(parsedFilters.commissionMin));
      paramIndex++;
    }

    if (parsedFilters.commissionMax !== undefined) {
      whereConditions.push(`commission <= $${paramIndex}`);
      queryParams.push(parseFloat(parsedFilters.commissionMax));
      paramIndex++;
    }

    if (parsedFilters.hasInstagram) {
      whereConditions.push(`instagram IS NOT NULL AND instagram != ''`);
    }

    if (parsedFilters.hasTiktok) {
      whereConditions.push(`tiktok IS NOT NULL AND tiktok != ''`);
    }

    if (parsedFilters.hasYoutube) {
      whereConditions.push(`youtube IS NOT NULL AND youtube != ''`);
    }

    if (parsedFilters.dateFrom) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(parsedFilters.dateFrom);
      paramIndex++;
    }

    if (parsedFilters.dateTo) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(parsedFilters.dateTo);
      paramIndex++;
    }

    // Add WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add sorting
    const validSortFields = ['ref', 'name', 'email', 'commission', 'status', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    sqlQuery += ` ORDER BY ${sortField} ${sortDirection}`;

    // Add pagination
    sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    console.log('🔍 Executing search query:', sqlQuery);
    console.log('🔍 Query params:', queryParams);

    // Execute search query
    const result = await sql.query(sqlQuery, queryParams);
    const influencers = result.rows;

    // Enhance results with Google Sheets data
    const enhancedInfluencers = influencers.map(influencer => {
      const influencerKey = influencer.ref.toLowerCase();
      const googleData = sheetsData[influencerKey] || {
        totalSales: 0,
        totalRevenue: 0,
        lastSaleDate: null
      };

      const commissionRate = parseFloat(influencer.commission) || 6.0;
      const totalCommission = (googleData.totalRevenue * commissionRate) / 100;

      return {
        ...influencer,
        totalSales: googleData.totalSales,
        totalRevenue: googleData.totalRevenue,
        totalCommission: totalCommission,
        lastSaleDate: googleData.lastSaleDate,
        // Performance categorization
        performanceLevel: googleData.totalSales === 0 ? 'none' : 
                         googleData.totalSales <= 2 ? 'low' : 
                         googleData.totalSales <= 5 ? 'medium' : 'high',
        // Profile completeness
        profileComplete: !!(influencer.phone && influencer.instagram && influencer.email)
      };
    });

    // Apply Google Sheets based filters
    let filteredInfluencers = enhancedInfluencers;

    if (parsedFilters.salesMin !== undefined) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.totalSales >= parsedFilters.salesMin);
    }

    if (parsedFilters.salesMax !== undefined) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.totalSales <= parsedFilters.salesMax);
    }

    if (parsedFilters.revenueMin !== undefined) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.totalRevenue >= parsedFilters.revenueMin);
    }

    if (parsedFilters.revenueMax !== undefined) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.totalRevenue <= parsedFilters.revenueMax);
    }

    if (parsedFilters.performanceLevel && parsedFilters.performanceLevel.length > 0) {
      filteredInfluencers = filteredInfluencers.filter(inf => 
        parsedFilters.performanceLevel.includes(inf.performanceLevel)
      );
    }

    if (parsedFilters.profileComplete !== undefined) {
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.profileComplete === parsedFilters.profileComplete
      );
    }

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM influencers`;
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    const countResult = await sql.query(countQuery, queryParams.slice(0, -2)); // Remove limit/offset params
    const totalCount = parseInt(countResult.rows[0].total);

    // Calculate filter statistics
    const stats = {
      totalResults: filteredInfluencers.length,
      totalRevenue: filteredInfluencers.reduce((sum, inf) => sum + inf.totalRevenue, 0),
      totalCommission: filteredInfluencers.reduce((sum, inf) => sum + inf.totalCommission, 0),
      avgCommission: filteredInfluencers.length > 0 ? 
        filteredInfluencers.reduce((sum, inf) => sum + inf.commission, 0) / filteredInfluencers.length : 0,
      performanceBreakdown: {
        none: filteredInfluencers.filter(inf => inf.performanceLevel === 'none').length,
        low: filteredInfluencers.filter(inf => inf.performanceLevel === 'low').length,
        medium: filteredInfluencers.filter(inf => inf.performanceLevel === 'medium').length,
        high: filteredInfluencers.filter(inf => inf.performanceLevel === 'high').length
      }
    };

    console.log('✅ Search completed:', {
      query: query || 'all',
      results: filteredInfluencers.length,
      totalRevenue: stats.totalRevenue.toFixed(2)
    });

    res.status(200).json({
      success: true,
      data: filteredInfluencers,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      },
      stats: stats,
      appliedFilters: parsedFilters,
      searchQuery: query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Search error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 