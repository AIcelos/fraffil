const { updateInfluencer, deleteInfluencer, getInfluencer } = require('../../../../lib/database.js');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({
      success: false,
      error: 'Gebruiker referentie is verplicht'
    });
  }

  try {
    if (req.method === 'GET') {
      // Haal specifieke gebruiker op
      console.log('👤 Admin requesting user:', ref);
      
      const user = await getInfluencer(ref);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Gebruiker niet gevonden'
        });
      }
      
      res.status(200).json({
        success: true,
        user
      });

    } else if (req.method === 'PATCH') {
      // Update gebruiker (bijv. status wijzigen)
      const updateData = req.body;
      
      console.log('✏️ Admin updating user:', ref, updateData);

      const result = await updateInfluencer(ref, updateData);
      
      if (result) {
        console.log('✅ User updated successfully:', ref);
        res.status(200).json({
          success: true,
          message: `Gebruiker ${ref} succesvol bijgewerkt`,
          user: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Gebruiker niet gevonden'
        });
      }

    } else if (req.method === 'DELETE') {
      // Verwijder gebruiker
      console.log('🗑️ Admin deleting user:', ref);

      const result = await deleteInfluencer(ref);
      
      if (result.success) {
        console.log('✅ User deleted successfully:', ref);
        res.status(200).json({
          success: true,
          message: `Gebruiker ${ref} succesvol verwijderd`
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Gebruiker niet gevonden'
        });
      }

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('❌ Admin user API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 