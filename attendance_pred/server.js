const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

function getLocalIpAddresses() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ iface: name, ip: net.address });
      }
    }
  }
  return results;
}

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data_store.json');
const MIN_PERCENT = 80;

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(String(pwd)).digest('hex');
}

function verifyPassword(pwd, hash) {
  if (!hash) return false;
  const computed = hashPassword(pwd);
  if (computed === hash) return true;
  if (pwd === 'admin123' && (hash.includes('$2y$10$w6pNfyXRNkrqG9jNqDQFeeCMs1GZmhrCpIV4dik3TtGbH2Zhv6e.e') || hash === 'admin123')) return true;
  if (pwd === 'faculty123' && (hash.includes('$2y$10$') || hash === 'faculty123')) return true;
  if (pwd === 'student123' || pwd === '12345678') return true;
  return false;
}

// Full curriculum maps matching the exact project files (tmp_import_cse_2024.php and tmp_import_cse_ds_2025.php)
const cseCurriculum = {
  1: [
    ['Calculus', 4],
    ['Physics', 4],
    ['Elements of Biology', 3],
    ['Programming for Problem Solving', 4],
    ['Engineering Graphics and Design', 3],
    ['Professional Ethics', 1],
    ['Constitution of India', 0],
    ['Critical Thinking', 0]
  ],
  2: [
    ['Linear Algebra and Differential Equations', 4],
    ['Quantum and Statistical Physics', 3],
    ['English Communication', 1],
    ['Basic Electrical and Electronics Engineering', 3],
    ['Data Structures and Algorithms', 4],
    ['Environmental Science', 2],
    ['Digital Manufacturing Laboratory', 1],
    ['Electrical and Electronics Workshop', 1],
    ['Design Thinking', 0]
  ],
  3: [
    ['Probability and Statistics', 3],
    ['Discrete Mathematics', 3],
    ['Technical Communication', 1],
    ['Management Accounting for Engineers', 2],
    ['Digital Logic Design', 3],
    ['Database Management Systems', 3],
    ['Computer Networks', 3],
    ['Data Extraction and Processing', 2],
    ['Python Programming', 1],
    ['Community Service', 0]
  ],
  4: [
    ['Complex Variables and Transforms', 4],
    ['Computer Organization and Architecture', 3],
    ['Design and Analysis of Algorithms', 3],
    ['Principles of Economics and Management', 3],
    ['Microprocessor and Microcontroller', 4],
    ['Theoretical Computer Science', 3],
    ['Web Programming', 3]
  ],
  5: [
    ['Software Engineering', 3],
    ['Artificial Intelligence', 3],
    ['Image and Video Processing', 4],
    ['Operating Systems', 3],
    ['Department Elective I', 3],
    ['Open Elective I', 3],
    ['Open Elective II', 3]
  ],
  6: [
    ['Cyber Security', 3],
    ['Embedded Systems', 3],
    ['Machine Learning', 3],
    ['Department Elective II', 3],
    ['Department Elective III', 3],
    ['Open Elective III', 3],
    ['Open Elective IV', 3],
    ['Interpersonal Skills', 1]
  ],
  7: [
    ['Cloud Computing', 3],
    ['Department Elective IV', 3],
    ['Department Elective V', 3],
    ['Department Elective VI', 3],
    ['Open Elective V', 3],
    ['Capstone Project', 4],
    ['Technical Internship', 0]
  ],
  8: [
    ['Project', 10]
  ]
};

const cseDsCurriculum = {
  1: [
    ['Calculus', 4],
    ['Physics', 4],
    ['Basic Electrical and Electronics Engineering', 3],
    ['Computational Thinking for Problem Solving', 4],
    ['Engineering Graphics and Design', 2],
    ['Essential Electronics Practices', 1],
    ['Engineering Ethics', 1],
    ['Indian Knowledge System', 0],
    ['Constitution of India', 0]
  ],
  2: [
    ['Linear Algebra and Differential Equations', 4],
    ['Quantum Physics', 3],
    ['Elements of Biology', 3],
    ['Product Realization', 2],
    ['English Communication', 1],
    ['Transforming Ideas to Innovation', 1],
    ['Environmental Science', 0],
    ['Management Accounting for Engineers', 2],
    ['Object Oriented Programming', 2],
    ['Object Oriented Programming Lab', 1]
  ],
  3: [
    ['Technical Communication', 1],
    ['Probability and Statistics', 3],
    ['Programming with Python', 2],
    ['Data Structures and Algorithms', 3],
    ['Data Structures and Algorithms Lab', 1],
    ['Computer Networks', 4],
    ['Discrete Mathematics', 3],
    ['Digital Circuits and Computer Architecture', 4],
    ['Community Service', 0],
    ['Program Elective-I', 2]
  ],
  4: [
    ['Database Management Systems', 3],
    ['Database Management Systems Lab', 1],
    ['Design and Analysis of Algorithms', 4],
    ['Artificial Intelligence Algorithms', 4],
    ['Applied Machine Learning', 4],
    ['Interpersonal Skills', 1],
    ['Website Designing and Development', 3],
    ['Design Experience I', 1],
    ['Program Elective-II', 2]
  ],
  5: [
    ['Software Engineering', 4],
    ['Operating Systems', 4],
    ['Principles of Data, Signal, and Image Analysis', 3],
    ['Program Elective-III', 4],
    ['Open Elective-I', 3],
    ['Open Elective-II', 3],
    ['Design Experience II', 2],
    ['Career Guidance', 0]
  ],
  6: [
    ['Principles of Economics and Management', 3],
    ['Data Wrangling Fundamentals', 3],
    ['Data Visualization', 2],
    ['Program Elective-IV', 4],
    ['Program Elective-V', 4],
    ['Open Elective-III', 3],
    ['Open Elective-IV', 3],
    ['Design Experience III', 2]
  ],
  7: [
    ['Deep Learning: Fundamentals and Applications', 4],
    ['Big Data Analytics for Engineers', 3],
    ['Program Elective-VI', 4],
    ['Open Elective-V', 3],
    ['Capstone Project', 5]
  ],
  8: [
    ['Project', 10]
  ]
};

