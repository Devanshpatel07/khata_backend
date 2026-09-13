const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'khata_ledger_super_secret_jwt_key_2026_prod';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required to access this resource.'
      }
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session token expired or invalid. Please re-authenticate.'
        }
      });
    }
    req.user = user;
    next();
  });
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated.' }
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: ${roles.join(', ')}.`
        }
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole
};
