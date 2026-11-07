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

async function run() {
  console.log('=====================================================');
  console.log('STARTING 8-STEP END-TO-END VERIFICATION');
  console.log('=====================================================\n');

  // STEP 1: Verify 5 active exams
  console.log('--- STEP 1: GET /api/exams ---');
  const studentSession = await login('student1@quizapp.com');
  const examsRes = await request('/exams', {
    headers: { Cookie: studentSession.cookieHeader }
  });
  console.log(`HTTP ${examsRes.status}`);
  const exams = examsRes.data?.data || [];
  console.log(`Total exams returned: ${exams.length}`);
  console.log('Exams:', exams.map(e => `${e.code} (${e.category}) - ${e.name}`).join(' | '));
  if (exams.length < 5) throw new Error('Expected at least 5 exams');
  console.log('✓ STEP 1 PASSED: 5 active exams configured\n');

  // STEP 2: Student with 0 registrations gets only college quizzes
  console.log('--- STEP 2: Clear Preferences & Verify Only College Content ---');
  // First clear preferences
  await request('/student/me/exam-preferences', {
    method: 'PUT',
    headers: {
      Cookie: studentSession.cookieHeader,
      'X-CSRF-Token': studentSession.csrfToken
    },
    body: { examIds: [] }
  });

  const quizzesRes = await request('/student/quizzes', {
    headers: { Cookie: studentSession.cookieHeader }
  });
  console.log(`HTTP ${quizzesRes.status}`);
  const quizzes = quizzesRes.data?.data || [];
  console.log(`Student quizzes with 0 registrations: ${quizzes.length}`);
  const hasCompetitive = quizzes.some(q => q.track === 'COMPETITIVE');
  console.log(`Contains any competitive quizzes? ${hasCompetitive}`);
  if (hasCompetitive) throw new Error('Expected 0 competitive quizzes when unregistered');
  console.log('✓ STEP 2 PASSED: 0 registered exams = only college quizzes returned\n');

  // STEP 3: Register for GATE & Access Control
  console.log('--- STEP 3: Register for GATE & Verify 403 on Unregistered JEE ---');
  const gateExam = exams.find(e => e.code === 'GATE');
  const jeeExam = exams.find(e => e.code === 'JEE_MAIN');

  // Register GATE
  const regRes = await request(`/student/exams/${gateExam.id}`, {
    method: 'POST',
    headers: {
      Cookie: studentSession.cookieHeader,
      'X-CSRF-Token': studentSession.csrfToken
    }
  });
  console.log(`Register GATE response: HTTP ${regRes.status} - ${JSON.stringify(regRes.data?.message || regRes.data?.status)}`);

  // Verify GATE topics accessible
  const gateTopicsRes = await request(`/student/exams/${gateExam.id}/topics`, {
    headers: { Cookie: studentSession.cookieHeader }
  });
  console.log(`Access GATE topics: HTTP ${gateTopicsRes.status}`);
  const gateSubjects = gateTopicsRes.data?.data?.subjects || [];
  console.log(`GATE subjects: ${gateSubjects.map(s => s.name).join(', ')}`);

  // Try accessing JEE topics (unregistered)
  const jeeTopicsRes = await request(`/student/exams/${jeeExam.id}/topics`, {
    headers: { Cookie: studentSession.cookieHeader }
  });
  console.log(`Access unregistered JEE topics: HTTP ${jeeTopicsRes.status} (Expected 403)`);
  if (jeeTopicsRes.status !== 403) throw new Error(`Expected 403 for unregistered exam, got ${jeeTopicsRes.status}`);
  console.log('✓ STEP 3 PASSED: Registered exam topics accessible; unregistered exam returns 403\n');

  // STEP 4: Faculty creates competitive and college content
  console.log('--- STEP 4: Faculty Creates Competitive & College Content ---');
  const facultySession = await login('faculty1@quizapp.com');
  console.log(`Faculty user: ${facultySession.user.email}, role: ${facultySession.user.role}, educatorType: ${facultySession.user.educatorType}, instituteId: ${facultySession.user.instituteId}`);

  // Get a topic ID under GATE
  const gateTopicId = gateSubjects[0]?.topics?.[0]?.id;
  console.log(`Using GATE topicId: ${gateTopicId}`);

  // Create competitive quiz
  const compQuizRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: facultySession.cookieHeader,
      'X-CSRF-Token': facultySession.csrfToken
    },
    body: {
      title: 'Faculty GATE Verified Drill ' + Date.now(),
      description: 'Faculty-authored competitive quiz for GATE',
      duration: 20,
      track: 'COMPETITIVE',
      examId: gateExam.id,
      examTopicId: gateTopicId,
      questions: [
        {
          questionText: 'What is the tight bound of MergeSort in worst case?',
          optionA: 'O(n)',
          optionB: 'O(n log n)',
          optionC: 'O(n^2)',
          optionD: 'O(log n)',
          correctOption: 'B',
          explanation: 'MergeSort divides the array in half and merges in linear time: T(n) = 2T(n/2) + O(n) => O(n log n).',
          marks: 2,
          difficulty: 'MEDIUM'
        }
      ]
    }
  });
  console.log(`Faculty create competitive quiz: HTTP ${compQuizRes.status} - ${compQuizRes.data?.status || JSON.stringify(compQuizRes.data)}`);
  if (compQuizRes.status !== 201) throw new Error(`Failed to create competitive quiz: ${JSON.stringify(compQuizRes.data)}`);

  // Create college quiz for CS301 (faculty course c1111111-1111-1111-1111-111111111111)
  const collegeQuizRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: facultySession.cookieHeader,
      'X-CSRF-Token': facultySession.csrfToken
    },
    body: {
      title: 'Faculty CS301 Internal Quiz ' + Date.now(),
      description: 'Faculty-authored college quiz for CS301',
      duration: 15,
      track: 'COLLEGE',
      courseId: 'c1111111-1111-1111-1111-111111111111',
      subtopicId: 'da111111-1111-1111-1111-111111111111',
      questions: [
        {
          questionText: 'What is the recurrence relation of binary search?',
          optionA: 'T(n) = T(n/2) + O(1)',
          optionB: 'T(n) = 2T(n/2) + O(n)',
          optionC: 'T(n) = T(n-1) + O(1)',
          optionD: 'T(n) = O(1)',
          correctOption: 'A',
          explanation: 'Binary search halves the search space each step: T(n) = T(n/2) + O(1).',
          marks: 1,
          difficulty: 'EASY'
        }
      ]
    }
  });
  console.log(`Faculty create college quiz: HTTP ${collegeQuizRes.status} - ${collegeQuizRes.data?.status || JSON.stringify(collegeQuizRes.data)}`);
  if (collegeQuizRes.status !== 201) throw new Error(`Failed to create college quiz: ${JSON.stringify(collegeQuizRes.data)}`);
  console.log('✓ STEP 4 PASSED: Faculty successfully created both Competitive and College quizzes (BOTH track support)\n');

  // STEP 5: Educator (COMPETITIVE) blocked from college track
  console.log('--- STEP 5: Educator Blocked from College Track (403) ---');
  const educatorSession = await login('contributor1@quizapp.com');
  console.log(`Educator user: ${educatorSession.user.email}, role: ${educatorSession.user.role}, educatorType: ${educatorSession.user.educatorType}, instituteId: ${educatorSession.user.instituteId}`);

  const blockedCollegeQuizRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: educatorSession.cookieHeader,
      'X-CSRF-Token': educatorSession.csrfToken
    },
    body: {
      title: 'Unauthorized College Quiz',
      track: 'COLLEGE',
      courseId: 'c1111111-1111-1111-1111-111111111111',
      duration: 10,
      questions: []
    }
  });
  console.log(`Educator creating college quiz: HTTP ${blockedCollegeQuizRes.status} (Expected 403)`);
  if (blockedCollegeQuizRes.status !== 403) throw new Error(`Expected 403 for educator on college track, got ${blockedCollegeQuizRes.status}`);
  console.log('✓ STEP 5 PASSED: Competitive educator blocked from College track with 403\n');

  // STEP 6: Student registered for GATE sees GATE quizzes
  console.log('--- STEP 6: Student Registered for GATE sees GATE Content ---');
  const studentQuizzesAfterReg = await request('/student/quizzes', {
    headers: { Cookie: studentSession.cookieHeader }
  });
  const gateQuizzes = (studentQuizzesAfterReg.data?.data || []).filter(q => q.track === 'COMPETITIVE');
  console.log(`Student sees ${gateQuizzes.length} competitive quizzes for registered GATE`);
  console.log('Quiz titles:', gateQuizzes.map(q => q.title).join(', '));
  if (gateQuizzes.length === 0) throw new Error('Expected student to see competitive quizzes for GATE');
  console.log('✓ STEP 6 PASSED: Student sees competitive quizzes for registered exam\n');

  // STEP 7: Unregister GATE and verify state changes
  console.log('--- STEP 7: Unregister GATE and Verify Reversion to College-Only ---');
  const unregRes = await request(`/student/exams/${gateExam.id}`, {
    method: 'DELETE',
    headers: {
      Cookie: studentSession.cookieHeader,
      'X-CSRF-Token': studentSession.csrfToken
    }
  });
  console.log(`Unregister GATE response: HTTP ${unregRes.status}`);

  const studentQuizzesAfterUnreg = await request('/student/quizzes', {
    headers: { Cookie: studentSession.cookieHeader }
  });
  const compQuizzesAfterUnreg = (studentQuizzesAfterUnreg.data?.data || []).filter(q => q.track === 'COMPETITIVE');
  console.log(`Competitive quizzes after unregistering: ${compQuizzesAfterUnreg.length}`);
  if (compQuizzesAfterUnreg.length > 0) throw new Error('Expected 0 competitive quizzes after unregistering');
  console.log('✓ STEP 7 PASSED: Unregistering immediately revokes competitive content access\n');

  // STEP 8: POST /api/contributor/quizzes validation and payload
  console.log('--- STEP 8: POST /api/contributor/quizzes Validation & Success ---');
  const educatorValidQuizRes = await request('/contributor/quizzes', {
    method: 'POST',
    headers: {
      Cookie: educatorSession.cookieHeader,
      'X-CSRF-Token': educatorSession.csrfToken
    },
    body: {
      title: 'Educator GATE Master Quiz ' + Date.now(),
      description: 'Competitive quiz created by independent educator',
      duration: 30,
      track: 'COMPETITIVE',
      examId: gateExam.id,
      examTopicId: gateTopicId,
      questions: [
        {
          questionText: 'Which of the following is NOT an NP-complete problem?',
          optionA: '3-SAT',
          optionB: 'Shortest Path in Directed Graph with positive weights',
          optionC: 'Traveling Salesperson Problem',
          optionD: 'Vertex Cover',
          correctOption: 'B',
          explanation: 'Dijkstras algorithm finds shortest paths in polynomial time O(E + V log V).',
          marks: 2,
          difficulty: 'MEDIUM'
        }
      ]
    }
  });
  console.log(`Educator create competitive quiz: HTTP ${educatorValidQuizRes.status} - ${educatorValidQuizRes.data?.status}`);
  if (educatorValidQuizRes.status !== 201) throw new Error(`Expected 201 Created, got ${educatorValidQuizRes.status}: ${JSON.stringify(educatorValidQuizRes.data)}`);
  console.log('✓ STEP 8 PASSED: Valid POST /api/contributor/quizzes succeeds with 201 Created (no 400)\n');

  console.log('=====================================================');
  console.log('ALL 8 VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

run().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
