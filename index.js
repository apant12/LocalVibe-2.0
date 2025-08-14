// Ultra-simple Vercel serverless function
module.exports = (req, res) => {
  // Health check
  if (req.url === '/api/health') {
    res.status(200).json({
      status: 'ok',
      message: 'Ultra-simple function working!'
    });
    return;
  }

  // Test endpoint
  if (req.url === '/api/test') {
    res.status(200).json({
      message: 'Test endpoint working!'
    });
    return;
  }

  // Default response - serve HTML
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
          <p>Ultra-simple function is working! 🚀</p>
          
          <h3>Test these endpoints:</h3>
          <div class="endpoint">
            <a href="/api/health">/api/health</a>
          </div>
          <div class="endpoint">
            <a href="/api/test">/api/test</a>
          </div>
          
          <h3>Status:</h3>
          <p style="color: #00ff88;">✅ Function found!</p>
          <p style="color: #00ff88;">✅ No more NOT_FOUND!</p>
          <p style="color: #00ff88;">✅ Should work now!</p>
        </div>
      </body>
    </html>
  `);
};
