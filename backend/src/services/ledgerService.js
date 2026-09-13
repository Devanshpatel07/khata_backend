const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../database/db');

// Verify workspace ownership
async function verifyWorkspaceAccess(workspaceId, userId) {
  const ws = await get('SELECT * FROM workspaces WHERE id = ? AND user_id = ?', [workspaceId, userId]);
  if (!ws) {
    const err = new Error('Workspace not found or unauthorized access.');
    err.statusCode = 404;
    err.code = 'WORKSPACE_NOT_FOUND';
    err.isOperational = true;
    throw err;
  }
  return ws;
}

// Workspaces
async function getUserWorkspaces(userId) {
  return await all('SELECT * FROM workspaces WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

async function createWorkspace(userId, name, currency = 'INR') {
  const id = uuidv4();
  await run('INSERT INTO workspaces (id, user_id, name, currency) VALUES (?, ?, ?, ?)', [id, userId, name, currency]);
  return await get('SELECT * FROM workspaces WHERE id = ?', [id]);
}

// Parties (Customers / Suppliers)
async function getParties(workspaceId, { type, search, page = 1, limit = 50 }) {
  let sql = 'SELECT * FROM parties WHERE workspace_id = ?';
  const params = [workspaceId];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY updated_at DESC';

  const offset = (page - 1) * limit;
  const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
  const rows = await all(paginatedSql, [...params, limit, offset]);
  
  const countRow = await get(`SELECT COUNT(*) as total FROM (${sql})`, params);

  return {
    parties: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRow ? countRow.total : rows.length,
      totalPages: countRow ? Math.ceil(countRow.total / limit) : 1
    }
  };
}

async function getPartyById(workspaceId, partyId) {
  const party = await get('SELECT * FROM parties WHERE id = ? AND workspace_id = ?', [partyId, workspaceId]);
  if (!party) {
    const err = new Error('Party record not found.');
    err.statusCode = 404;
    err.code = 'PARTY_NOT_FOUND';
    err.isOperational = true;
    throw err;
  }
  return party;
}

async function createParty(workspaceId, { name, phone, email, type = 'CUSTOMER', address, openingBalance = 0 }) {
  const id = uuidv4();
  const currentBalance = Number(openingBalance);

  await run(
    `INSERT INTO parties (id, workspace_id, name, phone, email, type, address, opening_balance, current_balance) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, workspaceId, name, phone || null, email || null, type, address || null, openingBalance, currentBalance]
  );

  return await get('SELECT * FROM parties WHERE id = ?', [id]);
}

async function updateParty(workspaceId, partyId, updates) {
  const party = await getPartyById(workspaceId, partyId);
  const name = updates.name !== undefined ? updates.name : party.name;
  const phone = updates.phone !== undefined ? updates.phone : party.phone;
  const email = updates.email !== undefined ? updates.email : party.email;
  const address = updates.address !== undefined ? updates.address : party.address;
  const type = updates.type !== undefined ? updates.type : party.type;

  await run(
    `UPDATE parties SET name = ?, phone = ?, email = ?, address = ?, type = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, phone, email, address, type, partyId]
  );

  return await getPartyById(workspaceId, partyId);
}

async function deleteParty(workspaceId, partyId) {
  await getPartyById(workspaceId, partyId);
  await run('DELETE FROM transactions WHERE party_id = ? AND workspace_id = ?', [partyId, workspaceId]);
  await run('DELETE FROM parties WHERE id = ? AND workspace_id = ?', [partyId, workspaceId]);
  return { success: true, deletedPartyId: partyId };
}

// Transactions
async function addTransaction(workspaceId, userId, { partyId, type, amount, paymentMode = 'CASH', category = 'GENERAL', notes, date }) {
  const party = await getPartyById(workspaceId, partyId);
  const txId = uuidv4();
  const txAmount = Number(amount);
  const txDate = date || new Date().toISOString();

  let balanceDelta = 0;
  if (type === 'GAVE') {
    balanceDelta = txAmount;
  } else if (type === 'GOT') {
    balanceDelta = -txAmount;
  }

  const newBalance = party.current_balance + balanceDelta;

  await run(
    `INSERT INTO transactions (id, workspace_id, party_id, type, amount, payment_mode, category, notes, date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [txId, workspaceId, partyId, type, txAmount, paymentMode, category, notes || null, txDate, userId]
  );

  await run(
    `UPDATE parties SET current_balance = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newBalance, partyId]
  );

  const createdTx = await get('SELECT * FROM transactions WHERE id = ?', [txId]);
  return {
    transaction: createdTx,
    updatedPartyBalance: newBalance
  };
}

