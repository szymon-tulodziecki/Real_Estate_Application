/**
 * Tworzy standardowy obiekt błędu
 * @param {string} message - Komunikat błędu
 * @param {number} statusCode - Kod statusu HTTP
 * @returns {Error} Obiekt błędu
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Wrapper dla obsługi błędów w kontrolerach async
 * @param {Function} fn - Funkcja kontrolera
 * @returns {Function} Wrapped controller function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware do globalnej obsługi błędów
 */
const errorHandler = (err, req, res, next) => {
  console.error(err);
  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Błędy walidacji',
      errors
    });
  }
  // Mongo duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} już istnieje w bazie danych`
    });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Nieprawidłowy token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token wygasł' });
  }
  // CSRF errors (csurf)
  if (err.code === 'EBADCSRFTOKEN' || /csrf/i.test(err.message)) {
    return res.status(403).json({ success: false, message: 'Błąd CSRF: nieprawidłowy lub brakujący token' });
  }
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Wystąpił nieoczekiwany błąd';
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = {
  createError,
  asyncHandler,
  errorHandler
};
