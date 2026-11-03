function sendSuccess(res, data = {}, message = 'Request completed', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function sendError(res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = []) {
  const payload = {
    success: false,
    message,
    code,
    details
  };

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError
};
