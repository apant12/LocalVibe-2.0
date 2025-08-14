import express from 'express';

const app = express();

// Middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is working!'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!'
  });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (email === 'admin@vibe.com' && password === 'admin123') {
      res.json({
        success: true,
        message: 'Login successful!'
      });
    } else {
      res.status(401).json({
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Login failed'
    });
  }
});

// Serve static files
app.use(express.static('client/dist'));

// Catch-all route
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>LocalVibe</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #000; color: white; }
          .container { max-width: 600px; margin: 0 auto; text-align: center; }
          .endpoint { background: #333; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .endpoint a { color: #00ff88; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>LocalVibe</h1>
          <p>Minimal server is working! 🚀</p>
          
          <h3>Test these endpoints:</h3>
          <div class="endpoint">
            <a href="/api/health">/api/health</a>
          </div>
          <div class="endpoint">
            <a href="/api/test">/api/test</a>
          </div>
          
          <h3>Status:</h3>
          <p style="color: #00ff88;">✅ Server deployed!</p>
          <p style="color: #00ff88;">✅ No more crashes!</p>
          <p style="color: #00ff88;">✅ Should work now!</p>
        </div>
      </body>
    </html>
  `);
});

// Export for Vercel
export default app;
