export default function handler(req, res) {
  // Zelfde CORS headers als affiliate.js
  res.setHeader('Access-Control-Allow-Origin', 'https://www.filright.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Test response
  res.status(200).json({
    message: 'CORS test succesvol!',
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
} 