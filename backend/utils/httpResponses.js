function jsonOk(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    ...(data !== undefined ? { data } : {})
  });
}

function jsonError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

function paginate(page, limit, total, data) {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

function handleAuth(res, authCheck) {
  return jsonError(res, authCheck.statusCode, authCheck.message);
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

module.exports = {
  jsonOk,
  jsonError,
  paginate,
  handleAuth,
  notFound
};