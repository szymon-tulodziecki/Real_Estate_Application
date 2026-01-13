/**
 * Centralized error handler for consistent error formatting
 */

// Format validation errors from express-validator
const formatValidationErrors = (errors) => {
  return errors.array().reduce((acc, error) => {
    acc[error.path] = error.msg;
    return acc;
  }, {});
};

// Standard error response format
const errorResponse = (res, statusCode, message, errors = null, stack = null) => {
  const response = {
    success: false,
    message,
    errors
  };
  
  // Include stack trace only in development environment
  if (process.env.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  formatValidationErrors,
  errorResponse,
  
  // Common error responses
  badRequest: (res, message = 'Nieprawidłowe żądanie', errors = null) => {
    return errorResponse(res, 400, message, errors);
  },
  
  unauthorized: (res, message = 'Brak autoryzacji') => {
    return errorResponse(res, 401, message);
  },
  
  forbidden: (res, message = 'Brak uprawnień do wykonania tej operacji') => {
    return errorResponse(res, 403, message);
  },
  
  notFound: (res, message = 'Nie znaleziono zasobu') => {
    return errorResponse(res, 404, message);
  },
  
  serverError: (res, error) => {
    console.error('Server Error:', error);
    return errorResponse(
      res, 
      500, 
      'Wystąpił błąd serwera', 
      null, 
      error.stack
    );
  },
  
  // Handle validation errors from express-validator
  validationError: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(
        res, 
        'Błędy walidacji formularza', 
        formatValidationErrors(errors)
      );
    }
    return false;
  }
};