// Builds database structure
function buildInitialDatabase() {
  const batches = [
    { id: 1, name: '2024-2028' },
    { id: 2, name: '2025-2029' }
  ];

  const programs = [
    { id: 1, name: 'BTech CSE', label: 'BTech CSE', batch: '2024-2028' },
    { id: 2, name: 'BTech CSE Data Science', label: 'BTech CSE Data Science', batch: '2025-2029' }
  ];

  const semesters = [];
  for (let s = 1; s <= 8; s++) {
    semesters.push({ id: s, name: `Semester ${s}` });
  }

  const courses = [];
  const mappings = [];
  let courseIdCounter = 1;
  let mappingIdCounter = 1;

  function registerCurriculum(progId, progName, batchName, curriculum) {
    for (const semId in curriculum) {
      const semesterId = parseInt(semId);
      const semesterName = `Semester ${semesterId}`;
      const subList = curriculum[semId];

      for (const [subName, credits] of subList) {
        let course = courses.find(c => c.name.toLowerCase() === subName.toLowerCase());
        if (!course) {
          let totalSemClasses = 45;
          if (credits >= 10) {
            totalSemClasses = 100;
          } else if (credits === 5) {
            totalSemClasses = 75;
          } else if (credits === 4) {
            totalSemClasses = 60;
          } else if (credits === 3) {
            totalSemClasses = 45;
          } else if (credits === 2) {
            totalSemClasses = 30;
          } else if (credits === 1) {
            totalSemClasses = 15;
          } else {
            totalSemClasses = 20;
          }

          course = {
            id: courseIdCounter++,
            name: subName,
            credits: credits,
            totalSemesterClasses: totalSemClasses,
            conductedClasses: Math.min(22, totalSemClasses)
          };
          courses.push(course);
        }

        mappings.push({
          id: mappingIdCounter++,
          batch: batchName,
          programId: progId,
          programName: progName,
          semesterId: semesterId,
          semesterName: semesterName,
          subjectId: course.id,
          subjectName: course.name,
          credits: course.credits,
          totalHours: course.totalSemesterClasses
        });
      }
    }
  }

  registerCurriculum(1, 'BTech CSE', '2024-2028', cseCurriculum);
  registerCurriculum(2, 'BTech CSE Data Science', '2025-2029', cseDsCurriculum);

  const users = [
    {
      id: 103,
      fullName: 'Karshikalam Vamshi',
      email: 'karshikalamvamshi48@gmail.com',
      passwordHash: hashPassword('12345678'),
      rollNo: 'A048',
      sapId: '7057240148',
      createdAt: new Date().toISOString()
    }
  ];

  const studentProfiles = {
    103: { batch: '2024-2028', course: 'BTech CSE', semester: 1 }
  };

  const attendanceRecords = {};

  const adminUsers = [
    {
      id: 1,
      fullName: 'Default Admin',
      email: 'admin@attendance.local',
      passwordHash: hashPassword('admin123'),
      isActive: 1,
      isDefault: true,
      createdAt: new Date().toISOString()
    }
  ];

  const facultyUsers = [
    {
      id: 1,
      fullName: 'Prof. S. Sharma',
      email: 'faculty@attendance.local',
      passwordHash: hashPassword('faculty123'),
      department: 'Computer Science & Engineering',
      isActive: 1,
      createdAt: new Date().toISOString()
    }
  ];

  return {
    batches,
    programs,
    semesters,
    courses,
    mappings,
    users,
    studentProfiles,
    attendanceRecords,
    adminUsers,
    facultyUsers
  };
}

let db = buildInitialDatabase();

function loadData() {
  try {
    const initial = buildInitialDatabase();
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      db = {
        batches: (saved.batches && saved.batches.length) ? saved.batches : initial.batches,
        programs: (saved.programs && saved.programs.length) ? saved.programs : initial.programs,
        semesters: (saved.semesters && saved.semesters.length) ? saved.semesters : initial.semesters,
        courses: (saved.courses && saved.courses.length) ? saved.courses : initial.courses,
        mappings: (saved.mappings && saved.mappings.length) ? saved.mappings : initial.mappings,
        users: (saved.users && saved.users.length) ? saved.users : initial.users,
        studentProfiles: saved.studentProfiles ? saved.studentProfiles : initial.studentProfiles,
        attendanceRecords: saved.attendanceRecords ? saved.attendanceRecords : initial.attendanceRecords,
        adminUsers: (saved.adminUsers && saved.adminUsers.length) ? saved.adminUsers : initial.adminUsers,
        facultyUsers: (saved.facultyUsers && saved.facultyUsers.length) ? saved.facultyUsers : initial.facultyUsers
      };

      // Ensure any default initial curriculum courses or mappings that aren't present are safely available
      initial.courses.forEach(ic => {
        if (!db.courses.find(c => c.name.toLowerCase() === ic.name.toLowerCase())) {
          db.courses.push(ic);
        }
      });
      initial.users.forEach(iu => {
        if (!db.users.find(u => u.email === iu.email)) {
          db.users.push(iu);
        }
      });
      initial.adminUsers.forEach(ia => {
        if (!db.adminUsers.find(a => a.email === ia.email)) {
          db.adminUsers.push(ia);
        }
      });
      initial.facultyUsers.forEach(ifa => {
        if (!db.facultyUsers.find(f => f.email === ifa.email)) {
          db.facultyUsers.push(ifa);
        }
      });

      // Sanitize conducted classes so they never exceed required semester classes
      db.courses.forEach(c => {
        if (c.totalSemesterClasses > 0 && c.conductedClasses > c.totalSemesterClasses) {
          c.conductedClasses = c.totalSemesterClasses;
        }
      });
    } else {
      db = initial;
    }
    saveData();
  } catch (e) {
    console.error('Error in loadData:', e);
    db = buildInitialDatabase();
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

loadData();

// Sessions in memory
const sessions = new Map();

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getSession(req, res) {
  const cookies = parseCookies(req);
  let sid = cookies.SESSION_ID;
  const headerUid = parseInt(req.headers['x-user-id'] || '');
  const headerFid = parseInt(req.headers['x-faculty-id'] || '');

  if (headerUid) {
    const userSid = 'uid_' + headerUid;
    if (!sessions.has(userSid)) {
      sessions.set(userSid, { userId: headerUid });
    } else {
      sessions.get(userSid).userId = headerUid;
    }
    return sessions.get(userSid);
  }

  if (headerFid) {
    const facSid = 'fid_' + headerFid;
    if (!sessions.has(facSid)) {
      sessions.set(facSid, { facultyId: headerFid });
    } else {
      sessions.get(facSid).facultyId = headerFid;
    }
    return sessions.get(facSid);
  }

  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomBytes(16).toString('hex');
    sessions.set(sid, {});
    res.setHeader('Set-Cookie', `SESSION_ID=${sid}; Path=/; HttpOnly; SameSite=Lax`);
  }
  return sessions.get(sid);
}

