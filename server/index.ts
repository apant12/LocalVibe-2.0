import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";

// Try to import database modules with fallback
let db: any = null;
let pool: any = null;
let storage: any = null;

// Function to initialize database modules
async function initializeDatabase() {
  try {
    const dbModule = await import("./db");
    db = dbModule.db;
    pool = dbModule.pool;
    
    const storageModule = await import("./storage");
    storage = storageModule.storage;
    
    console.log("Database modules imported successfully");
  } catch (error) {
    console.warn("Could not import database modules:", error instanceof Error ? error.message : 'Unknown error');
    console.log("Continuing without database support");
  }
}

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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'not available',
    storage: storage ? 'available' : 'not available'
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

// Database test route
app.get('/api/test-db', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        message: 'Database not connected',
        error: 'DATABASE_URL not set or connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    // Test database connection with a simple query
    const result = await db.select().from(db.users).limit(1);
    res.json({ 
      message: 'Database connection successful', 
      timestamp: new Date().toISOString(),
      dbTest: 'OK',
      userCount: result.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// User registration endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'All fields are required: email, password, firstName, lastName' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if database is available
    if (db && storage) {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ 
            message: 'User with this email already exists' 
          });
        }
        
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user with hashed password
        const newUser = {
          id: `user-${Date.now()}`,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const createdUser = await storage.upsertUser(newUser);
        
        // Set session
        req.session.userId = createdUser.id;
        req.session.user = createdUser;
        
        res.json({ 
          success: true, 
          user: createdUser, 
          message: 'User created successfully' 
        });
        return;
        
      } catch (dbError) {
        console.log('Database signup failed:', dbError instanceof Error ? dbError.message : 'Unknown error');
        // Fall through to hardcoded response
      }
    }
    
    // Fallback response if database not available
    res.status(503).json({ 
      message: 'User registration temporarily unavailable. Please try again later.' 
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed' });
  }
});

// Enhanced login route with database support
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if database is available
    if (db && storage) {
      try {
        // Try to find user in database
        const existingUser = await storage.getUserByEmail(email);
        
        if (existingUser) {
          // Verify password if user has a hashed password
          if (existingUser.password && existingUser.password.length > 20) {
            // This looks like a hashed password, verify it
            const passwordMatch = await bcrypt.compare(password, existingUser.password);
            if (passwordMatch) {
              req.session.userId = existingUser.id;
              req.session.user = existingUser;
              res.json({ success: true, user: existingUser, source: 'database' });
              return;
            } else {
              return res.status(401).json({ message: 'Invalid credentials' });
            }
          } else {
            // Legacy user without hashed password, set session
            req.session.userId = existingUser.id;
            req.session.user = existingUser;
            res.json({ success: true, user: existingUser, source: 'database' });
            return;
          }
        }
      } catch (dbError) {
        console.log('Database lookup failed, falling back to hardcoded:', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
    }
    
    // Fallback to hardcoded admin check
    if (email === 'admin@vibe.com' && password === 'admin123') {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@vibe.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      };
      
      // Try to save admin user to database if available
      if (db && storage) {
        try {
          await storage.upsertUser(adminUser);
        } catch (dbError) {
          console.log('Could not save admin user to database:', dbError instanceof Error ? dbError.message : 'Unknown error');
        }
      }
      
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

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Enhanced server with database support running on port ${port}`);
    console.log(`Database status: ${db ? 'Connected' : 'Not available'}`);
    console.log(`Storage status: ${storage ? 'Available' : 'Not available'}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database, starting server without it:', error);
  app.listen(port, () => {
    console.log(`Server running without database support on port ${port}`);
  });
});
