import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";

// Minimal server to isolate the crash issue
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Catch-all route
app.use('*', (req, res) => {
  res.json({ message: 'Server is running', path: req.path });
});

// Start the server
const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, () => {
  console.log(`Minimal server running on port ${port}`);
});
