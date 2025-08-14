// Most basic Vercel serverless function
export default function handler(req, res) {
  // Basic health check
  if (req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      message: 'Basic serverless function working!'
    });
  }

  // Basic test endpoint
  if (req.url === '/api/test') {
    return res.status(200).json({
      message: 'Test endpoint working!'
    });
  }

  // Basic login
  if (req.url === '/api/login' && req.method === 'POST') {
    try {
      const body = req.body || {};
      if (body.email === 'admin@vibe.com' && body.password === 'admin123') {
        return res.status(200).json({
          success: true,
          message: 'Login successful!'
        });
      } else {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: 'Login failed'
      });
    }
  }

  // Default response - simple HTML
  res.status(200).send(`
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
          <p>Basic serverless function is working! 🚀</p>
          
          <h3>Test these endpoints:</h3>
          <div class="endpoint">
            <a href="/api/health">/api/health</a>
          </div>
          <div class="endpoint">
            <a href="/api/test">/api/test</a>
          </div>
          
          <h3>Status:</h3>
          <p style="color: #00ff88;">✅ Function deployed!</p>
          <p style="color: #00ff88;">✅ No complex dependencies!</p>
          <p style="color: #00ff88;">✅ Should work now!</p>
        </div>
      </body>
    </html>
  `);
}
