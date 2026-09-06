const db = require('../config/db');

// 1. Recruiter: Create new Placement Drive / Job
exports.createJob = async (req, res) => {
  const { company_name, job_title, description, min_cgpa, max_backlogs, eligible_branches } = req.body;
  const recruiterId = req.user.id;

  try {
    const query = `
      INSERT INTO job_postings 
        (recruiter_id, company_name, job_title, description, min_cgpa, max_backlogs, eligible_branches)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      recruiterId,
      company_name,
      job_title,
      description,
      min_cgpa || 0.0,
      max_backlogs !== undefined ? max_backlogs : 0,
      eligible_branches || ['CSE', 'IT']
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to post new drive.' });
  }
};

// 2. Student: Fetch Drives matching academic eligibility
exports.getEligibleJobs = async (req, res) => {
  const studentUserId = req.user.id;

  try {
    // Database-level filtering on CGPA, Backlogs, and Branch
    const query = `
      SELECT 
        j.id, 
        j.company_name, 
        j.job_title, 
        j.description, 
        j.min_cgpa, 
        j.max_backlogs,
        j.eligible_branches,
        j.created_at,
        EXISTS(
          SELECT 1 FROM applications a 
          WHERE a.job_id = j.id AND a.student_id = $1
        ) AS has_applied
      FROM job_postings j
      JOIN student_profiles sp ON sp.user_id = $1
      WHERE j.is_active = TRUE
        AND sp.cgpa >= j.min_cgpa
        AND sp.active_backlogs <= j.max_backlogs
        AND sp.branch = ANY(j.eligible_branches)
      ORDER BY j.created_at DESC;
    `;

    const { rows } = await db.query(query, [studentUserId]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch eligible jobs error:', err);
    res.status(500).json({ error: 'Failed to load eligible drives.' });
  }
};

// 3. Student: Apply for a Placement Drive with Server-side Verification
exports.applyForJob = async (req, res) => {
  const studentId = req.user.id;
  const { jobId } = req.body;

  try {
    // Verification: Double-check student academic eligibility before inserting
    const verifyQuery = `
      SELECT j.id 
      FROM job_postings j
      JOIN student_profiles sp ON sp.user_id = $1
      WHERE j.id = $2
        AND j.is_active = TRUE
        AND sp.cgpa >= j.min_cgpa
        AND sp.active_backlogs <= j.max_backlogs
        AND sp.branch = ANY(j.eligible_branches);
    `;
    const verifyRes = await db.query(verifyQuery, [studentId, jobId]);

    if (verifyRes.rows.length === 0) {
      return res.status(403).json({ error: 'You do not meet the criteria for this company drive.' });
    }

    // Insert Application
    const insertQuery = `
      INSERT INTO applications (job_id, student_id, status)
      VALUES ($1, $2, 'APPLIED')
      RETURNING *;
    `;
    const { rows } = await db.query(insertQuery, [jobId, studentId]);

    res.status(201).json({ success: true, message: 'Application submitted successfully.', data: rows[0] });
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL Unique Violation
      return res.status(400).json({ error: 'You have already applied for this drive.' });
    }
    console.error('Apply job error:', err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
};

// 4. Recruiter: View all applicants for their drives with metrics
exports.getJobApplicants = async (req, res) => {
  const { jobId } = req.params;
  const recruiterId = req.user.id;

  try {
    const query = `
      SELECT 
        a.id AS application_id,
        a.status,
        a.applied_at,
        u.name AS student_name,
        u.email AS student_email,
        sp.branch,
        sp.cgpa,
        sp.active_backlogs,
        sp.resume_url
      FROM applications a
      JOIN users u ON u.id = a.student_id
      JOIN student_profiles sp ON sp.user_id = u.id
      JOIN job_postings j ON j.id = a.job_id
      WHERE a.job_id = $1 AND j.recruiter_id = $2
      ORDER BY sp.cgpa DESC;
    `;

    const { rows } = await db.query(query, [jobId, recruiterId]);
    res.status(200).json({ success: true, count: rows.length, applicants: rows });
  } catch (err) {
    console.error('Get applicants error:', err);
    res.status(500).json({ error: 'Failed to fetch applicants.' });
  }
};

// 5. Recruiter: Update Candidate Status (SHORTLISTED, REJECTED, SELECTED)
exports.updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body; // 'SHORTLISTED' | 'REJECTED' | 'SELECTED'

  try {
    const query = `
      UPDATE applications
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await db.query(query, [status, applicationId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update candidate status.' });
  }
};