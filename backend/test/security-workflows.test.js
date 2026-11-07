const test = require('node:test');
const assert = require('node:assert/strict');
const { OAuth2Client } = require('google-auth-library');
const authController = require('../src/controllers/authController');
const accessController = require('../src/controllers/accessController');
const questionController = require('../src/controllers/questionController');
const studentController = require('../src/controllers/studentController');
const quizWorkflowController = require('../src/controllers/quizWorkflowController');
const roleGuard = require('../src/middlewares/roleGuard');
const database = require('../src/config/database');

const questionPayload = (track = 'competitive') => ({
  questionText: 'Which option is correct?',
  questionType: 'mcq',
  options: ['First', 'Second'],
  correctAnswers: ['B'],
  explanation: 'The second option is right.',
  subject: 'Computer Science',
  topic: 'Algorithms',
  difficulty: 'medium',
  marks: 1,
  tags: ['test'],
  track,
  status: 'published',
  quizId: null
});

const invoke = (handler, req) => new Promise(resolve => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; resolve({ status: this.statusCode, body }); },
    cookie(name, value) { this.cookies ||= {}; this.cookies[name] = value; return this; },
    clearCookie() { return this; },
    redirect(url) { this.redirectTo = url; resolve({ status: 302, redirectTo: url, cookies: this.cookies }); }
  };
  handler(req, res, error => resolve({ error }));
});

test('Google login verifies identity and creates a student session', async () => {
  const original = {
    getToken: OAuth2Client.prototype.getToken,
    verifyIdToken: OAuth2Client.prototype.verifyIdToken,
    findOne: database.User.findOne,
    create: database.User.create
  };
  const oldEnv = { ...process.env };
  try {
    process.env.JWT_SECRET = 'test-secret-with-sufficient-randomness';
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    delete process.env.ADMIN_EMAILS;
    OAuth2Client.prototype.getToken = async () => ({ tokens: { id_token: 'verified-id-token' } });
    OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => ({
      sub: 'google-subject', email: 'new.student@example.com', email_verified: true, name: 'New Student'
    }) });
    database.User.findOne = async () => null;
    database.User.create = async values => ({
      id: 'student-id', status: 'active', ...values, save: async () => {}
    });
    const response = await invoke(authController.googleCallback, {
      cookies: { googleOAuthState: 'valid-state' },
      query: { state: 'valid-state', code: 'oauth-code' }
    });
    assert.equal(response.redirectTo, 'http://localhost:5173/dashboard');
    assert.ok(response.cookies.session);
    assert.ok(response.cookies.csrfToken);
  } finally {
    OAuth2Client.prototype.getToken = original.getToken;
    OAuth2Client.prototype.verifyIdToken = original.verifyIdToken;
    database.User.findOne = original.findOne;
    database.User.create = original.create;
    process.env = oldEnv;
  }
});

test('student is blocked from adding questions', async () => {
  const original = database.Question.create;
  let created = false;
  database.Question.create = async () => { created = true; };
  try {
    const result = await invoke(questionController.create, { user: { id: 'student', role: 'student' }, body: questionPayload() });
    assert.equal(result.error.statusCode, 403);
    assert.equal(created, false);
  } finally {
    database.Question.create = original;
  }
});

test('college educator is blocked from adding competitive exam questions', async () => {
  const result = await invoke(questionController.create, {
    user: { id: 'educator', role: 'EDUCATOR', educatorType: 'COLLEGE' },
    body: questionPayload('exam')
  });
  assert.equal(result.error.statusCode, 403);
});

test('competitive educator can create exam-track questions', async () => {
  const original = database.Question.create;
  let createdValues;
  database.Question.create = async values => { createdValues = values; return { id: 'question-id', ...values }; };
  try {
    const result = await invoke(questionController.create, {
      user: { id: 'faculty-id', role: 'EDUCATOR', educatorType: 'COMPETITIVE' },
      body: questionPayload('exam')
    });
    assert.equal(result.status, 201);
    assert.equal(createdValues.track, 'exam');
    assert.equal(createdValues.createdBy, 'faculty-id');
  } finally {
    database.Question.create = original;
  }
});

