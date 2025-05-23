const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'replace-this-with-a-strong-secret', // use env var in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
  },
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/script', express.static(path.join(__dirname, 'script')));

// Paths
const questionsFile = path.join(__dirname, 'data', 'questions.json');
const leaderboardFile = path.join(__dirname, 'data', 'leaderboard.json');
const usersFile = path.join(__dirname, 'data', 'users.json'); // users JSON store
const versionsDir = path.join(__dirname, 'data', 'versions');

// Ensure versions directory exists
if (!fs.existsSync(versionsDir)) {
  fs.mkdirSync(versionsDir, { recursive: true });
}

// Ensure leaderboard.json exists
if (!fs.existsSync(leaderboardFile)) {
  fs.writeFileSync(leaderboardFile, '[]', 'utf8');
}

// Load users helper
function loadUsers() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]', 'utf8');
  }
  const usersData = fs.readFileSync(usersFile, 'utf8');
  try {
    return JSON.parse(usersData);
  } catch {
    return [];
  }
}

// Save users helper
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

// Auth middleware for session-protected routes
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

// Role-based middlewares
function ensureTeacher(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'teacher') {
    return next();
  }
  res.status(403).send('Access denied. Teachers only.');
}

function ensureStudent(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'student') {
    return next();
  }
  res.status(403).send('Access denied. Students only.');
}

// --- APIs ---

// Signup API
app.post('/api/signup', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password and role required.' });
  }

  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  const users = loadUsers();

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ email, passwordHash, role });
    saveUsers(users);
    return res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  try {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Create session and store role info
    req.session.user = { email, role: user.role };
    return res.status(200).json({ message: 'Login successful.', role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Logout API
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully.' });
  });
});

// Get current logged-in user info
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    const users = loadUsers();
    const user = users.find(u => u.email === req.session.user.email);
    if (user) {
      return res.json({ email: user.email, role: user.role, profilePhoto: user.profilePhoto || null });
    }
  }
  res.status(401).json({ message: 'Not authenticated' });
});

// Quiz questions API
app.get('/api/questions', (req, res) => {
  fs.readFile(questionsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading questions.json:', err);
      return res.status(500).send('Could not load questions.');
    }
    try {
      const questions = JSON.parse(data);
      res.json(questions);
    } catch (parseErr) {
      console.error('Error parsing questions.json:', parseErr);
      res.status(500).send('Invalid questions format.');
    }
  });
});

// Post leaderboard score
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') {
    return res.status(400).send('Invalid input.');
  }

  fs.readFile(leaderboardFile, 'utf8', (err, data) => {
    let leaderboard = [];
    if (!err && data) {
      try {
        leaderboard = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing leaderboard.json:', e);
      }
    }

    leaderboard.push({ name, score, time: new Date().toISOString() });

    fs.writeFile(leaderboardFile, JSON.stringify(leaderboard, null, 2), (err) => {
      if (err) {
        console.error('Error writing leaderboard:', err);
        return res.status(500).send('Failed to save score.');
      }
      res.status(200).send('Score saved!');
    });
  });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  fs.readFile(leaderboardFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error loading leaderboard:', err);
      return res.status(500).send('Error loading leaderboard.');
    }
    try {
      res.json(JSON.parse(data));
    } catch {
      res.status(500).send('Leaderboard data corrupted.');
    }
  });
});

// Save quiz with versioning - protected, teachers only
app.post('/save-quiz', ensureAuthenticated, ensureTeacher, (req, res) => {
  const quizData = req.body;

  if (!Array.isArray(quizData)) {
    return res.status(400).send('Invalid quiz data format.');
  }

  fs.writeFile(questionsFile, JSON.stringify(quizData, null, 2), (err) => {
    if (err) {
      console.error('Error saving quiz:', err);
      return res.status(500).send('Failed to save quiz.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionFile = path.join(versionsDir, `questions_${timestamp}.json`);

    fs.writeFile(versionFile, JSON.stringify(quizData, null, 2), (verr) => {
      if (verr) {
        console.error('Error saving quiz version:', verr);
      }
      res.status(200).send('Quiz saved successfully with version backup!');
    });
  });
});

// Protected pages
app.get('/play', ensureAuthenticated, ensureStudent, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/create', ensureAuthenticated, ensureTeacher, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

// Public pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/leaderboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'leaderboard.html')));

// 404 fallback
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
