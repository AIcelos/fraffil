import { getInfluencer, updateInfluencer, createInfluencer } from '../../../../lib/database.js';

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
      
      const profile = await getInfluencer(username);
      
      if (profile) {
        // Return profile data with additional fields
        const profileData = {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bankAccount: profile.bank_account || '',
          bankName: profile.bank_name || '',
          accountHolder: profile.account_holder || '',
          socialMedia: {
            instagram: profile.instagram || '',
            tiktok: profile.tiktok || '',
            youtube: profile.youtube || '',
            website: profile.website || ''
          },
          preferredPayment: profile.preferred_payment || 'bank',
          notes: profile.notes || ''
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
            bankAccount: '',
            bankName: '',
            accountHolder: '',
            socialMedia: {
              instagram: '',
              tiktok: '',
              youtube: '',
              website: ''
            },
            preferredPayment: 'bank',
            notes: ''
          },
          isDefault: true
        });
      }
      
    } else if (req.method === 'POST') {
      // POST - Save influencer profile
      console.log(`💾 Saving profile for: ${username}`);
      console.log('📋 Profile data:', req.body);
      
      const profileData = req.body;
      
      // Prepare data for database
      const dbData = {
        ref: username,
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        bank_account: profileData.bankAccount || '',
        bank_name: profileData.bankName || '',
        account_holder: profileData.accountHolder || '',
        instagram: profileData.socialMedia?.instagram || '',
        tiktok: profileData.socialMedia?.tiktok || '',
        youtube: profileData.socialMedia?.youtube || '',
        website: profileData.socialMedia?.website || '',
        preferred_payment: profileData.preferredPayment || 'bank',
        notes: profileData.notes || '',
        status: 'active'
      };
      
      // Check if influencer exists
      const existingInfluencer = await getInfluencer(username);
      
      let result;
      if (existingInfluencer) {
        // Update existing influencer
        result = await updateInfluencer(username, dbData);
        console.log(`✅ Updated profile for: ${username}`);
      } else {
        // Create new influencer with default commission
        dbData.commission = 5.00; // Default commission rate
        result = await createInfluencer(dbData);
        console.log(`✅ Created new profile for: ${username}`);
      }
      
      return res.status(200).json({
        success: true,
        data: result,
        message: existingInfluencer ? 'Profiel bijgewerkt' : 'Profiel aangemaakt'
      });
      
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