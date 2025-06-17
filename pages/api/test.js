export default function handler(req, res) {
  // Breedere CORS configuratie voor debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log voor debugging
  console.log('Test API called:', req.method, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight request');
    res.status(200).end();
    return;
  }

  // Test response
  res.status(200).json({
    message: 'CORS test succesvol!',
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    success: true
  });
} 