import express from 'express';
import 'dotenv/config';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('client/dist'));

// Setup authentication
setupAuth(app);

// Register API routes
registerRoutes(app);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile('client/dist/index.html', { root: '.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
