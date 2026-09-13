require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { initSchema } = require('./backend/src/database/db');
const apiRoutes = require('./backend/src/routes/api');
const { errorHandler } = require('./backend/src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API routes
app.use('/api/v1', apiRoutes);

// Serve static frontend assets from dist folder if built
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { etag: false, maxAge: 0 }));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Khata Server Running</title></head>
        <body style="background:#090B10; color:#06B6D4; font-family:sans-serif; text-align:center; padding:5rem;">
          <h1>Khata Ledger API Server Running on Port ${PORT}</h1>
          <p style="color:#FFF">Please run <code>npm run build</code> to generate frontend static bundle.</p>
        </body>
      </html>
    `);
  });
}

// Error handling
app.use(errorHandler);

// Initialize DB and start server
initSchema().then(async () => {
  console.log('Database schema migration completed successfully.');

  const skipSeed = process.env.SKIP_SEED === 'true' || process.env.DB_PROVIDER === 'supabase';

  if (!skipSeed) {
    // Seed default admin user & demo data if empty on local SQLite only
    const { run, get } = require('./backend/src/database/db');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const existingUser = await get('SELECT * FROM users LIMIT 1');
    if (!existingUser) {
      console.log('Seeding initial demo data...');
      const userId = uuidv4();
      const hash = await bcrypt.hash('admin123', 10);
      await run('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)', [
        userId, 'demo@khata.pro', hash, 'Enterprise Lead Accountant', 'ADMIN'
      ]);

      const wsId = uuidv4();
      await run('INSERT INTO workspaces (id, user_id, name, currency) VALUES (?, ?, ?, ?)', [
        wsId, userId, 'Global Trading Enterprise Ledger', 'INR'
      ]);

      console.log('Demo seed completed!');
    }
  } else {
    console.log('Clean database mode active (SKIP_SEED=true). No mock data generated.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Khata Ledger Enterprise Full-Stack Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database schema:', err);
});
