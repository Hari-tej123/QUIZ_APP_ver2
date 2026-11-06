const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../config/database');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'supersecretjwtkeyforquizapp2026!',
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, role, bio, credentials, subjectExpertise, phone } = req.body;

    if (!name || !email || !password) {
      return next(new BadRequestError('Please provide name, email, and password.'));
    }

    const selectedRole = role === 'contributor' ? 'contributor' : 'student';

    if (selectedRole === 'student' && !rollNumber) {
      return next(new BadRequestError('Please provide roll number for student account.'));
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new ConflictError('Email already registered.'));
    }

    // Check if roll number already exists for student
    if (selectedRole === 'student' && rollNumber) {
      const existingRoll = await User.findOne({ where: { rollNumber } });
      if (existingRoll) {
        return next(new ConflictError('Roll number already registered.'));
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: selectedRole,
      rollNumber: selectedRole === 'student' ? rollNumber : null,
      contributorStatus: selectedRole === 'contributor' ? 'pending' : null,
      bio: bio || null,
      credentials: credentials || null,
      subjectExpertise: subjectExpertise || null,
      phone: phone || null,
      earningsBalance: 0.0,
      totalEarned: 0.0,
      mustChangePassword: false,
      status: 'active'
    });

    const token = generateToken(newUser);

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        rollNumber: newUser.rollNumber,
        contributorStatus: newUser.contributorStatus,
        badge: newUser.badge,
        bio: newUser.bio,
        subjectExpertise: newUser.subjectExpertise,
        earningsBalance: newUser.earningsBalance,
        totalEarned: newUser.totalEarned
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new BadRequestError('Please provide email and password.'));
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new UnauthorizedError('Incorrect email or password.'));
    }

    if (user.status === 'inactive') {
      return next(new UnauthorizedError('Your account has been deactivated. Please contact the administrator.'));
    }

    const token = generateToken(user);

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        contributorStatus: user.contributorStatus,
        badge: user.badge,
        bio: user.bio,
        credentials: user.credentials,
        subjectExpertise: user.subjectExpertise,
        earningsBalance: user.earningsBalance,
        totalEarned: user.totalEarned,
        mustChangePassword: user.mustChangePassword,
        department: user.department,
        subject: user.subject,
        phone: user.phone,
        rollNumber: user.rollNumber
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new BadRequestError('Please provide current password and new password.'));
    }

    const user = await User.findByPk(req.user.id);
    
    // Verify current password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return next(new UnauthorizedError('Incorrect current password.'));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};
