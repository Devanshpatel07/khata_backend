function errorHandler(err, req, res, next) {
  console.error('[API ERROR]', err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const userMessage = err.isOperational 
    ? err.message 
    : 'An unexpected system error occurred. Your data remains secure.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: userMessage,
      timestamp: new Date().toISOString()
    }
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `The requested endpoint '${req.originalUrl}' does not exist on this server.`
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
