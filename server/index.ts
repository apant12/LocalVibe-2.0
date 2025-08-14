import 'dotenv/config';
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";

// Email validation helper
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Basic server with session support
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running successfully'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Test signup endpoint (for development testing)
app.post('/api/test-signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'All fields are required: email, password, firstName, lastName' 
      });
    }
    
    // Hash password for testing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    res.json({ 
      message: 'Signup test successful', 
      hashedPassword: hashedPassword.substring(0, 20) + '...',
      passwordLength: password.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Signup test failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced login route with hardcoded admin
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hardcoded admin check
    if (email === 'admin@vibe.com' && password === 'admin123') {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@vibe.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      };
      
      req.session.userId = adminUser.id;
      req.session.user = adminUser;
      res.json({ success: true, user: adminUser, source: 'hardcoded' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Logout route
app.get('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out' });
  });
});

// Serve static files for the React app
app.use(express.static('client/dist'));

// Catch-all route - serve React app for frontend routes
app.use('*', (req, res) => {
  // If it's an API route, return JSON
  if (req.path.startsWith('/api/')) {
    return res.json({ message: 'API route not found', path: req.path });
  }
  
  // For frontend routes, serve the React app
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>LocalVibe</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Discover unique local experiences">
      </head>
      <body>
        <div id="root">
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h1>LocalVibe</h1>
              <p>Loading...</p>
              <p>If you see this message, the React app needs to be built.</p>
            </div>
          </div>
        </div>
        <script>
          // Simple redirect to login for now
          if (window.location.pathname !== '/api/health' && window.location.pathname !== '/api/test') {
            window.location.href = '/login';
          }
        </script>
      </body>
    </html>
  `);
});

// Start the server
const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, () => {
  console.log(`Minimal working server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
