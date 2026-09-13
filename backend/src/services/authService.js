const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

async function registerUser({ email, password, name, role = 'ACCOUNTANT' }) {
  const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.statusCode = 400;
    err.code = 'EMAIL_EXISTS';
    err.isOperational = true;
    throw err;
  }

  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  await run(
    'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
    [userId, email.toLowerCase().trim(), passwordHash, name, role]
  );

  // Create default workspace for user
  const workspaceId = uuidv4();
  await run(
    'INSERT INTO workspaces (id, user_id, name, currency) VALUES (?, ?, ?, ?)',
    [workspaceId, userId, `${name}'s Primary Ledger`, 'INR']
  );

  const token = generateToken({ id: userId, email, name, role });

  return {
    user: { id: userId, email, name, role },
    workspace: { id: workspaceId, name: `${name}'s Primary Ledger`, currency: 'INR' },
    token
  };
}

async function loginUser({ email, password }) {
  const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user) {
    const err = new Error('Invalid email or password credentials.');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    err.isOperational = true;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password credentials.');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    err.isOperational = true;
    throw err;
  }

  // Get user workspaces
  let workspaces = await all('SELECT * FROM workspaces WHERE user_id = ?', [user.id]);
  if (workspaces.length === 0) {
    const wsId = uuidv4();
    await run('INSERT INTO workspaces (id, user_id, name, currency) VALUES (?, ?, ?, ?)', [wsId, user.id, 'Main Ledger', 'INR']);
    workspaces = [{ id: wsId, user_id: user.id, name: 'Main Ledger', currency: 'INR' }];
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    workspaces,
    token
  };
}

async function handleOAuthLogin({ provider, providerId, email, name }) {
  let user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user) {
    const userId = uuidv4();
    const mockHash = await bcrypt.hash(uuidv4(), 10);
    await run('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)', [
      userId, email.toLowerCase().trim(), mockHash, name, 'ACCOUNTANT'
    ]);
    const wsId = uuidv4();
    await run('INSERT INTO workspaces (id, user_id, name, currency) VALUES (?, ?, ?, ?)', [
      wsId, userId, `${name}'s Ledger`, 'INR'
    ]);
    user = { id: userId, email: email.toLowerCase().trim(), name, role: 'ACCOUNTANT' };
  }

  const workspaces = await all('SELECT * FROM workspaces WHERE user_id = ?', [user.id]);
  const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    workspaces,
    token
  };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  registerUser,
  loginUser,
  handleOAuthLogin
};
