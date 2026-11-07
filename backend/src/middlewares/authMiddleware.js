const jwt = require('jsonwebtoken');
const { User } = require('../config/database');
const { UnauthorizedError } = require('../utils/errors');

module.exports = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token && req.cookies) token = req.cookies.session;

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    if (currentUser.status === 'inactive') {
      return next(new UnauthorizedError('Your account has been deactivated. Please contact the administrator.'));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};
