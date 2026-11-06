const { ForbiddenError } = require('../utils/errors');

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User context not found. Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    next();
  };
};
