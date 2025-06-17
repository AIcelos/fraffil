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
    if (req.method === 'GET') {
      // GET - Fetch influencer profile
      console.log(`📊 Fetching influencer profile for: ${ref}`);
      
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
      
    } else if (req.method === 'POST') {
      // POST - Create or update influencer profile
      console.log(`💾 Saving influencer profile for: ${ref}`);
      console.log('📋 Profile data:', req.body);
      
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
      
    } else if (req.method === 'DELETE') {
      // DELETE - Remove influencer profile
      console.log(`🗑️ Deleting influencer profile for: ${ref}`);
      
      await deleteInfluencer(ref);
      
      return res.status(200).json({
        success: true,
        message: 'Influencer deleted successfully'
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
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 