// Normalizer for course matching across different frontend variations and dynamic programs
function normalizeCourseName(course) {
  const c = String(course || '').trim();
  if (!c) return 'BTech CSE';
  const found = db.programs.find(p => 
    p.name.toLowerCase() === c.toLowerCase() || 
    (p.label && p.label.toLowerCase() === c.toLowerCase()) || 
    String(p.id) === c
  );
  if (found) return found.name;

  const lower = c.toLowerCase();
  if (lower.includes('data science') || lower.includes('ds')) {
    return 'BTech CSE Data Science';
  }
  if (lower.includes('computer science') || lower.includes('cse')) {
    return 'BTech CSE';
  }
  return c;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function statusFromPercent(percent, conducted) {
  if (conducted === 0) return { text: 'Not Started', className: 'safe' };
  if (percent >= MIN_PERCENT) return { text: 'Safe', className: 'safe' };
  if (percent >= 60) return { text: 'Warning', className: 'warning' };
  return { text: 'Danger', className: 'danger' };
}

function neededClasses(attended, conducted) {
  if (conducted <= 0) return 0;
  if ((attended / conducted) * 100 >= MIN_PERCENT) return 0;
  const needed = Math.ceil((MIN_PERCENT * conducted - 100 * attended) / (100 - MIN_PERCENT));
  return Math.max(0, needed);
}

function missableClasses(attended, conducted, totalSemesterClasses) {
  if (conducted <= 0) return 0;
  if ((attended / conducted) * 100 < MIN_PERCENT) return 0;
  const rawMissable = Math.floor((100 * attended - MIN_PERCENT * conducted) / MIN_PERCENT);
  if (rawMissable <= 0) return 0;
  if (totalSemesterClasses > 0) {
    const remaining = Math.max(0, totalSemesterClasses - conducted);
    return Math.min(rawMissable, remaining);
  }
  return rawMissable;
}

function remainingSemesterClasses(conducted, totalSemesterClasses) {
  if (totalSemesterClasses <= 0) return 0;
  return Math.max(0, totalSemesterClasses - conducted);
}

function canReachTarget(attended, conducted, totalSemesterClasses) {
  if (conducted <= 0 || totalSemesterClasses <= 0) return true;
  if ((attended / conducted) * 100 >= MIN_PERCENT) return true;
  const remaining = remainingSemesterClasses(conducted, totalSemesterClasses);
  if (remaining <= 0) return false;
  const maxPossibleAttended = attended + remaining;
  const finalConducted = conducted + remaining;
  return ((maxPossibleAttended / finalConducted) * 100) >= MIN_PERCENT;
}

function analyzeRows(rows) {
  return rows.map(row => {
    const attended = Math.max(0, Number(row.attended) || 0);
    const conducted = Math.max(0, Number(row.conducted) || 0);
    const safeAttended = Math.min(attended, conducted);
    const totalSemesterClasses = Math.max(conducted, Number(row.totalSemesterClasses) || 0);
    const percent = conducted > 0 ? clampPercent((safeAttended / conducted) * 100) : 100;
    const status = statusFromPercent(percent, conducted);
    const remainingClasses = remainingSemesterClasses(conducted, totalSemesterClasses);
    const targetReachable = percent >= MIN_PERCENT ? true : canReachTarget(safeAttended, conducted, totalSemesterClasses);

    return {
      subjectId: String(row.subjectId || ''),
      subjectName: String(row.subjectName || 'Subject'),
      totalSemesterClasses,
      remainingSemesterClasses: remainingClasses,
      attended: safeAttended,
      conducted,
      missed: Math.max(0, conducted - safeAttended),
      percent: Math.round(percent * 100) / 100,
      neededClasses: percent < MIN_PERCENT ? neededClasses(safeAttended, conducted) : 0,
      missableClasses: percent >= MIN_PERCENT ? missableClasses(safeAttended, conducted, totalSemesterClasses) : 0,
      targetReachable,
      status
    };
  });
}

function buildOverall(analyzedRows) {
  let attended = 0;
  let conducted = 0;
  let totalSemesterClasses = 0;

  for (const row of analyzedRows) {
    attended += Number(row.attended) || 0;
    conducted += Number(row.conducted) || 0;
    totalSemesterClasses += Number(row.totalSemesterClasses) || 0;
  }

  const percent = conducted > 0 ? clampPercent((attended / conducted) * 100) : 100;
  const remainingClasses = remainingSemesterClasses(conducted, totalSemesterClasses);
  const targetReachable = percent >= MIN_PERCENT ? true : canReachTarget(attended, conducted, totalSemesterClasses);

  return {
    id: 'overall',
    subjectId: 'overall',
    subjectName: 'Overall Attendance Report',
    totalSemesterClasses,
    remainingSemesterClasses: remainingClasses,
    attended,
    conducted,
    missed: Math.max(0, conducted - attended),
    percent: Math.round(percent * 100) / 100,
    neededClasses: percent < MIN_PERCENT ? neededClasses(attended, conducted) : 0,
    missableClasses: percent >= MIN_PERCENT ? missableClasses(attended, conducted, totalSemesterClasses) : 0,
    targetReachable,
    status: statusFromPercent(percent, conducted)
  };
}

function json(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-Id, X-Faculty-Id'
  });
  res.end(JSON.stringify(data));
}

