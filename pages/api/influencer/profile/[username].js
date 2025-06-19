import { sql } from '@vercel/postgres';

// Get influencer profile from database
async function getInfluencerProfile(username) {
  try {
    const result = await sql`
      SELECT ref, name, email, phone, instagram, tiktok, youtube,
             commission, status, notes, created_at, updated_at
      FROM influencers 
      WHERE ref = ${username.toLowerCase()}
      LIMIT 1
    `;
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error fetching influencer profile:', error);
    throw error;
  }
}

// Update influencer profile in database
async function updateInfluencerProfile(username, data) {
  try {
    const result = await sql`
      UPDATE influencers 
      SET 
        name = ${data.name || ''},
        email = ${data.email || ''},
        phone = ${data.phone || ''},
        instagram = ${data.instagram || ''},
        tiktok = ${data.tiktok || ''},
        youtube = ${data.youtube || ''},
        notes = ${data.notes || ''},
        updated_at = NOW()
      WHERE ref = ${username.toLowerCase()}
      RETURNING ref, name, email, phone, instagram, tiktok, youtube, commission, status
    `;
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error updating influencer profile:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const { username } = req.query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // GET - Fetch influencer profile
      console.log(`📊 Fetching profile for: ${username}`);
      
      const profile = await getInfluencerProfile(username);
      
      if (profile) {
        // Return profile data
        const profileData = {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          socialMedia: {
            instagram: profile.instagram || '',
            tiktok: profile.tiktok || '',
            youtube: profile.youtube || ''
          },
          commission: profile.commission || 6.0,
          status: profile.status || 'active',
          notes: profile.notes || '',
          memberSince: profile.created_at,
          lastUpdated: profile.updated_at
        };
        
        return res.status(200).json({
          success: true,
          data: profileData
        });
      } else {
        // Return empty profile structure
        return res.status(200).json({
          success: true,
          data: {
            name: '',
            email: '',
            phone: '',
            socialMedia: {
              instagram: '',
              tiktok: '',
              youtube: ''
            },
            commission: 6.0,
            status: 'active',
            notes: ''
          },
          isDefault: true
        });
      }
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // POST/PUT - Save influencer profile
      console.log(`💾 Saving profile for: ${username}`);
      console.log('📋 Profile data:', req.body);
      
      const profileData = req.body;
      
      // Check if influencer exists
      const existingInfluencer = await getInfluencerProfile(username);
      
      if (!existingInfluencer) {
        return res.status(404).json({
          success: false,
          error: 'Influencer not found'
        });
      }
      
      // Prepare data for update
      const updateData = {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        instagram: profileData.socialMedia?.instagram || '',
        tiktok: profileData.socialMedia?.tiktok || '',
        youtube: profileData.socialMedia?.youtube || '',
        notes: profileData.notes || ''
      };
      
      // Update profile
      const result = await updateInfluencerProfile(username, updateData);
      
      if (result) {
        console.log(`✅ Updated profile for: ${username}`);
        return res.status(200).json({
          success: true,
          data: result,
          message: 'Profiel bijgewerkt'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to update profile'
        });
      }
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('❌ Profile API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 