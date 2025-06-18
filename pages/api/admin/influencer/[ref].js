import { 
  getInfluencer, 
  createInfluencer, 
  updateInfluencer, 
  deleteInfluencer 
} from '../../../../lib/database.js';

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
    // Check if database is configured
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - POSTGRES_URL missing');
      
      // Return fallback response for GET requests
      if (req.method === 'GET') {
        const defaultProfile = {
          ref: ref,
          name: ref,
          email: '',
          phone: '',
          instagram: '',
          tiktok: '',
          youtube: '',
          commission: 10.00,
          status: 'active',
          notes: ''
        };
        
        return res.status(200).json({
          success: true,
          data: defaultProfile,
          isDefault: true,
          message: 'Database not configured, using defaults'
        });
      }
      
      // For POST/PUT/DELETE, return error since we can't save
      return res.status(503).json({
        success: false,
        error: 'Database not configured - cannot save changes',
        message: 'Please configure POSTGRES_URL environment variable'
      });
    }

    if (req.method === 'GET') {
      // GET - Fetch influencer profile
      console.log(`📊 Fetching influencer profile for: ${ref}`);
      
      try {
        const influencerData = await getInfluencer(ref);
        
        if (influencerData) {
          return res.status(200).json({
            success: true,
            data: influencerData
          });
        } else {
          // Return default profile if not found
          const defaultProfile = {
            ref: ref,
            name: ref,
            email: '',
            phone: '',
            instagram: '',
            tiktok: '',
            youtube: '',
            commission: 10.00,
            status: 'active',
            notes: ''
          };
          
          return res.status(200).json({
            success: true,
            data: defaultProfile,
            isDefault: true
          });
        }
      } catch (dbError) {
        console.log('⚠️  Database error during GET:', dbError.message);
        
        // Return default profile on database error
        const defaultProfile = {
          ref: ref,
          name: ref,
          email: '',
          phone: '',
          instagram: '',
          tiktok: '',
          youtube: '',
          commission: 10.00,
          status: 'active',
          notes: ''
        };
        
        return res.status(200).json({
          success: true,
          data: defaultProfile,
          isDefault: true,
          message: 'Database error, using defaults'
        });
      }
      
    } else if (req.method === 'POST') {
      // POST - Create or update influencer profile
      console.log(`💾 Saving influencer profile for: ${ref}`);
      console.log('📋 Profile data:', req.body);
      
      try {
        const profileData = { ...req.body, ref };
        
        // Check if influencer exists
        const existingInfluencer = await getInfluencer(ref);
        
        let result;
        if (existingInfluencer) {
          // Update existing influencer
          result = await updateInfluencer(ref, profileData);
          console.log(`✅ Updated influencer: ${ref}`);
        } else {
          // Create new influencer
          result = await createInfluencer(profileData);
          console.log(`✅ Created new influencer: ${ref}`);
        }
        
        return res.status(200).json({
          success: true,
          data: result,
          message: existingInfluencer ? 'Influencer updated successfully' : 'Influencer created successfully'
        });
      } catch (dbError) {
        console.log('⚠️  Database error during POST:', dbError.message);
        
        return res.status(503).json({
          success: false,
          error: 'Database error - cannot save changes',
          message: dbError.message,
          details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
        });
      }
      
    } else if (req.method === 'DELETE') {
      // DELETE - Remove influencer profile
      console.log(`🗑️ Deleting influencer profile for: ${ref}`);
      
      try {
        await deleteInfluencer(ref);
        
        return res.status(200).json({
          success: true,
          message: 'Influencer deleted successfully'
        });
      } catch (dbError) {
        console.log('⚠️  Database error during DELETE:', dbError.message);
        
        return res.status(503).json({
          success: false,
          error: 'Database error - cannot delete',
          message: dbError.message
        });
      }
      
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
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 