test('faculty cannot edit another faculty member question', async () => {
  const original = database.Question.findByPk;
  let updated = false;
  database.Question.findByPk = async () => ({
    id: 'question-id', createdBy: 'other-faculty', track: 'exam',
    get() { return { ...this }; },
    update: async () => { updated = true; }
  });
  try {
    const result = await invoke(questionController.update, {
      user: { id: 'faculty-id', role: 'faculty' },
      params: { id: 'question-id' },
      body: questionPayload('exam')
    });
    assert.equal(result.error.statusCode, 403);
    assert.equal(updated, false);
  } finally {
    database.Question.findByPk = original;
  }
});

test('admin approval upgrades role, records audit, and notifies the applicant', async () => {
  const originals = {
    transaction: database.sequelize.transaction,
    requestFind: database.FacultyRequest.findByPk,
    userFind: database.User.findByPk,
    notificationCreate: database.Notification.create,
    auditCreate: database.AuditLog.create
  };
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: null, commit: async function () { this.finished = 'commit'; }, rollback: async function () { this.finished = 'rollback'; } };
  const request = {
    id: 'request-id', userId: 'student-id', requestedRole: 'faculty', status: 'pending',
    save: async () => {}
  };
  const user = { id: 'student-id', email: 'applicant@example.com', role: 'student', status: 'active', save: async () => {} };
  let notification;
  let audit;
  try {
    database.sequelize.transaction = async () => transaction;
    database.FacultyRequest.findByPk = async () => request;
    database.User.findByPk = async () => user;
    database.Notification.create = async value => { notification = value; };
    database.AuditLog.create = async value => { audit = value; };
    const result = await invoke(accessController.decideRequest, {
      params: { id: 'request-id' }, body: { status: 'approved' }, user: { id: 'admin-id', role: 'admin' }
    });
    assert.equal(result.status, 200);
    assert.equal(user.role, 'faculty');
    assert.equal(request.status, 'approved');
    assert.equal(audit.action, 'faculty_request_approved');
    assert.equal(notification.userId, 'student-id');
  } finally {
    database.sequelize.transaction = originals.transaction;
    database.FacultyRequest.findByPk = originals.requestFind;
    database.User.findByPk = originals.userFind;
    database.Notification.create = originals.notificationCreate;
    database.AuditLog.create = originals.auditCreate;
  }
});

test('student attempt serializer excludes answer keys and explanation', () => {
  const response = studentController.serializeAttemptQuestion({
    id: 'question-id', questionText: 'Question', options: ['A', 'B'], correctOption: 'B',
    correctAnswers: ['B'], explanation: 'Secret explanation', marks: 1
  }, new Set());
  assert.equal('correctOption' in response, false);
  assert.equal('correctAnswers' in response, false);
  assert.equal('explanation' in response, false);
});

test('bookmarked questions do not disclose answers before the student answers', () => {
  const response = studentController.serializeBookmarkedQuestion({
    get: () => ({ id: 'question-id', questionText: 'Question', correctOption: 'B', correctAnswers: ['B'], explanation: 'Secret' })
  });
  assert.equal('correctOption' in response, false);
  assert.equal('correctAnswers' in response, false);
  assert.equal('explanation' in response, false);
});

