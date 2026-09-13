const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../database/db');

async function pushOutboxBatch(workspaceId, userId, deviceId, items = []) {
  let processedCount = 0;
  let conflictsResolved = 0;
  const syncResults = [];

  for (const item of items) {
    try {
      if (item.entityType === 'TRANSACTION') {
        const payload = item.payload;
        // Check if transaction already exists
        const existing = await get('SELECT * FROM transactions WHERE id = ?', [payload.id]);

        if (existing) {
          // Version comparison
          if (item.version <= existing.version) {
            conflictsResolved++;
            syncResults.push({
              clientTempId: item.clientTempId || payload.id,
              serverId: existing.id,
              status: 'RESOLVED_SERVER_WIN',
              serverVersion: existing.version
            });
            continue;
          }
        }

        // Check party exists
        let party = await get('SELECT * FROM parties WHERE id = ? AND workspace_id = ?', [payload.partyId, workspaceId]);
        if (!party) {
          // Auto create party if missing
          const partyId = payload.partyId || uuidv4();
          await run(
            `INSERT INTO parties (id, workspace_id, name, phone, type, current_balance) VALUES (?, ?, ?, ?, ?, ?)`,
            [partyId, workspaceId, payload.partyName || 'Offline Sync Party', null, 'CUSTOMER', 0]
          );
          party = { id: partyId, current_balance: 0 };
        }

        const txId = payload.id || uuidv4();
        const txAmount = Number(payload.amount);
        const txDate = payload.date || new Date().toISOString();

        if (existing) {
          await run(
            `UPDATE transactions SET type = ?, amount = ?, notes = ?, category = ?, version = version + 1, sync_status = 'SYNCHRONIZED' WHERE id = ?`,
            [payload.type, txAmount, payload.notes || '', payload.category || 'GENERAL', txId]
          );
        } else {
          await run(
            `INSERT INTO transactions (id, workspace_id, party_id, type, amount, payment_mode, category, notes, date, version, sync_status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'SYNCHRONIZED', ?)`,
            [txId, workspaceId, payload.partyId, payload.type, txAmount, payload.paymentMode || 'CASH', payload.category || 'GENERAL', payload.notes || '', txDate, userId]
          );
        }

        // Recalculate party balance
        const txs = await all('SELECT type, amount FROM transactions WHERE party_id = ?', [payload.partyId]);
        let calcBalance = 0;
        txs.forEach(t => {
          if (t.type === 'GAVE') calcBalance += t.amount;
          else if (t.type === 'GOT') calcBalance -= t.amount;
        });

        await run('UPDATE parties SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [calcBalance, payload.partyId]);

        processedCount++;
        syncResults.push({
          clientTempId: item.clientTempId || txId,
          serverId: txId,
          status: 'SUCCESS',
          serverVersion: 1
        });
      } else if (item.entityType === 'PARTY') {
        const payload = item.payload;
        const existing = await get('SELECT * FROM parties WHERE id = ?', [payload.id]);

        if (existing && item.version <= existing.version) {
          conflictsResolved++;
          syncResults.push({
            clientTempId: payload.id,
            serverId: existing.id,
            status: 'RESOLVED_SERVER_WIN',
            serverVersion: existing.version
          });
          continue;
        }

        const pId = payload.id || uuidv4();
        if (existing) {
          await run(
            `UPDATE parties SET name = ?, phone = ?, email = ?, address = ?, type = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [payload.name, payload.phone || null, payload.email || null, payload.address || null, payload.type || 'CUSTOMER', pId]
          );
        } else {
          await run(
            `INSERT INTO parties (id, workspace_id, name, phone, email, type, address, opening_balance, current_balance, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [pId, workspaceId, payload.name, payload.phone || null, payload.email || null, payload.type || 'CUSTOMER', payload.address || null, payload.openingBalance || 0, payload.openingBalance || 0]
          );
        }

        processedCount++;
        syncResults.push({
          clientTempId: payload.id,
          serverId: pId,
          status: 'SUCCESS',
          serverVersion: existing ? existing.version + 1 : 1
        });
      }
    } catch (err) {
      console.error('Failed to sync outbox item:', item, err);
      syncResults.push({
        clientTempId: item.clientTempId,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  // Log sync event telemetry
  const syncLogId = uuidv4();
  await run(
    `INSERT INTO sync_logs (id, workspace_id, device_id, items_count, conflicts_resolved, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [syncLogId, workspaceId, deviceId || 'UNKNOWN_DEVICE', processedCount, conflictsResolved, 'COMPLETED']
  );

  return {
    syncLogId,
    processedCount,
    conflictsResolved,
    results: syncResults,
    serverTimestamp: new Date().toISOString()
  };
}

async function pullChanges(workspaceId, lastSyncedAt) {
  let partySql = 'SELECT * FROM parties WHERE workspace_id = ?';
  let txSql = 'SELECT * FROM transactions WHERE workspace_id = ?';
  const params = [workspaceId];

  if (lastSyncedAt) {
    partySql += ' AND updated_at > ?';
    txSql += ' AND created_at > ?';
    params.push(lastSyncedAt);
  }

  const parties = await all(partySql, params);
  const transactions = await all(txSql, params);

  return {
    parties,
    transactions,
    serverTimestamp: new Date().toISOString()
  };
}

module.exports = {
  pushOutboxBatch,
  pullChanges
};
