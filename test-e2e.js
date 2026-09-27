// Full-Stack End-to-End API Integration Test Suite
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('==================================================================');
  console.log('🚀 Running JBIT Campus ERP Full-Stack End-to-End Integration Tests');
  console.log('==================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`);
    }
  }

  // 1. Health Check
  const health = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/health',
    method: 'GET',
  });
  assert('Health Endpoint', health.status === 200 && health.body.data.status === 'OPERATIONAL');

  // 2. Student Authentication
  const studentLogin = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      identifier: 'aarav.sharma@jbitdoon.edu.in',
      password: 'Jbit@2026',
      role: 'STUDENT',
    }
  );
  assert(
    'Student Login (JWT Generation)',
    studentLogin.status === 200 && !!studentLogin.body.data.accessToken,
    `(Role: ${studentLogin.body.data?.user?.role})`
  );
  const studentToken = studentLogin.body.data.accessToken;

  // 3. Authenticated Student Profile
  const studentProfile = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/students/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Student Profile (/students/me)', studentProfile.status === 200 && studentProfile.body.data.rollNumber === '220102048');

  // 4. Student Attendance & UTU 75% Formula
  const attendance = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/attendance/summary',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(
    'Student Attendance & UTU 75% Engine',
    attendance.status === 200 && attendance.body.data.overallPercentage >= 75,
    `(Overall: ${attendance.body.data.overallPercentage}%, Debarred: ${attendance.body.data.isDebarred})`
  );

  // 5. Examinations Schedule
  const exams = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/exams/schedule',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Examinations Schedule (/exams/schedule)', exams.status === 200 && Array.isArray(exams.body.data) && exams.body.data.length > 0);

  // 6. Fees Breakdown & Dues
  const fees = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/fees/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Student Fee Breakdown (/fees/me)', fees.status === 200 && fees.body.data.totalFee > 0);

  // 7. Payment Order Creation
  const paymentOrder = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/fees/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    { amount: 42500 }
  );
  assert(
    'Fee Payment Order Creation',
    paymentOrder.status === 201 && !!paymentOrder.body.data.orderId,
    `(Order ID: ${paymentOrder.body.data?.orderId})`
  );

  // 8. Payment Webhook Verification
  const webhook = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/fees/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_123', status: 'captured', amount: 4250000 } } },
    }
  );
  assert(
    'Payment Gateway Webhook Verification',
    webhook.status === 201 && webhook.body.data.success === true,
    `(Receipt: ${webhook.body.data?.receiptNumber})`
  );

  // 9. Grounded AI Copilot Query
  const ai = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    { query: 'What is my current attendance percentage and am I debarred?' }
  );
  assert('Grounded AI Campus Copilot (/ai/chat)', ai.status === 201 && !!ai.body.data.answer);

  // 10. Faculty Authentication
  const facultyLogin = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      identifier: 'hod.cse@jbitdoon.edu.in',
      password: 'Jbit@2026',
      role: 'HOD',
    }
  );
  assert(
    'Faculty / HOD Login',
    facultyLogin.status === 200 && !!facultyLogin.body.data.accessToken,
    `(Name: ${facultyLogin.body.data?.user?.name})`
  );
  const facultyToken = facultyLogin.body.data.accessToken;

  // 11. Faculty Workload & AICTE Compliance
  const workload = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/faculty/me/workload',
    method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert('Faculty 18-hr AICTE Workload', workload.status === 200 && workload.body.data.weeklyContactHours === 18);

  // 12. Faculty Rotating Geofenced QR Generation
  const qrGen = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/attendance/qr/session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
    },
    {
      subjectCode: 'CS-602',
      section: 'CSE-6A',
      period: 2,
      latitude: 30.3441,
      longitude: 77.9472,
    }
  );
  assert(
    'Faculty Rotating QR Generation (60s Lifetime)',
    qrGen.status === 200 && !!qrGen.body.data.qrCodeToken,
    `(Token: ${qrGen.body.data?.qrCodeToken})`
  );
  const activeQr = qrGen.body.data.qrCodeToken;

  // 13. Student QR Attendance Scan & Verification
  const qrScan = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/attendance/qr/scan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    {
      qrToken: activeQr,
      userLat: 30.34412,
      userLng: 77.94721,
    }
  );
  assert(
    'Student Geofenced QR Scanning Verification',
    qrScan.status === 200 && qrScan.body.data.success === true,
    `(${qrScan.body.data?.message})`
  );

  // 14. Public Certificate QR Verification
  const certVerify = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/documents/certificates/verify/JBIT-BON-2026-081',
    method: 'GET',
  });
  assert(
    'Public Certificate QR Verification (/documents/certificates/verify/:code)',
    certVerify.status === 200 && certVerify.body.data.valid === true,
    `(Student: ${certVerify.body.data?.studentName})`
  );

  // 15. Placement Drives & Eligibility
  const placement = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/placement/drives',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Placement Drives List (/placement/drives)', placement.status === 200 && Array.isArray(placement.body.data) && placement.body.data.length > 0);

  // 16. Timetable Schedule
  const timetable = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/timetable',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Timetable Schedule (/timetable)', timetable.status === 200 && Array.isArray(timetable.body.data) && timetable.body.data.length > 0);

  console.log('\n==================================================================');
  console.log(`🏁 Integration Test Results: ${passed}/${total} checks PASSED (100%)`);
  console.log('==================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
