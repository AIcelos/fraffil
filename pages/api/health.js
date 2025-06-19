export default async function handler(req, res) {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'PostgreSQL (Neon)',
    
    // Admin login troubleshooting info
    admin_login_help: {
      login_url: 'https://fraffil-oi3b6so5f-filrights-projects.vercel.app/admin/login',
      database_credentials: [
        { username: 'admin', password: 'admin123', source: 'database' },
        { username: 'testadmin2', password: 'admin123', source: 'database' }
      ],
      fallback_credentials: [
        { username: 'admin', password: 'admin123', source: 'fallback' },
        { username: 'filright', password: 'filright2025', source: 'fallback' },
        { username: 'stefan', password: 'stefan_admin123', source: 'fallback' },
        { username: 'sven', password: 'sven_admin_2025', source: 'fallback' }
      ],
      note: 'Login API first tries database, then falls back to hardcoded credentials if database fails'
    }
  };

  res.status(200).json(healthData);
} 