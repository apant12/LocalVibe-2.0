import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";

// Basic server with session support
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic session setup (without database for now)
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Basic login route
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple admin check
    if (email === 'admin@vibe.com' && password === 'admin123') {
      req.session.userId = 'admin-1';
      req.session.user = {
        id: 'admin-1',
        email: 'admin@vibe.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      };
      
      res.json({ success: true, user: req.session.user });
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

// Catch-all route
app.use('*', (req, res) => {
  res.json({ message: 'Server is running', path: req.path });
});

// Start the server
const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, () => {
  console.log(`Basic server with auth running on port ${port}`);
});
