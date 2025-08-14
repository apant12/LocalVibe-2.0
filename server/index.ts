// Ultra-minimal server to isolate crash issues
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Ultra-minimal server is working'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Basic login route
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === 'admin@vibe.com' && password === 'admin123') {
      res.json({ 
        success: true, 
        user: { id: 'admin-1', email: 'admin@vibe.com', isAdmin: true },
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Serve static files
app.use(express.static('client/dist'));

// Catch-all route
app.use('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.json({ message: 'API route not found', path: req.path });
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>LocalVibe - Minimal Server</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h1>LocalVibe</h1>
            <p>Minimal server is running!</p>
            <p>API endpoints:</p>
            <ul style="list-style: none; padding: 0;">
              <li><a href="/api/health">/api/health</a></li>
              <li><a href="/api/test">/api/test</a></li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Ultra-minimal server running on port ${port}`);
});
