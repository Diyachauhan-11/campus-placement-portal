const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Student endpoints
router.get('/eligible', verifyToken, requireRole('STUDENT'), jobController.getEligibleJobs);
router.post('/apply', verifyToken, requireRole('STUDENT'), jobController.applyForJob);

// Recruiter endpoints
router.post('/create', verifyToken, requireRole('RECRUITER', 'ADMIN'), jobController.createJob);
router.get('/:jobId/applicants', verifyToken, requireRole('RECRUITER', 'ADMIN'), jobController.getJobApplicants);
router.patch('/application/:applicationId', verifyToken, requireRole('RECRUITER', 'ADMIN'), jobController.updateApplicationStatus);

module.exports = router;