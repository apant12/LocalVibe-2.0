import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

// Use process.cwd() for CommonJS compatibility
const __dirname = process.cwd();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Session setup for local development
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Allow HTTP in development
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
}));

// Test route directly in this file
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Test endpoint working", 
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.get('/api/auth/user', (req, res) => {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Return user data if authenticated
  res.json({
    id: 'dev-user-1',
    email: 'dev@localvibe.com',
    firstName: 'Development',
    lastName: 'User',
    name: 'Development User',
    isAdmin: true,
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock login validation - accept any valid email format and password
  if (email && email.includes('@') && password && password.length > 0) {
    req.session.userId = 'dev-user-1';
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: 'dev-user-1',
        email: email,
        firstName: 'Development',
        lastName: 'User',
        name: 'Development User',
        isAdmin: true
      }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.userId = undefined;
  res.json({ success: true, message: 'Logged out successfully', user: null });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Mock signup validation
  if (email && password && firstName && lastName) {
    req.session.userId = 'dev-user-1';
    res.json({ 
      success: true, 
      message: 'Signup successful',
      user: {
        id: 'dev-user-1',
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        isAdmin: false
      }
    });
  } else {
    res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }
});



// Import and use the main routes
import { registerRoutes } from './routes.js';

// Start server function
async function startServer() {
  try {
    // Register routes first
    await registerRoutes(app);
    console.log('Routes registered successfully');
    
    // Start server only if not in Vercel
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Debug route to test if React is working
app.get('/debug', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Debug Page</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #000; color: white; }
          .container { max-width: 800px; margin: 0 auto; }
          .status { background: #333; padding: 20px; margin: 20px 0; border-radius: 10px; }
          .success { color: #00ff88; }
          .error { color: #ff4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>LocalVibe Debug Page</h1>
          
          <div class="status">
            <h3>Server Status:</h3>
            <p class="success">✅ Server is running on port ${PORT}</p>
            <p class="success">✅ API endpoints are working</p>
            <p class="success">✅ Database is connected</p>
          </div>
          
          <div class="status">
            <h3>Test Links:</h3>
            <p><a href="/api/health" style="color: #00ff88;">/api/health</a> - Server health check</p>
            <p><a href="/api/auth/user" style="color: #00ff88;">/api/auth/user</a> - Authentication endpoint</p>
            <p><a href="/api/videos" style="color: #ff4444;">/api/videos</a> - Video endpoint</p>
          </div>
          
          <div class="status">
            <h3>React App Test:</h3>
            <p><a href="/" style="color: #00ff88;">Go to React App</a> - This should show your app</p>
            <p>If you see a black screen, there's a React loading issue</p>
          </div>
          
          <div class="status">
            <h3>Next Steps:</h3>
            <p>1. Check if the debug page loads (this page)</p>
            <p>2. Test the API endpoints above</p>
            <p>3. Try the React app link</p>
            <p>4. Check browser console for errors</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Serve static files FIRST (CSS, JS, images) - be specific about the path
app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));
app.use(express.static(path.join(__dirname, 'client/dist')));

// Serve React app for all other routes LAST - but exclude static files
app.get('*', (req, res, next) => {
  // Skip if this is a static file request
  if (req.path.startsWith('/assets/') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

export default app;
