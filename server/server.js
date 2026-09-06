const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Auth & Job Core Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// 2. Resume Update Route
app.post('/api/student/resume', async (req, res) => {
  const { userId, resumeUrl } = req.body;
  try {
    await db.query('UPDATE student_profiles SET resume_url = $1 WHERE user_id = $2', [resumeUrl, userId]);
    res.status(200).json({ success: true, message: 'Resume updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// 3. Preparation Materials Route (DSA, SQL, Aptitude)
app.get('/api/prep', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM prep_questions';
    const params = [];
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    const { rows } = await db.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch preparation material' });
  }
});

// 4. Interview Experiences Route
app.get('/api/experiences', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM interview_experiences ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch interview experiences' });
  }
});

// 5. Applied Jobs (My Applications Tab)
app.get('/api/applications/my', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    try {
      const query = `
        SELECT a.id, a.status, a.applied_at, j.company_name, j.job_title
        FROM applications a
        JOIN job_postings j ON j.id = a.job_id
        WHERE a.student_id = $1
        ORDER BY a.applied_at DESC;
      `;
      const { rows } = await db.query(query, [decoded.id]);
      res.status(200).json({ success: true, data: rows });
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'online' });
});

// Get Complete Student Profile
app.get('/api/student/profile/:userId', async (req, res) => {
  try {
    const query = `
      SELECT u.name, u.email, sp.* 
      FROM users u 
      LEFT JOIN student_profiles sp ON sp.user_id = u.id 
      WHERE u.id = $1;
    `;
    const { rows } = await db.query(query, [req.params.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// Update Student Profile
app.put('/api/student/profile', async (req, res) => {
  const {
    userId, enrollment_no, degree, branch, passing_year,
    cgpa, active_backlogs, tenth_percentage, twelfth_percentage,
    phone_no, linkedin_url, github_url, skills
  } = req.body;

  try {
    const query = `
      UPDATE student_profiles SET
        enrollment_no = $1,
        degree = $2,
        branch = $3,
        passing_year = $4,
        cgpa = $5,
        active_backlogs = $6,
        tenth_percentage = $7,
        twelfth_percentage = $8,
        phone_no = $9,
        linkedin_url = $10,
        github_url = $11,
        skills = $12
      WHERE user_id = $13
      RETURNING *;
    `;
    const values = [
      enrollment_no, degree, branch, passing_year,
      cgpa, active_backlogs, tenth_percentage, twelfth_percentage,
      phone_no, linkedin_url, github_url, skills, userId
    ];
    const { rows } = await db.query(query, values);
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});