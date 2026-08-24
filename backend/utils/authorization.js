function isAdmin(user) {
  return user?.role === 'admin';
}

function isManager(user) {
  return user?.role === 'manager';
}

function isCustomer(user) {
  return user?.role === 'customer';
}

function isOwner(ownerId, userId) {
  if (!ownerId || !userId) return false;
  return ownerId.toString() === userId.toString();
}

function unauthorized(message = 'Not authorized to perform this operation', statusCode = 403) {
  return {
    authorized: false,
    statusCode,
    message
  };
}

module.exports = {
  isAdmin,
  isManager,
  isCustomer,
  isOwner,
  unauthorized
};
