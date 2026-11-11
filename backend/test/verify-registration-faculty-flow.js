const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const cleanBase = BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.replace(/^\/+/, '');
  const fullUrl = `${cleanBase}/${cleanPath}`;
  return new Promise((resolve, reject) => {
    const req = http.request(fullUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, cookies: setCookies, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, cookies: setCookies, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function parseCookie(setCookieHeaders) {
  let cookies = [];
  let csrfToken = '';
  for (const header of setCookieHeaders) {
    const cookie = header.split(';')[0];
    cookies.push(cookie);
    if (cookie.startsWith('csrfToken=')) {
      csrfToken = cookie.split('=')[1];
    }
  }
  return { cookieHeader: cookies.join('; '), csrfToken };
}

async function login(email, password = 'password123') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  const { cookieHeader, csrfToken } = parseCookie(res.cookies);
  return { user: res.data.user, cookieHeader, csrfToken };
}

async function runTests() {
  console.log('======================================================================');
  console.log('VERIFICATION SUITE: REGISTRATION FLOW (STUDENT & FACULTY)');
  console.log('======================================================================\n');

  const ts = Date.now();

  // ── TEST 1: Register New Student ──────────────────────────────────────────
  console.log('--- TEST 1: Register New Student ---');
  const studentEmail = `student_${ts}@example.com`;
  const regStudentRes = await request('/auth/register', {
    method: 'POST',
    body: {
      role: 'student',
      name: 'Alex Johnson',
      email: studentEmail,
      password: 'password123',
      instituteId: 'inst-mit-001'
    }
  });
  console.log(`Register Student Status: HTTP ${regStudentRes.status}`);
  console.log(`Registered User:`, {
    email: regStudentRes.data.user?.email,
    role: regStudentRes.data.user?.role,
    approvalStatus: regStudentRes.data.user?.approvalStatus,
    instituteId: regStudentRes.data.user?.instituteId
  });
  if (regStudentRes.status !== 201) throw new Error(`Expected 201, got ${regStudentRes.status}: ${JSON.stringify(regStudentRes.data)}`);
  if (regStudentRes.data.user?.role !== 'STUDENT') throw new Error(`Expected role STUDENT, got ${regStudentRes.data.user?.role}`);
  if (regStudentRes.data.user?.approvalStatus !== 'APPROVED') throw new Error(`Expected approvalStatus APPROVED, got ${regStudentRes.data.user?.approvalStatus}`);

  // Test student access to dashboard endpoints
  const studentSession = parseCookie(regStudentRes.cookies);
  const studentQuizzesRes = await request('/student/quizzes', {
    headers: { Cookie: studentSession.cookieHeader }
  });
  console.log(`Student accesses /api/student/quizzes: HTTP ${studentQuizzesRes.status} (Results: ${studentQuizzesRes.data?.results})`);
  if (studentQuizzesRes.status !== 200) throw new Error(`Expected 200, got ${studentQuizzesRes.status}`);
  console.log('✓ TEST 1 PASSED: Student registers and logs in immediately without approval\n');

  // ── TEST 2: Register Faculty with Institute (PENDING) -> Approval -> Create Content ──
  console.log('--- TEST 2: Register Faculty with Institute -> 403 When Pending -> Approve -> Create Content ---');
  const facultyEmail = `faculty_${ts}@example.com`;
  const regFacultyRes = await request('/auth/register', {
    method: 'POST',
    body: {
      role: 'faculty',
      name: 'Dr. Robert Oppenheimer',
      email: facultyEmail,
      password: 'password123',
      instituteId: 'inst-mit-001',
      department: 'Theoretical Physics',
      designation: 'Chair Professor',
      employeeId: `EMP-${ts}`
    }
  });
  console.log(`Register Faculty Status: HTTP ${regFacultyRes.status}`);
  console.log(`Registered Faculty:`, {
    email: regFacultyRes.data.user?.email,
    role: regFacultyRes.data.user?.role,
    educatorType: regFacultyRes.data.user?.educatorType,
    approvalStatus: regFacultyRes.data.user?.approvalStatus,
    instituteId: regFacultyRes.data.user?.instituteId
  });
  if (regFacultyRes.status !== 201) throw new Error(`Expected 201, got ${regFacultyRes.status}`);
  if (regFacultyRes.data.user?.approvalStatus !== 'PENDING') throw new Error(`Expected approvalStatus PENDING, got ${regFacultyRes.data.user?.approvalStatus}`);

  const pendingFacultySession = parseCookie(regFacultyRes.cookies);

  // Attempt to create quiz while PENDING
  const pendingQuizAttemptRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: pendingFacultySession.cookieHeader,
      'X-CSRF-Token': pendingFacultySession.csrfToken
    },
    body: {
      title: 'Unauthorized Pending Quiz',
      track: 'COMPETITIVE',
      duration: 15,
      questions: [{ questionText: 'Q1', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'A' }]
    }
  });
  console.log(`Pending faculty creating quiz: HTTP ${pendingQuizAttemptRes.status} - Message: "${pendingQuizAttemptRes.data?.message}"`);
  if (pendingQuizAttemptRes.status !== 403) throw new Error(`Expected 403 for pending faculty, got ${pendingQuizAttemptRes.status}`);

  // Admin approves faculty
  const adminSession = await login('admin@quizapp.com', 'AdminSecurePass2026!');
  const facultyId = regFacultyRes.data.user.id;
  const approveRes = await request(`/admin/faculty/${facultyId}/approve`, {
    method: 'PATCH',
    headers: {
      Cookie: adminSession.cookieHeader,
      'X-CSRF-Token': adminSession.csrfToken
    }
  });
  console.log(`Admin approves faculty: HTTP ${approveRes.status} - Status: ${approveRes.data?.data?.approvalStatus}`);
  if (approveRes.status !== 200 || approveRes.data?.data?.approvalStatus !== 'APPROVED') {
    throw new Error(`Admin approval failed: ${JSON.stringify(approveRes.data)}`);
  }

  // Re-login as approved faculty
  const approvedFacultySession = await login(facultyEmail, 'password123');
  console.log(`Approved faculty logged in: approvalStatus = ${approvedFacultySession.user.approvalStatus}`);

  // Get active exam topic for competitive quiz
  const examsRes = await request('/exams', { headers: { Cookie: adminSession.cookieHeader } });
  const gateExam = examsRes.data.data.find(e => e.code === 'GATE');
  const gateEdition = gateExam?.editions?.[0];
  const gateSubject = gateEdition?.subjects?.[0];
  const gateTopic = gateSubject?.topics?.[0];

  // Faculty creates COMPETITIVE quiz
  const compQuizRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: approvedFacultySession.cookieHeader,
      'X-CSRF-Token': approvedFacultySession.csrfToken
    },
    body: {
      title: `Faculty Physics Competitive Drill ${ts}`,
      description: 'Competitive quiz created by approved faculty',
      duration: 25,
      track: 'COMPETITIVE',
      examId: gateExam.id,
      examTopicId: gateTopic?.id,
      questions: [
        {
          questionText: 'What is the relativistic energy equation?',
          optionA: 'E = mc^2',
          optionB: 'E = hv',
          optionC: 'E = 1/2 mv^2',
          optionD: 'E = mgh',
          correctOption: 'A',
          explanation: 'Einstein relativistic mass-energy equivalence: E=mc^2.',
          marks: 2,
          difficulty: 'MEDIUM'
        }
      ]
    }
  });
  console.log(`Approved faculty creates COMPETITIVE quiz: HTTP ${compQuizRes.status} - ${compQuizRes.data?.status}`);
  if (compQuizRes.status !== 201) throw new Error(`Competitive quiz creation failed: ${JSON.stringify(compQuizRes.data)}`);

  // Faculty creates COLLEGE quiz for their institute course
  const collegeQuizRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: approvedFacultySession.cookieHeader,
      'X-CSRF-Token': approvedFacultySession.csrfToken
    },
    body: {
      title: `Faculty MIT College Internal Quiz ${ts}`,
      description: 'College quiz created by approved faculty',
      duration: 15,
      track: 'COLLEGE',
      courseId: 'c1111111-1111-1111-1111-111111111111',
      subtopicId: 'da111111-1111-1111-1111-111111111111',
      questions: [
        {
          questionText: 'What is the state of a quantum harmonic oscillator ground state?',
          optionA: 'Gaussian wave packet',
          optionB: 'Plane wave',
          optionC: 'Delta function',
          optionD: 'Sinusoid',
          correctOption: 'A',
          explanation: 'The ground state of the quantum harmonic oscillator is a Gaussian wave packet.',
          marks: 1,
          difficulty: 'EASY'
        }
      ]
    }
  });
  console.log(`Approved faculty creates COLLEGE quiz: HTTP ${collegeQuizRes.status} - ${collegeQuizRes.data?.status}`);
  if (collegeQuizRes.status !== 201) throw new Error(`College quiz creation failed: ${JSON.stringify(collegeQuizRes.data)}`);
  console.log('✓ TEST 2 PASSED: Faculty registers as PENDING, gets 403 on content creation, approved by admin, then successfully creates both College & Competitive content\n');

  // ── TEST 3: Register Faculty without Institute -> 400 with Field Error ─────
  console.log('--- TEST 3: Register Faculty Without Institute -> Expect 400 Field Error ---');
  const missingInstRes = await request('/auth/register', {
    method: 'POST',
    body: {
      role: 'faculty',
      name: 'Dr. No Institute',
      email: `no_inst_${ts}@example.com`,
      password: 'password123'
    }
  });
  console.log(`Missing Institute Response: HTTP ${missingInstRes.status} - ${JSON.stringify(missingInstRes.data)}`);
  if (missingInstRes.status !== 400) throw new Error(`Expected 400, got ${missingInstRes.status}`);
  const hasInstituteFieldError = (missingInstRes.data?.errors || []).some(e => e.field === 'instituteId');
  console.log(`Field error on instituteId: ${hasInstituteFieldError}`);
  if (!hasInstituteFieldError) throw new Error('Expected field error on instituteId');
  console.log('✓ TEST 3 PASSED: Registering faculty without an institute returns 400 with field error\n');

  // ── TEST 4: Role Escalation Rejection (admin/educator) ─────────────────────
  console.log('--- TEST 4: Reject Register with role admin or educator ---');
  const adminRegRes = await request('/auth/register', {
    method: 'POST',
    body: {
      role: 'admin',
      name: 'Illegitimate Admin',
      email: `fake_admin_${ts}@example.com`,
      password: 'password123'
    }
  });
  console.log(`Register role 'admin': HTTP ${adminRegRes.status} - ${JSON.stringify(adminRegRes.data?.message)}`);
  if (adminRegRes.status !== 400) throw new Error(`Expected 400 for admin signup attempt, got ${adminRegRes.status}`);

  const educatorRegRes = await request('/auth/register', {
    method: 'POST',
    body: {
      role: 'educator',
      name: 'Direct Educator',
      email: `fake_edu_${ts}@example.com`,
      password: 'password123'
    }
  });
  console.log(`Register role 'educator': HTTP ${educatorRegRes.status} - ${JSON.stringify(educatorRegRes.data?.message)}`);
  if (educatorRegRes.status !== 400) throw new Error(`Expected 400 for educator signup attempt, got ${educatorRegRes.status}`);
  console.log('✓ TEST 4 PASSED: Attempting to register as admin or educator is strictly rejected with 400\n');

  // ── TEST 5: Duplicate Email -> 409 Conflict ────────────────────────────────
  console.log('--- TEST 5: Duplicate Email Returns 409 Conflict ---');
  const duplicateRes = await request('/auth/register', {
    method: 'POST',
    body: {
      role: 'student',
      name: 'Clone User',
      email: 'student1@quizapp.com', // Already registered
      password: 'password123'
    }
  });
  console.log(`Duplicate Email Response: HTTP ${duplicateRes.status} - ${JSON.stringify(duplicateRes.data?.message)}`);
  if (duplicateRes.status !== 409) throw new Error(`Expected 409 Conflict, got ${duplicateRes.status}`);
  console.log('✓ TEST 5 PASSED: Duplicate email correctly returns 409 Conflict\n');

  // ── TEST 6: Demo Credentials for All Roles Still Work ─────────────────────
  console.log('--- TEST 6: Verify Demo Credentials for Student, Educator, Faculty, Admin ---');
  const demoUsers = [
    { role: 'STUDENT', email: 'student1@quizapp.com', pass: 'password123' },
    { role: 'EDUCATOR', email: 'contributor1@quizapp.com', pass: 'password123' },
    { role: 'FACULTY', email: 'faculty1@quizapp.com', pass: 'password123' },
    { role: 'ADMIN', email: 'admin@quizapp.com', pass: 'AdminSecurePass2026!' }
  ];

  for (const demo of demoUsers) {
    const session = await login(demo.email, demo.pass);
    console.log(`Login demo ${demo.role} (${demo.email}): HTTP 200 - User Name: "${session.user.name}", Role: "${session.user.role}", EducatorType: "${session.user.educatorType || 'N/A'}", ApprovalStatus: "${session.user.approvalStatus || 'N/A'}"`);
    if (demo.role === 'FACULTY' && session.user.approvalStatus !== 'APPROVED') {
      throw new Error('Faculty demo account must be pre-approved');
    }
  }
  console.log('✓ TEST 6 PASSED: Demo credentials for all roles successfully authenticate\n');

  console.log('======================================================================');
  console.log('ALL 6 REGISTRATION & FACULTY VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

runTests().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});

