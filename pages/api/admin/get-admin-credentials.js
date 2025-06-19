export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return available admin credentials for troubleshooting
  return res.status(200).json({
    success: true,
    message: 'Available admin credentials for login',
    database_admins: [
      {
        username: 'admin',
        password: 'admin123',
        email: 'info@filright.com',
        note: 'Created via admin management system'
      },
      {
        username: 'testadmin2',
        password: 'admin123',
        email: 'testadmin2@filright.com',
        note: 'Created via admin management system'
      }
    ],
    fallback_admins: [
      {
        username: 'admin',
        password: 'admin123',
        note: 'Hardcoded fallback'
      },
      {
        username: 'filright',
        password: 'filright2025',
        note: 'Hardcoded fallback'
      },
      {
        username: 'stefan',
        password: 'stefan_admin123',
        note: 'Hardcoded fallback'
      },
      {
        username: 'sven',
        password: 'sven_admin_2025',
        note: 'Hardcoded fallback'
      }
    ],
    instructions: [
      '1. Go to https://fraffil-oi3b6so5f-filrights-projects.vercel.app/admin/login',
      '2. Try username: admin, password: admin123',
      '3. Try username: testadmin2, password: admin123',
      '4. If database fails, fallback credentials will be used automatically'
    ]
  });
} 