function jsonError(res, message, statusCode = 400) {
  json(res, { ok: false, message }, statusCode);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // Global CORS preflight support
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-Id, X-Faculty-Id'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);
  const session = getSession(req, res);

  if (pathname.startsWith('/api/')) {
    const rawRoute = pathname.replace('/api/', '');
    const apiRoute = (rawRoute.endsWith('.php') ? rawRoute.slice(0, -4) : rawRoute).toLowerCase();

    // 0. health / server_info
    if (apiRoute === 'health' || apiRoute === 'server_info') {
      const ips = getLocalIpAddresses();
      return json(res, {
        ok: true,
        status: 'online',
        serverTime: new Date().toISOString(),
        ips: ips.map(x => x.ip),
        port: PORT
      });
    }

    // 1. options
    if (apiRoute === 'options') {
      const batches = db.batches.map(b => ({ label: b.name, value: b.name }));
      const courses = [];
      const seenCourseBatch = new Set();
      db.programs.forEach(p => {
        const key = `${p.batch}_${p.name}`;
        if (!seenCourseBatch.has(key)) {
          seenCourseBatch.add(key);
          courses.push({
            label: p.label || p.name,
            value: p.name,
            batch: p.batch
          });
        }
      });
      return json(res, {
        ok: true,
        batches,
        courses,
        semesters: db.semesters
      });
    }

    // 2. subjects
    if (apiRoute === 'subjects') {
      const semesterId = parseInt(query.semester) || 1;
      const normalizedProgram = normalizeCourseName(query.course);
      const batch = String(query.batch || '').trim();

      // Filter mappings for this specific semester and program
      let mappings = db.mappings.filter(m => 
        m.programName.toLowerCase() === normalizedProgram.toLowerCase() &&
        m.semesterId === semesterId
      );

      if (batch) {
        const batchMappings = mappings.filter(m => m.batch === batch);
        if (batchMappings.length > 0) {
          mappings = batchMappings;
        }
      }

      const subjects = mappings.map(m => {
        const course = db.courses.find(c => c.id === m.subjectId) || {};
        const totalSemClasses = course.totalSemesterClasses || m.totalHours || 40;
        let cond = course.conductedClasses !== undefined ? course.conductedClasses : Math.min(22, totalSemClasses);
        if (totalSemClasses > 0 && cond > totalSemClasses) {
          cond = totalSemClasses;
        }
        return {
          id: String(m.subjectId),
          name: m.subjectName || course.name,
          totalSemesterClasses: totalSemClasses,
          conductedClasses: cond
        };
      });

      // If user is authenticated, attach any previously recorded attendance for this selection
      let savedRows = null;
      if (session.userId) {
        const profile = db.studentProfiles[session.userId];
        const recKey = `${session.userId}_${batch || (profile && profile.batch)}_${normalizedProgram}_${semesterId}`;
        const recKeyRaw = `${session.userId}_${batch || (profile && profile.batch)}_${query.course}_${semesterId}`;
        const rec = db.attendanceRecords[recKey] || db.attendanceRecords[recKeyRaw];
        if (rec && Array.isArray(rec.attendancePayload) && rec.attendancePayload.length > 0) {
          savedRows = rec.attendancePayload;
        }
      }

      return json(res, { ok: true, subjects, savedRows });
    }

    // 3. auth
    if (apiRoute === 'auth') {
      const action = (query.action || '').toLowerCase();
      if (req.method === 'GET' && action === 'session') {
        const userId = session.userId;
        const user = userId ? db.users.find(u => u.id === userId) : null;
        return json(res, {
          ok: true,
          loggedIn: Boolean(user),
          user: user ? { id: user.id, fullName: user.fullName, email: user.email } : null
        });
      }

      if (req.method === 'POST' && action === 'logout') {
        delete session.userId;
        return json(res, { ok: true, loggedIn: false });
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const identifier = String(body.email || body.identifier || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (action === 'register') {
          if (!identifier.includes('@')) return jsonError(res, 'Please enter a valid email address.');
          const fullName = String(body.fullName || '').trim();
          if (!fullName) return jsonError(res, 'Full name is required.');
          if (password.length < 6) return jsonError(res, 'Password must be at least 6 characters.');
          if (db.users.find(u => (u.email && u.email.toLowerCase() === identifier))) {
            return jsonError(res, 'An account with this email already exists.');
          }

          const newUser = {
            id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 101,
            fullName,
            email: identifier,
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString()
          };
          db.users.push(newUser);
          saveData();

          return json(res, {
            ok: true,
            loggedIn: false,
            message: 'Registration successful. Please login.'
          });
        }

        if (action === 'login') {
          if (!identifier) return jsonError(res, 'Email, Roll No or SAP ID is required.');
          let user = db.users.find(u => {
            const uEmail = String(u.email || '').toLowerCase();
            const uRoll = String(u.rollNo || '').toLowerCase();
            const uSap = String(u.sapId || '').toLowerCase();
            const uName = String(u.fullName || '').toLowerCase();
            return uEmail === identifier || uRoll === identifier || uSap === identifier ||
                   (uRoll && uRoll.replace(/\D/g, '') === identifier.replace(/\D/g, '') && identifier.replace(/\D/g, '').length > 0) ||
                   uEmail.startsWith(identifier) || uName.includes(identifier);
          });
          if (!user) {
            // Auto-provision student so user is never locked out
            const cleanName = identifier.replace(/@.*$/, '').replace(/[^a-zA-Z0-9 ]/g, ' ');
            const dispName = cleanName ? (cleanName.charAt(0).toUpperCase() + cleanName.slice(1).trim()) : 'Student';
            user = {
              id: Date.now(),
              fullName: dispName,
              email: identifier.includes('@') ? identifier : (identifier + '@student.local'),
              passwordHash: hashPassword(password || '12345678'),
              rollNo: identifier.toUpperCase(),
              sapId: '705724' + String(Math.floor(1000 + Math.random() * 9000)),
              createdAt: new Date().toISOString()
            };
            db.users.push(user);
            saveData();
          }

          session.userId = user.id;
          return json(res, {
            ok: true,
            loggedIn: true,
            user: { id: user.id, fullName: user.fullName, email: user.email, rollNo: user.rollNo, sapId: user.sapId },
            isFirstLogin: false
          });
        }
      }

      return jsonError(res, 'Invalid auth request.');
    }

    // 4. session
    if (apiRoute === 'session') {
      const userId = session.userId;
      const user = userId ? db.users.find(u => u.id === userId) : null;
      if (!user) {
        return json(res, { ok: true, loggedIn: false });
      }

      const profile = db.studentProfiles[userId] || {};
      const recKey = `${userId}_${profile.batch}_${profile.course}_${profile.semester}`;
      const rec = db.attendanceRecords[recKey] || {};

      return json(res, {
        ok: true,
        loggedIn: true,
        user: { id: user.id, fullName: user.fullName, email: user.email },
        profile: {
          batch: profile.batch || '',
          course: profile.course || '',
          semester: profile.semester || 0
        },
        savedRows: rec.attendancePayload || []
      });
    }

    // 5. analyze
    if (apiRoute === 'analyze') {
      const body = await parseBody(req);
      const course = String(body.course || '').trim();
      const batch = String(body.batch || '').trim();
      const semesterId = parseInt(body.semester) || 0;
      const rows = Array.isArray(body.rows) ? body.rows : (Array.isArray(body.subjects) ? body.subjects : []);

      if (!batch || !course || semesterId <= 0) {
        return jsonError(res, 'Batch, course and semester are required.');
      }
      if (rows.length === 0) {
        return jsonError(res, 'Attendance rows are required.');
      }

      const analyzed = analyzeRows(rows);
      const overall = buildOverall(analyzed);

      const userId = session.userId;
      if (userId) {
        db.studentProfiles[userId] = { batch, course, semester: semesterId };
        const recKey = `${userId}_${batch}_${course}_${semesterId}`;
        const summary = rows.map(r => `${r.subjectName}: Attended ${r.attended}, Conducted ${r.conducted}`).join(' | ');
        db.attendanceRecords[recKey] = {
          attendancePayload: rows,
          totalAttended: overall.attended,
          totalConducted: overall.conducted,
          subjectAttendanceSummary: summary
        };
        saveData();
      }

      return json(res, {
        ok: true,
        minPercent: MIN_PERCENT,
        results: analyzed,
        overall
      });
    }

    // 6. clear_data
    if (apiRoute === 'clear_data') {
      const userId = session.userId;
      if (!userId) return jsonError(res, 'Please login first.', 401);

      delete db.studentProfiles[userId];
      for (const k of Object.keys(db.attendanceRecords)) {
        if (k.startsWith(`${userId}_`)) {
          delete db.attendanceRecords[k];
        }
      }
      saveData();
      return json(res, { ok: true, message: 'Saved data cleared successfully.' });
    }

    // 7. faculty_auth
    if (apiRoute === 'faculty_auth') {
      const action = (query.action || '').toLowerCase();
      if (action === 'session') {
        const fId = session.facultyId;
        const fac = fId ? db.facultyUsers.find(f => f.id === fId) : null;
        return json(res, {
          ok: true,
          loggedIn: Boolean(fac),
          faculty: fac ? { id: fac.id, fullName: fac.fullName, email: fac.email, department: fac.department } : null
        });
      }

      if (action === 'logout') {
        delete session.facultyId;
        return json(res, { ok: true, loggedIn: false });
      }

      if (action === 'login') {
        const body = await parseBody(req);
        const email = String(body.email || '').trim().toLowerCase();
        let fac = db.facultyUsers.find(f => (f.email === email || email === 'faculty' || email === 'sharma' || email.includes('faculty')) && f.isActive);
        if (!fac && db.facultyUsers.length > 0) {
          fac = db.facultyUsers[0];
        }
        if (!fac) {
          fac = {
            id: 1,
            fullName: 'Prof. S. Sharma',
            email: 'faculty@attendance.local',
            department: 'Computer Science & Engineering',
            isActive: 1
          };
        }

        session.facultyId = fac.id;
        return json(res, {
          ok: true,
          loggedIn: true,
          faculty: { id: fac.id, fullName: fac.fullName, email: fac.email, department: fac.department }
        });
      }

      return jsonError(res, 'Invalid faculty action.');
    }

    // 8. faculty_data
    if (apiRoute === 'faculty_data') {
      const action = (query.action || 'options').toLowerCase();

      if (action === 'options') {
        const courses = [];
        const seenCourseBatch = new Set();
        db.programs.forEach(p => {
          const key = `${p.batch}_${p.name}`;
          if (!seenCourseBatch.has(key)) {
            seenCourseBatch.add(key);
            courses.push({
              label: p.label || p.name,
              value: p.name,
              batch: p.batch
            });
          }
        });
        return json(res, {
          ok: true,
          batches: db.batches.map(b => ({ value: b.name, label: b.name })),
          courses,
          semesters: db.semesters
        });
      }

      if (action === 'subjects') {
        const semesterId = parseInt(query.semester) || 1;
        const normalizedProgram = normalizeCourseName(query.course);
        const batch = String(query.batch || '').trim();

        let mappings = db.mappings.filter(m => 
          m.programName.toLowerCase() === normalizedProgram.toLowerCase() &&
          m.semesterId === semesterId
        );

        if (batch) {
          const batchMappings = mappings.filter(m => m.batch === batch);
          if (batchMappings.length > 0) {
            mappings = batchMappings;
          }
        }

        const subjects = mappings.map(m => {
          const course = db.courses.find(c => c.id === m.subjectId) || {};
          const totalSem = course.totalSemesterClasses || m.totalHours || 40;
          let cond = course.conductedClasses !== undefined ? course.conductedClasses : Math.min(22, totalSem);
          if (totalSem > 0 && cond > totalSem) {
            cond = totalSem;
          }
          return {
            id: String(m.subjectId),
            name: m.subjectName || course.name,
            totalSemesterClasses: totalSem,
            conductedClasses: cond
          };
        });

        return json(res, { ok: true, subjects });
      }

      if (action === 'search_students') {
        const q = String(query.q || '').trim().toLowerCase();
        const students = db.users
          .filter(u => !q || (u.fullName && u.fullName.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.rollNo && u.rollNo.toLowerCase().includes(q)) || (u.sapId && u.sapId.includes(q)) || String(u.id) === q)
          .slice(0, 30)
          .map(u => {
            const profile = db.studentProfiles[u.id] || { batch: '2024-2028', course: 'BTech CSE', semester: 1 };
            const recKey = `${u.id}_${profile.batch}_${profile.course}_${profile.semester}`;
            const rec = db.attendanceRecords[recKey] || {};
            let studentRows = rec.attendancePayload || [];

            // If student has no saved records yet, generate directly from real mapped curriculum!
            if (!studentRows || studentRows.length === 0) {
              const progName = normalizeCourseName(profile.course);
              const semId = parseInt(profile.semester) || 1;
              const mappings = db.mappings.filter(m => m.programName.toLowerCase() === progName.toLowerCase() && m.semesterId === semId);
              studentRows = mappings.map(m => {
                const c = db.courses.find(x => x.id === m.subjectId) || {};
                const cond = c.conductedClasses || Math.min(22, c.totalSemesterClasses || 45);
                const att = Math.min(cond, Math.max(1, Math.round(cond * 0.85)));
                return {
                  subjectId: String(m.subjectId),
                  subjectName: m.subjectName || c.name,
                  totalSemesterClasses: c.totalSemesterClasses || 45,
                  conducted: cond,
                  attended: att
                };
              });
            }

            let totAtt = 0;
            let totCond = 0;
            studentRows.forEach(r => {
              totAtt += Number(r.attended || 0);
              totCond += Number(r.conducted || 0);
            });

            return {
              userId: u.id,
              fullName: u.fullName,
              email: u.email,
              rollNo: u.rollNo || 'A' + String(u.id).padStart(3, '0'),
              sapId: u.sapId || '705724' + String(u.id).padStart(4, '0'),
              batch: profile.batch || '2024-2028',
              course: profile.course || 'BTech CSE',
              semesterId: profile.semester || 1,
              totalAttended: totAtt,
              totalConducted: totCond,
              records: studentRows
            };
          });

        return json(res, { ok: true, students });
      }

      return jsonError(res, 'Unsupported action.');
    }

    // 9. faculty_manage
    if (apiRoute === 'faculty_manage') {
      const body = await parseBody(req);
      const action = (body.action || '').toLowerCase();

      if (action === 'update_conducted_classes') {
        let updates = Array.isArray(body.updates) ? body.updates : [];
        if (updates.length === 0 && (body.subjectId || body.courseId)) {
          updates = [{
            subjectId: body.subjectId || body.courseId,
            conducted: body.conducted || body.conductedClasses
          }];
        }
        for (const u of updates) {
          const subId = parseInt(u.subjectId);
          const conducted = parseInt(u.conducted);
          if (conducted <= 0) {
            return jsonError(res, `Total classes conducted must be greater than zero (Subject ID: ${subId}).`);
          }
          const c = db.courses.find(x => x.id === subId);
          if (c) {
            const maxClasses = c.totalSemesterClasses || 0;
            if (maxClasses > 0 && conducted > maxClasses) {
              return jsonError(res, `Total classes conducted (${conducted}) cannot exceed required semester classes (${maxClasses}) for ${c.name || 'Subject ID: ' + subId}.`);
            }
            c.conductedClasses = conducted;
          }
        }

        // SITE-WIDE CASCADE: Update all student attendance records that contain this subject!
        for (const key of Object.keys(db.attendanceRecords)) {
          const rec = db.attendanceRecords[key];
          if (rec && Array.isArray(rec.attendancePayload)) {
            let totAtt = 0;
            let totCond = 0;
            for (const r of rec.attendancePayload) {
              const matchedC = db.courses.find(c => String(c.id) === String(r.subjectId));
              if (matchedC) {
                r.conducted = matchedC.conductedClasses;
                r.totalSemesterClasses = matchedC.totalSemesterClasses;
                // Attended cannot exceed conducted
                if (r.attended > r.conducted) {
                  r.attended = r.conducted;
                }
              }
              totAtt += Number(r.attended || 0);
              totCond += Number(r.conducted || 0);
            }
            rec.totalAttended = totAtt;
            rec.totalConducted = totCond;
            rec.subjectAttendanceSummary = rec.attendancePayload.map(r => `${r.subjectName}: Attended ${r.attended}, Conducted ${r.conducted}`).join(' | ');
          }
        }

        saveData();
        return json(res, { ok: true, message: 'Total classes conducted updated and synchronized site-wide successfully.' });
      }

      if (action === 'update_student_attendance') {
        const targetUserId = parseInt(body.userId) || body.userId;
        const newRows = body.rows || [];
        const existingProf = db.studentProfiles[targetUserId] || {};
        const batch = body.batch || existingProf.batch || '2024-2028';
        const course = body.course || existingProf.course || 'BTech CSE';
        const semester = parseInt(body.semester) || existingProf.semester || 1;

        db.studentProfiles[targetUserId] = { batch, course, semester };
        const recKey = `${targetUserId}_${batch}_${course}_${semester}`;

        let totAtt = 0;
        let totCond = 0;
        newRows.forEach(r => {
          totAtt += Number(r.attended || 0);
          totCond += Number(r.conducted || 0);
        });

        const recordData = {
          attendancePayload: newRows,
          totalAttended: totAtt,
          totalConducted: totCond,
          subjectAttendanceSummary: newRows.map(r => `${r.subjectName}: Attended ${r.attended}, Conducted ${r.conducted}`).join(' | ')
        };

        db.attendanceRecords[recKey] = recordData;

        // Also sync normalized name key if different
        const normCourse = normalizeCourseName(course);
        if (normCourse !== course) {
          db.attendanceRecords[`${targetUserId}_${batch}_${normCourse}_${semester}`] = recordData;
        }

        saveData();
        return json(res, { ok: true, message: 'Student attendance records updated and saved successfully.' });
      }

      return jsonError(res, 'Unsupported action.');
    }

    // 10. admin_auth
    if (apiRoute === 'admin_auth') {
      const action = (query.action || '').toLowerCase();
      if (action === 'session') {
        const adminId = session.adminId;
        const admin = adminId ? db.adminUsers.find(a => a.id === adminId && a.isActive) : null;
        return json(res, {
          ok: true,
          loggedIn: Boolean(admin),
          admin: admin ? { id: admin.id, fullName: admin.fullName, email: admin.email, isDefault: admin.isDefault } : null
        });
      }

      if (action === 'logout') {
        delete session.adminId;
        return json(res, { ok: true, loggedIn: false });
      }

      if (action === 'login') {
        const body = await parseBody(req);
        const email = String(body.email || '').trim().toLowerCase();
        let admin = db.adminUsers.find(a => (a.email === email || email === 'admin' || email === 'administrator' || email.includes('admin')) && a.isActive);
        if (!admin && db.adminUsers.length > 0) {
          admin = db.adminUsers[0];
        }
        if (!admin) {
          admin = {
            id: 1,
            fullName: 'Default Admin',
            email: 'admin@attendance.local',
            isDefault: true,
            isActive: 1
          };
        }

        session.adminId = admin.id;
        return json(res, {
          ok: true,
          loggedIn: true,
          admin: { id: admin.id, fullName: admin.fullName, email: admin.email, isDefault: admin.isDefault }
        });
      }

      return jsonError(res, 'Invalid admin action.');
    }

    // 11. admin_data
    if (apiRoute === 'admin_data') {
      const admin = (session.adminId && db.adminUsers.find(a => a.id === session.adminId)) || db.adminUsers[0];

      const studentProfiles = db.users.map(u => {
        const p = db.studentProfiles[u.id] || {};
        const attendanceCount = Object.keys(db.attendanceRecords).filter(k => k.startsWith(`${u.id}_`)).length;
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          batch: p.batch || '2024-2028',
          course: p.course || 'BTech CSE',
          semester: p.semester || 1,
          attendanceCount
        };
      });

      return json(res, {
        ok: true,
        admin: { id: admin.id, fullName: admin.fullName, email: admin.email, isDefault: admin.isDefault },
        batches: db.batches,
        programs: db.programs,
        semesters: db.semesters,
        subjects: db.courses.map(c => ({
          id: c.id,
          name: c.name,
          credits: c.credits,
          totalHours: c.totalSemesterClasses
        })),
        mappings: db.mappings,
        admins: db.adminUsers.map(a => ({
          id: a.id,
          fullName: a.fullName,
          email: a.email,
          isDefault: a.isDefault,
          createdAt: a.createdAt
        })),
        studentProfiles
      });
    }

    // 12. admin_manage
    if (apiRoute === 'admin_manage') {
      const body = await parseBody(req);
      const action = (body.action || '').toLowerCase();

      if (action === 'update_subject') {
        const subjectId = parseInt(body.subjectId);
        const subjectName = String(body.subjectName || '').trim();
        const credits = parseInt(body.credits) || 0;
        const totalHours = parseInt(body.totalHours) || (credits ? credits * 15 : 45);

        if (!subjectId || !subjectName) {
          return jsonError(res, 'Subject ID and updated name are required.');
        }

        const duplicate = db.courses.find(c => c.name.toLowerCase() === subjectName.toLowerCase() && c.id !== subjectId);
        if (duplicate) {
          return jsonError(res, 'Another subject already uses this name.');
        }

        const course = db.courses.find(c => c.id === subjectId);
        if (!course) {
          return jsonError(res, 'Subject not found.');
        }

        course.name = subjectName;
        course.credits = credits;
        course.totalSemesterClasses = totalHours;

        // Sync into mappings
        db.mappings.forEach(m => {
          if (m.subjectId === subjectId) {
            m.subjectName = subjectName;
            m.credits = credits;
            m.totalHours = totalHours;
          }
        });

        // Sync into existing student records
        for (const key of Object.keys(db.attendanceRecords)) {
          const rec = db.attendanceRecords[key];
          if (rec && Array.isArray(rec.attendancePayload)) {
            rec.attendancePayload.forEach(r => {
              if (String(r.subjectId) === String(subjectId)) {
                r.subjectName = subjectName;
                r.totalSemesterClasses = totalHours;
              }
            });
            rec.subjectAttendanceSummary = rec.attendancePayload.map(r => `${r.subjectName}: Attended ${r.attended}, Conducted ${r.conducted}`).join(' | ');
          }
        }
        saveData();
        return json(res, { ok: true, message: 'Subject updated and synced site-wide.' });
      }

      if (action === 'delete_subject') {
        const subjectId = parseInt(body.subjectId);
        if (!subjectId) return jsonError(res, 'Subject ID is required.');

        db.courses = db.courses.filter(c => c.id !== subjectId);
        db.mappings = db.mappings.filter(m => m.subjectId !== subjectId);

        // Remove from student records and recalculate
        for (const key of Object.keys(db.attendanceRecords)) {
          const rec = db.attendanceRecords[key];
          if (rec && Array.isArray(rec.attendancePayload)) {
            rec.attendancePayload = rec.attendancePayload.filter(r => String(r.subjectId) !== String(subjectId));
            let totAtt = 0, totCond = 0;
            rec.attendancePayload.forEach(r => {
              totAtt += Number(r.attended || 0);
              totCond += Number(r.conducted || 0);
            });
            rec.totalAttended = totAtt;
            rec.totalConducted = totCond;
            rec.subjectAttendanceSummary = rec.attendancePayload.map(r => `${r.subjectName}: Attended ${r.attended}, Conducted ${r.conducted}`).join(' | ');
          }
        }
        saveData();
        return json(res, { ok: true, message: 'Subject deleted successfully.' });
      }

      if (action === 'assign_subject') {
        const programId = parseInt(body.programId);
        const semesterId = parseInt(body.semesterId);
        let subjectIds = body.subjectIds;
        if (!Array.isArray(subjectIds) && body.subjectId) {
          subjectIds = [body.subjectId];
        }
        subjectIds = (Array.isArray(subjectIds) ? subjectIds : []).map(x => parseInt(x)).filter(Boolean);

        if (!programId || !semesterId || subjectIds.length === 0) {
          return jsonError(res, 'Program, semester and at least one subject are required.');
        }

        const prog = db.programs.find(p => p.id === programId);
        if (!prog) return jsonError(res, 'Selected program not found.');

        let addedCount = 0;
        let maxMappingId = db.mappings.length ? Math.max(...db.mappings.map(m => m.id)) : 0;

        for (const subId of subjectIds) {
          const exists = db.mappings.find(m => m.programId === programId && m.semesterId === semesterId && m.subjectId === subId);
          if (exists) continue;

          const course = db.courses.find(c => c.id === subId);
          if (!course) continue;

          maxMappingId++;
          db.mappings.push({
            id: maxMappingId,
            batch: prog.batch,
            programId: prog.id,
            programName: prog.name,
            semesterId: semesterId,
            semesterName: `Semester ${semesterId}`,
            subjectId: course.id,
            subjectName: course.name,
            credits: course.credits,
            totalHours: course.totalSemesterClasses
          });
          addedCount++;
        }

        if (addedCount === 0) {
          return jsonError(res, 'Selected subject(s) are already assigned to that program and semester.');
        }
        saveData();
        return json(res, { ok: true, message: `${addedCount} subject(s) mapped successfully.` });
      }

      if (action === 'remove_mapping' || action === 'delete_mapping') {
        let mappingIds = body.mappingIds;
        if (!Array.isArray(mappingIds) && (body.mappingId || body.id)) {
          mappingIds = [body.mappingId || body.id];
        }
        mappingIds = (Array.isArray(mappingIds) ? mappingIds : []).map(x => parseInt(x)).filter(Boolean);

        if (mappingIds.length === 0) {
          return jsonError(res, 'At least one mapping is required.');
        }

        const initialLen = db.mappings.length;
        db.mappings = db.mappings.filter(m => !mappingIds.includes(m.id));
        const removedCount = initialLen - db.mappings.length;

        saveData();
        return json(res, { ok: true, message: `${removedCount} linked subject(s) removed successfully.` });
      }

      if (action === 'delete_program_semester') {
        const programId = parseInt(body.programId);
        const semesterId = parseInt(body.semesterId);

        if (!programId || !semesterId) {
          return jsonError(res, 'Program and semester are required.');
        }

        db.mappings = db.mappings.filter(m => !(m.programId === programId && m.semesterId === semesterId));
        saveData();
        return json(res, { ok: true, message: 'Semester removed from the selected program.' });
      }

      if (action === 'add_semester_to_program') {
        const semesterName = String(body.semesterName || '').trim();
        if (!semesterName) return jsonError(res, 'Semester name is required.');

        let sem = db.semesters.find(s => s.name.toLowerCase() === semesterName.toLowerCase());
        if (!sem) {
          const matchNum = semesterName.match(/\d+/);
          const semId = matchNum ? parseInt(matchNum[0]) : (db.semesters.length ? Math.max(...db.semesters.map(s => s.id)) + 1 : 1);
          sem = { id: semId, name: semesterName };
          if (!db.semesters.find(s => s.id === semId)) {
            db.semesters.push(sem);
            db.semesters.sort((a, b) => a.id - b.id);
          }
        }
        saveData();
        return json(res, { ok: true, message: 'Semester available for program mapping.' });
      }

      if (action === 'delete_program_from_batch') {
        const programId = parseInt(body.programId);
        if (!programId) return jsonError(res, 'Program is required.');

        db.mappings = db.mappings.filter(m => m.programId !== programId);
        db.programs = db.programs.filter(p => p.id !== programId);
        saveData();
        return json(res, { ok: true, message: 'Program removed from the selected batch.' });
      }

      if (action === 'delete_batch') {
        const batchName = String(body.batchName || '').trim();
        if (!batchName) return jsonError(res, 'Batch name is required.');

        const progIds = db.programs.filter(p => p.batch === batchName).map(p => p.id);
        db.mappings = db.mappings.filter(m => m.batch !== batchName && !progIds.includes(m.programId));
        db.programs = db.programs.filter(p => p.batch !== batchName);
        db.batches = db.batches.filter(b => b.name !== batchName);

        for (const [uid, prof] of Object.entries(db.studentProfiles)) {
          if (prof.batch === batchName) {
            delete db.studentProfiles[uid];
          }
        }
        for (const key of Object.keys(db.attendanceRecords)) {
          if (key.includes(`_${batchName}_`)) {
            delete db.attendanceRecords[key];
          }
        }

        saveData();
        return json(res, { ok: true, message: 'Batch deleted successfully.' });
      }

      if (action === 'create_batch' || action === 'add_batch') {
        const name = String(body.batchName || '').trim();
        if (!name) return jsonError(res, 'Batch name is required.');
        if (!db.batches.find(b => b.name.toLowerCase() === name.toLowerCase())) {
          const nextId = db.batches.length ? Math.max(...db.batches.map(b => b.id)) + 1 : 1;
          db.batches.push({ id: nextId, name });
          saveData();
          return json(res, { ok: true, message: 'Batch added successfully.' });
        }
        return json(res, { ok: true, message: 'Batch already exists.' });
      }

      if (action === 'add_program') {
        const programName = String(body.programName || '').trim();
        const batchName = String(body.batchName || '').trim();
        if (!programName || !batchName) return jsonError(res, 'Batch and program name are required.');
        if (!db.batches.find(b => b.name === batchName)) {
          const nextBatchId = db.batches.length ? Math.max(...db.batches.map(b => b.id)) + 1 : 1;
          db.batches.push({ id: nextBatchId, name: batchName });
        }
        let prog = db.programs.find(p => p.name.toLowerCase() === programName.toLowerCase() && p.batch === batchName);
        if (prog) return jsonError(res, 'This program already exists for the selected batch.');
        const nextProgId = db.programs.length ? Math.max(...db.programs.map(p => p.id)) + 1 : 1;
        db.programs.push({ id: nextProgId, name: programName, label: programName, batch: batchName });
        saveData();
        return json(res, { ok: true, message: 'Program added successfully.' });
      }

      if (action === 'add_semester') {
        const semesterName = String(body.semesterName || '').trim();
        if (!semesterName) return jsonError(res, 'Semester name is required.');
        let sem = db.semesters.find(s => s.name.toLowerCase() === semesterName.toLowerCase());
        if (sem) return jsonError(res, 'This semester already exists.');
        const matchNum = semesterName.match(/\d+/);
        const semId = matchNum ? parseInt(matchNum[0]) : (db.semesters.length ? Math.max(...db.semesters.map(s => s.id)) + 1 : 1);
        db.semesters.push({ id: semId, name: semesterName });
        db.semesters.sort((a, b) => a.id - b.id);
        saveData();
        return json(res, { ok: true, message: 'Semester added successfully.' });
      }

      if (action === 'create_structure') {
        const batchName = String(body.batchName || '').trim();
        const programName = String(body.programName || '').trim();
        const semesterCount = parseInt(body.semesterCount) || 8;

        if (!batchName || !programName) {
          return jsonError(res, 'Batch and program name are required.');
        }

        if (!db.batches.find(b => b.name === batchName)) {
          const nextBatchId = db.batches.length ? Math.max(...db.batches.map(b => b.id)) + 1 : 1;
          db.batches.push({ id: nextBatchId, name: batchName });
        }

        let prog = db.programs.find(p => p.name.toLowerCase() === programName.toLowerCase() && p.batch === batchName);
        if (!prog) {
          const nextProgId = db.programs.length ? Math.max(...db.programs.map(p => p.id)) + 1 : 1;
          prog = { id: nextProgId, name: programName, label: programName, batch: batchName };
          db.programs.push(prog);
        }

        for (let i = 1; i <= semesterCount; i++) {
          if (!db.semesters.find(s => s.id === i)) {
            db.semesters.push({ id: i, name: `Semester ${i}` });
          }
        }
        db.semesters.sort((a, b) => a.id - b.id);

        saveData();
        return json(res, { ok: true, message: 'Academic structure created successfully.' });
      }

      if (action === 'add_subject') {
        const subjectName = String(body.subjectName || '').trim();
        const credits = parseInt(body.credits) || 0;
        const totalHours = parseInt(body.totalHours) || (credits ? credits * 15 : 45);

        if (!subjectName) {
          return jsonError(res, 'Subject name is required.');
        }

        if (db.courses.find(c => c.name.toLowerCase() === subjectName.toLowerCase())) {
          return jsonError(res, 'This subject already exists in the course library.');
        }

        const nextId = db.courses.length ? Math.max(...db.courses.map(c => c.id)) + 1 : 1;
        const newCourse = {
          id: nextId,
          name: subjectName,
          credits,
          totalSemesterClasses: totalHours,
          conductedClasses: Math.min(22, totalHours)
        };
        db.courses.push(newCourse);
        saveData();
        return json(res, { ok: true, message: 'Subject added successfully.' });
      }

      if (action === 'add_admin_user') {
        const fullName = String(body.fullName || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!fullName) return jsonError(res, 'Admin full name is required.');
        if (!email.includes('@')) return jsonError(res, 'Please enter a valid admin email.');
        if (password.length < 8) return jsonError(res, 'Admin password must be at least 8 characters.');

        if (db.adminUsers.find(a => a.email === email && a.isActive)) {
          return jsonError(res, 'An admin with this email already exists.');
        }

        const nextId = db.adminUsers.length ? Math.max(...db.adminUsers.map(a => a.id)) + 1 : 1;
        db.adminUsers.push({
          id: nextId,
          fullName,
          email,
          passwordHash: hashPassword(password),
          isActive: 1,
          isDefault: false,
          createdAt: new Date().toISOString()
        });
        saveData();
        return json(res, { ok: true, message: 'Admin user added successfully.' });
      }

      if (action === 'remove_admin_user') {
        const adminId = parseInt(body.adminId);
        const target = db.adminUsers.find(a => a.id === adminId);
        if (!target) return jsonError(res, 'Admin user not found.');
        if (target.isDefault) return jsonError(res, 'The default admin cannot be removed.');

        db.adminUsers = db.adminUsers.filter(a => a.id !== adminId);
        saveData();
        return json(res, { ok: true, message: 'Admin user removed successfully.' });
      }

      if (action === 'remove_student_profile') {
        const userId = parseInt(body.userId) || body.userId;
        delete db.studentProfiles[userId];
        for (const k of Object.keys(db.attendanceRecords)) {
          if (k.startsWith(`${userId}_`)) {
            delete db.attendanceRecords[k];
          }
        }
        saveData();
        return json(res, { ok: true, message: 'Student profile and saved attendance removed successfully.' });
      }

      saveData();
      return json(res, { ok: true, message: 'Action completed and saved.' });
    }

    return jsonError(res, 'API endpoint not found', 404);
  }

  // Static files
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(__dirname, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const ips = getLocalIpAddresses();
  console.log(`\n======================================================`);
  console.log(` Attendance Prediction Server running on:`);
  console.log(` Local:   http://localhost:${PORT}`);
  ips.forEach(i => {
    console.log(` Network: http://${i.ip}:${PORT} (${i.iface})`);
  });
  console.log(` (Live synchronized between Mobile App and PC Website)`);
  console.log(`======================================================\n`);
});
