// middleware per le gestione degli errori
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message: err.message || 'Internal Server Error'
    }
  });
}

module.exports = errorHandler;
