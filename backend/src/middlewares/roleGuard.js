const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

const canonicalRole = (role) => ({
  admin: 'ADMIN',
  educator: 'EDUCATOR',
  faculty: 'EDUCATOR',
  contributor: 'EDUCATOR',
  student: 'STUDENT'
}[String(role || '').toLowerCase()] || String(role || '').toUpperCase());

module.exports = (...allowedRoles) => {
  const canonicalAllowedRoles = allowedRoles.map(canonicalRole);
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!canonicalAllowedRoles.includes(canonicalRole(req.user.role))) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    if (canonicalRole(req.user.role) === 'EDUCATOR' &&
      ['contributor', 'faculty'].includes(String(req.user.role).toLowerCase()) &&
      req.user.contributorStatus !== 'approved') {
      return next(new ForbiddenError('Your educator access has not been approved.'));
    }

    next();
  };
};
