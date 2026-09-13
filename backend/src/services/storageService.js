const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, uploadsDir } = require('../database/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function calculateSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

async function attachFileToTransaction(transactionId, file) {
  const tx = await get('SELECT id FROM transactions WHERE id = ?', [transactionId]);
  if (!tx) {
    // Cleanup uploaded file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const err = new Error('Transaction record not found for attachment.');
    err.statusCode = 404;
    err.code = 'TRANSACTION_NOT_FOUND';
    err.isOperational = true;
    throw err;
  }

  const fileHash = await calculateSHA256(file.path);
  const attachmentId = uuidv4();

  await run(
    `INSERT INTO attachments (id, transaction_id, filename, original_name, mime_type, size_bytes, sha256, storage_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [attachmentId, transactionId, file.filename, file.originalname, file.mimetype, file.size, fileHash, file.path]
  );

  return await get('SELECT * FROM attachments WHERE id = ?', [attachmentId]);
}

async function getAttachmentById(id) {
  const item = await get('SELECT * FROM attachments WHERE id = ?', [id]);
  if (!item) {
    const err = new Error('Attachment file not found.');
    err.statusCode = 404;
    err.code = 'ATTACHMENT_NOT_FOUND';
    err.isOperational = true;
    throw err;
  }
  return item;
}

module.exports = {
  upload,
  attachFileToTransaction,
  getAttachmentById
};