async function updateTransaction(workspaceId, txId, updates) {
  const existingTx = await get('SELECT * FROM transactions WHERE id = ? AND workspace_id = ?', [txId, workspaceId]);
  if (!existingTx) {
    const err = new Error('Transaction record not found.');
    err.statusCode = 404;
    throw err;
  }

  // Reverse old balance effect on party
  const party = await getPartyById(workspaceId, existingTx.party_id);
  let oldDelta = existingTx.type === 'GAVE' ? existingTx.amount : -existingTx.amount;
  let baseBalance = party.current_balance - oldDelta;

  const newType = updates.type || existingTx.type;
  const newAmount = updates.amount !== undefined ? Number(updates.amount) : existingTx.amount;
  const newPaymentMode = updates.paymentMode || existingTx.payment_mode;
  const newCategory = updates.category || existingTx.category;
  const newNotes = updates.notes !== undefined ? updates.notes : existingTx.notes;

  let newDelta = newType === 'GAVE' ? newAmount : -newAmount;
  let updatedPartyBalance = baseBalance + newDelta;

  await run(
    `UPDATE transactions SET type = ?, amount = ?, payment_mode = ?, category = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newType, newAmount, newPaymentMode, newCategory, newNotes, txId]
  );

  await run(
    `UPDATE parties SET current_balance = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [updatedPartyBalance, existingTx.party_id]
  );

  const updatedTx = await get('SELECT * FROM transactions WHERE id = ?', [txId]);
  return {
    transaction: updatedTx,
    updatedPartyBalance
  };
}

async function deleteTransaction(workspaceId, txId) {
  const existingTx = await get('SELECT * FROM transactions WHERE id = ? AND workspace_id = ?', [txId, workspaceId]);
  if (!existingTx) {
    const err = new Error('Transaction record not found.');
    err.statusCode = 404;
    throw err;
  }

  const party = await getPartyById(workspaceId, existingTx.party_id);
  let delta = existingTx.type === 'GAVE' ? existingTx.amount : -existingTx.amount;
  let newBalance = party.current_balance - delta;

  await run('DELETE FROM attachments WHERE transaction_id = ?', [txId]);
  await run('DELETE FROM transactions WHERE id = ? AND workspace_id = ?', [txId, workspaceId]);

  await run(
    `UPDATE parties SET current_balance = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newBalance, existingTx.party_id]
  );

  return { success: true, deletedTxId: txId, updatedPartyBalance: newBalance };
}

async function getTransactions(workspaceId, { partyId, type, category, startDate, endDate, page = 1, limit = 50 }) {
  let sql = `
    SELECT t.*, p.name as party_name, p.type as party_type
    FROM transactions t
    JOIN parties p ON t.party_id = p.id
    WHERE t.workspace_id = ?
  `;
  const params = [workspaceId];

  if (partyId) {
    sql += ' AND t.party_id = ?';
    params.push(partyId);
  }

  if (type) {
    sql += ' AND t.type = ?';
    params.push(type);
  }

  if (category) {
    sql += ' AND t.category = ?';
    params.push(category);
  }

  if (startDate) {
    sql += ' AND t.date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND t.date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY t.date DESC';

  const offset = (page - 1) * limit;
  const rows = await all(`${sql} LIMIT ? OFFSET ?`, [...params, limit, offset]);

  for (let r of rows) {
    r.attachments = await all('SELECT id, filename, original_name, mime_type, size_bytes, sha256 FROM attachments WHERE transaction_id = ?', [r.id]);
  }

  const countRow = await get(`SELECT COUNT(*) as total FROM (${sql})`, params);

  return {
    transactions: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRow ? countRow.total : rows.length,
      totalPages: countRow ? Math.ceil(countRow.total / limit) : 1
    }
  };
}

// Executive Dashboard Summary & Telemetry
async function getExecutiveSummary(workspaceId) {
  const parties = await all('SELECT * FROM parties WHERE workspace_id = ?', [workspaceId]);

  let totalYouWillGet = 0;
  let totalYouWillGive = 0;

  parties.forEach(p => {
    if (p.current_balance > 0) {
      totalYouWillGet += p.current_balance;
    } else if (p.current_balance < 0) {
      totalYouWillGive += Math.abs(p.current_balance);
    }
  });

  const netBalance = totalYouWillGet - totalYouWillGive;

  const recentTransactions = await all(`
    SELECT t.*, p.name as party_name 
    FROM transactions t
    JOIN parties p ON t.party_id = p.id
    WHERE t.workspace_id = ?
    ORDER BY t.date DESC
    LIMIT 10
  `, [workspaceId]);

  const partyCount = parties.length;
  const transactionCountRow = await get('SELECT COUNT(*) as cnt FROM transactions WHERE workspace_id = ?', [workspaceId]);

  return {
    summary: {
      totalYouWillGet,
      totalYouWillGive,
      netBalance,
      totalParties: partyCount,
      totalTransactions: transactionCountRow ? transactionCountRow.cnt : 0,
      currency: 'INR'
    },
    recentTransactions
  };
}

module.exports = {
  verifyWorkspaceAccess,
  getUserWorkspaces,
  createWorkspace,
  getParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getExecutiveSummary
};