test('password login cannot claim an allowlisted administrator email', async () => {
  const bcrypt = require('bcryptjs');
  const original = database.User.findOne;
  const oldAllowlist = process.env.ADMIN_EMAILS;
  const user = {
    id: 'existing-id', name: 'Existing User', email: 'admin@example.com', role: 'student',
    status: 'active', password: await bcrypt.hash('valid-password', 4), save: async () => {}
  };
  try {
    process.env.JWT_SECRET = 'test-secret-with-sufficient-randomness';
    process.env.ADMIN_EMAILS = 'admin@example.com';
    database.User.findOne = async () => user;
    const response = await invoke(authController.login, { body: { email: user.email, password: 'valid-password' } });
    assert.equal(response.status, 200);
    assert.equal(user.role, 'student');
  } finally {
    database.User.findOne = original;
    if (oldAllowlist === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = oldAllowlist;
  }
});

test('educator cannot edit another educator quiz', async () => {
  const original = database.Quiz.findByPk;
  let saved = false;
  database.Quiz.findByPk = async () => ({ id: 'quiz-id', ownerId: 'other-educator', authorId: 'other-educator', status: 'DRAFT', save: async () => { saved = true; } });
  try {
    const result = await invoke(quizWorkflowController.updateDraft, {
      params: { quizId: 'quiz-id' },
      user: { id: 'educator-id', role: 'EDUCATOR', educatorType: 'COMPETITIVE' },
      body: { title: 'Updated title' }
    });
    assert.equal(result.error.statusCode, 403);
    assert.equal(saved, false);
  } finally {
    database.Quiz.findByPk = original;
  }
});

test('educator cannot call admin-only quiz publishing routes', async () => {
  const guard = roleGuard('ADMIN');
  const result = await new Promise(resolve => guard({ user: { id: 'educator-id', role: 'EDUCATOR' } }, {}, error => resolve({ error })));
  assert.equal(result.error.statusCode, 403);
});

test('student cannot start a quiz that is not published', async () => {
  const original = database.Quiz.findByPk;
  database.Quiz.findByPk = async () => ({ id: 'quiz-id', status: 'PENDING_REVIEW', isPublished: false });
  try {
    const result = await invoke(studentController.startQuizAttempt, {
      params: { quizId: 'quiz-id' },
      user: { id: 'student-id', role: 'STUDENT' },
      body: { mode: 'practice' }
    });
    assert.equal(result.error.statusCode, 404);
  } finally {
    database.Quiz.findByPk = original;
  }
});

test('educator with COMPETITIVE type cannot create college quiz', async () => {
  const { validateContributorTrack } = require('../src/middlewares/trackGuard');
  const req = {
    user: { id: 'edu-1', role: 'EDUCATOR', educatorType: 'COMPETITIVE', instituteId: null },
    body: { track: 'COLLEGE', courseId: 'c-1' }
  };
  const result = await new Promise(resolve => validateContributorTrack(req, {}, error => resolve({ error })));
  assert.equal(result.error?.statusCode, 403);
});

test('faculty with instituteId can create college quiz and inherits user instituteId', async () => {
  const { validateContributorTrack } = require('../src/middlewares/trackGuard');
  const originalFindByPk = database.Course.findByPk;
  database.Course.findByPk = async () => ({ id: 'c-1', instituteId: 'inst-1', facultyId: 'fac-1' });
  try {
    const req = {
      user: { id: 'fac-1', role: 'EDUCATOR', educatorType: 'COLLEGE', instituteId: 'inst-1' },
      body: { track: 'COLLEGE', courseId: 'c-1', instituteId: 'spoofed-inst' }
    };
    const result = await new Promise(resolve => validateContributorTrack(req, {}, error => resolve({ error })));
    assert.equal(result.error, undefined);
    assert.equal(req.body.instituteId, 'inst-1');
  } finally {
    database.Course.findByPk = originalFindByPk;
  }
});

test('faculty cannot create content for another institute course', async () => {
  const { validateContributorTrack } = require('../src/middlewares/trackGuard');
  const originalFindByPk = database.Course.findByPk;
  database.Course.findByPk = async () => ({ id: 'c-2', instituteId: 'other-inst', facultyId: 'other-fac' });
  try {
    const req = {
      user: { id: 'fac-1', role: 'EDUCATOR', educatorType: 'COLLEGE', instituteId: 'inst-1' },
      body: { track: 'COLLEGE', courseId: 'c-2' }
    };
    const result = await new Promise(resolve => validateContributorTrack(req, {}, error => resolve({ error })));
    assert.equal(result.error?.statusCode, 403);
  } finally {
    database.Course.findByPk = originalFindByPk;
  }
});

test('student cannot access quizzes for an unregistered competitive exam topic', async () => {
  const originalTopic = database.ExamTopic.findByPk;
  const originalPref = database.UserExamPreference.findOne;
  database.ExamTopic.findByPk = async () => ({
    id: 'topic-gate',
    subject: { edition: { exam: { id: 'exam-gate' } } }
  });
  database.UserExamPreference.findOne = async () => null; // Student has not registered
  try {
    const examController = require('../src/controllers/examController');
    const result = await invoke(examController.listQuizzesByTopic, {
      params: { topicId: 'topic-gate' },
      user: { id: 'student-1', role: 'STUDENT' }
    });
    assert.equal(result.error?.statusCode, 403);
  } finally {
    database.ExamTopic.findByPk = originalTopic;
    database.UserExamPreference.findOne = originalPref;
  }
});