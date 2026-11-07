const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomBytes, timingSafeEqual } = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');
const { User } = require('../config/database');
const educatorController = require('./educatorController');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');

const SESSION_MAX_AGE = 2 * 60 * 60 * 1000;
const cookieOptions = (httpOnly = true) => ({
  httpOnly,
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  educatorType: user.educatorType,
  instituteId: user.instituteId,
  status: user.status,
  emailVerified: user.emailVerified,
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
});

const startSession = (res, user) => {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      educatorType: user.educatorType || null,
      instituteId: user.instituteId || null
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
  const csrfToken = randomBytes(32).toString('hex');
  res.cookie('session', token, { ...cookieOptions(), maxAge: SESSION_MAX_AGE });
  res.cookie('csrfToken', csrfToken, { ...cookieOptions(false), maxAge: SESSION_MAX_AGE });
};

const googleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    throw new Error('Google authentication is not configured.');
  }
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, inviteToken } = req.body;

    if (!name || !email || !password || password.length < 8 || password.length > 128) {
      return next(new BadRequestError('Please provide name, email, and password.'));
    }

    // Check if email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: { [Op.iLike]: normalizedEmail } } });
    if (existingUser) {
      return next(new ConflictError('Email already registered.'));
    }

    // Check if roll number already exists for student
    if (rollNumber) {
      const existingRoll = await User.findOne({ where: { rollNumber } });
      if (existingRoll) {
        return next(new ConflictError('Roll number already registered.'));
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const invite = await educatorController.consumeInvite(inviteToken, normalizedEmail);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: invite ? 'EDUCATOR' : 'STUDENT',
      educatorType: invite?.educatorType || null,
      emailVerified: false,
      rollNumber: rollNumber || null,
      earningsBalance: 0.0,
      totalEarned: 0.0,
      mustChangePassword: false,
      status: 'active'
    });
    if (invite) {
      invite.acceptedAt = new Date();
      await invite.save();
    }

    startSession(res, newUser);

    res.status(201).json({
      status: 'success',
      user: publicUser(newUser)
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

    const user = await User.findOne({ where: { email: { [Op.iLike]: email.trim().toLowerCase() } } });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return next(new UnauthorizedError('Incorrect email or password.'));
    }

    if (user.status === 'inactive') {
      return next(new UnauthorizedError('Your account has been deactivated. Please contact the administrator.'));
    }

    startSession(res, user);

    res.status(200).json({
      status: 'success',
      user: publicUser(user)
    });
  } catch (err) {
    next(err);
  }
};

exports.startGoogleAuth = async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?google=not-configured`);
    }
    const state = randomBytes(32).toString('hex');
    res.cookie('googleOAuthState', state, {
      ...cookieOptions(),
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google/callback'
    });
    if (req.query.invite) {
      res.cookie('educatorInvite', String(req.query.invite), {
        ...cookieOptions(), maxAge: 10 * 60 * 1000, path: '/api/auth/google/callback'
      });
    }
    const client = googleClient();
    res.redirect(client.generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account'
    }));
  } catch (err) {
    next(err);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const expectedState = req.cookies?.googleOAuthState || '';
    const receivedState = String(req.query.state || '');
    res.clearCookie('googleOAuthState', { ...cookieOptions(), path: '/api/auth/google/callback' });
    const inviteToken = req.cookies?.educatorInvite;
    res.clearCookie('educatorInvite', { ...cookieOptions(), path: '/api/auth/google/callback' });
    if (!expectedState || !receivedState || expectedState.length !== receivedState.length ||
        !timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState)) || !req.query.code) {
      return next(new UnauthorizedError('Google sign-in could not be verified.'));
    }

    const client = googleClient();
    const { tokens } = await client.getToken(String(req.query.code));
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email || profile.email_verified !== true || !profile.sub) {
      return next(new UnauthorizedError('A verified Google email is required.'));
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    const invite = await educatorController.consumeInvite(inviteToken, normalizedEmail);
    let user = await User.findOne({ where: { googleId: profile.sub } });
    if (!user) user = await User.findOne({ where: { email: { [Op.iLike]: normalizedEmail } } });
    if (user && user.googleId && user.googleId !== profile.sub) {
      return next(new ConflictError('This email is already linked to another Google account.'));
    }
    if (!user) {
      user = await User.create({
        name: profile.name || normalizedEmail,
        email: normalizedEmail,
        password: null,
        role: invite ? 'EDUCATOR' : 'STUDENT',
        educatorType: invite?.educatorType || null,
        status: 'active',
        googleId: profile.sub,
        emailVerified: true
      });
    } else {
      user.googleId = profile.sub;
      user.emailVerified = true;
      if (invite) {
        user.role = 'EDUCATOR';
        user.educatorType = invite.educatorType;
      }
      await user.save();
    }
    if (invite) {
      invite.acceptedAt = new Date();
      await invite.save();
    }
    if (user.status !== 'active') return next(new UnauthorizedError('This account is unavailable.'));
    startSession(res, user);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
  } catch (err) {
    next(err);
  }
};

exports.getCurrentUser = async (req, res) => {
  res.status(200).json({ status: 'success', user: publicUser(req.user) });
};

exports.logout = (req, res) => {
  res.clearCookie('session', cookieOptions());
  res.clearCookie('csrfToken', cookieOptions(false));
  res.status(200).json({ status: 'success', message: 'Signed out.' });
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
