const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../khata_ledger.db');
const uploadsDir = path.join(__dirname, '../../uploads');
const backupsDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to local SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

function initSchema() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'ACCOUNTANT',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Workspaces table
      db.run(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Parties (Customers / Suppliers)
      db.run(`
        CREATE TABLE IF NOT EXISTS parties (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          type TEXT NOT NULL DEFAULT 'CUSTOMER',
          address TEXT,
          opening_balance REAL DEFAULT 0,
          current_balance REAL DEFAULT 0,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);

      // Transactions (Gave / Got)
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          party_id TEXT NOT NULL,
          type TEXT NOT NULL, -- 'GAVE' (Debit / Receivable) or 'GOT' (Credit / Payable)
          amount REAL NOT NULL,
          payment_mode TEXT DEFAULT 'CASH',
          category TEXT DEFAULT 'GENERAL',
          notes TEXT,
          date DATETIME NOT NULL,
          version INTEGER DEFAULT 1,
          sync_status TEXT DEFAULT 'SYNCHRONIZED',
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
        )
      `);

      // Attachments table
      db.run(`
        CREATE TABLE IF NOT EXISTS attachments (
          id TEXT PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          sha256 TEXT NOT NULL,
          storage_path TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        )
      `);

      // Sync Logs
      db.run(`
        CREATE TABLE IF NOT EXISTS sync_logs (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          device_id TEXT NOT NULL,
          items_count INTEGER NOT NULL,
          conflicts_resolved INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Backups telemetry
      db.run(`
        CREATE TABLE IF NOT EXISTS backups (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'AUTOMATED' | 'MANUAL'
          status TEXT NOT NULL, -- 'SUCCESS' | 'FAILED'
          checksum TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Database helper promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  initSchema,
  run,
  get,
  all,
  dbPath,
  uploadsDir,
  backupsDir
};
