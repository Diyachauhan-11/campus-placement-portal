const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'STUDENT') {
  window.location.href = 'index.html';
}

// Sidebar Profile Bar Population
document.getElementById('sidebar-user-name').innerText = user.name;
document.getElementById('sidebar-user-email').innerText = user.email;
document.getElementById('avatar-initials').innerText = user.name.charAt(0).toUpperCase();

let allJobs = [];

// Company Logo Resolver
function getCompanyLogo(company) {
  const lower = company.toLowerCase();
  if (lower.includes('amazon')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg';
  if (lower.includes('deloitte')) return 'https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg';
  if (lower.includes('tcs')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg';
  return 'https://cdn-icons-png.flaticon.com/512/3238/3238018.png';
}

// Navigation Tab Switcher
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));

  const activeTabEl = document.getElementById(`tab-${tabId}`);
  if (activeTabEl) activeTabEl.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('text-white', 'bg-indigo-600/20', 'border', 'border-indigo-500/30');
    btn.classList.add('text-slate-400');
  });

  const titles = {
    'home': 'Dashboard Overview',
    'profile': 'My Profile & Academics',
    'resume': 'Resume & ATS Analyzer',
    'opportunities': 'All Placement Drives',
    'applications': 'My Placement Pipeline',
    'preparation': 'Technical Preparation Hub',
    'experiences': 'Verified Interview Archive',
    'ai-assistant': 'AI Career & Placement Assistant'
  };

  document.getElementById('active-tab-title').innerText = titles[tabId] || 'Placement Portal';

  // Dynamic Content Loading on Click
  if (tabId === 'home' || tabId === 'opportunities') loadEligibleDrives();
  if (tabId === 'profile') loadFullProfile();
  if (tabId === 'preparation') loadPrepMaterials();
  if (tabId === 'experiences') loadExperiences();
  if (tabId === 'applications') loadMyApplications();
}

// 1. ELIGIBLE DRIVES FEED
async function loadEligibleDrives() {
  const container = document.getElementById('jobs-container');
  if (!container) return;
  try {
    const res = await fetchWithAuth('/jobs/eligible');
    allJobs = res.data;

    if (document.getElementById('metric-eligible')) {
      document.getElementById('metric-eligible').innerText = allJobs.length;
    }
    const appliedCount = allJobs.filter(j => j.has_applied).length;
    if (document.getElementById('metric-applied')) {
      document.getElementById('metric-applied').innerText = appliedCount;
    }

    renderCards(allJobs);
  } catch (err) {
    container.innerHTML = `<p class="text-red-400 text-xs">${err.message}</p>`;
  }
}

function renderCards(jobs) {
  const container = document.getElementById('jobs-container');
  if (!container) return;
  if (jobs.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500 text-sm">No campus placement drives match your academic criteria.</div>`;
    return;
  }

  container.innerHTML = jobs.map(job => `
    <div class="glass-card rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition duration-200">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-white/10 rounded-xl p-2 flex items-center justify-center border border-white/10">
            <img src="${getCompanyLogo(job.company_name)}" alt="${job.company_name}" class="max-h-8 max-w-8 object-contain">
          </div>
          <div>
            <h4 class="font-bold text-white text-base">${job.company_name}</h4>
            <p class="text-xs text-indigo-400 font-medium">${job.job_title}</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 mt-4 leading-relaxed line-clamp-3">
          ${job.description || 'Full-time campus hiring drive for batch 2026.'}
        </p>

        <div class="mt-4 flex flex-wrap gap-1.5">
          <span class="text-[11px] bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-md">Min CGPA: ${job.min_cgpa}</span>
          <span class="text-[11px] bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-md">Backlogs: ≤ ${job.max_backlogs}</span>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-slate-800">
        ${job.has_applied 
          ? `<button disabled class="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-not-allowed">✓ Applied</button>`
          : `<button onclick="applyJob(${job.id})" class="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition">Apply Now</button>`
        }
      </div>
    </div>
  `).join('');
}

function filterDrives() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = allJobs.filter(j => 
    j.company_name.toLowerCase().includes(query) || 
    j.job_title.toLowerCase().includes(query)
  );
  renderCards(filtered);
}

async function applyJob(jobId) {
  try {
    await fetchWithAuth('/jobs/apply', {
      method: 'POST',
      body: JSON.stringify({ jobId })
    });
    loadEligibleDrives();
  } catch (err) {
    alert(err.message);
  }
}

// 2. MY PROFILE (FULL DOSSIER)
async function loadFullProfile() {
  try {
    const res = await fetchWithAuth(`/student/profile/${user.id}`);
    const p = res.data;

    if (p) {
      if (document.getElementById('prof-name')) document.getElementById('prof-name').value = p.name || user.name;
      if (document.getElementById('prof-email')) document.getElementById('prof-email').value = p.email || user.email;
      if (document.getElementById('prof-enrollment')) document.getElementById('prof-enrollment').value = p.enrollment_no || '';
      if (document.getElementById('prof-degree')) document.getElementById('prof-degree').value = p.degree || 'B.Tech';
      if (document.getElementById('prof-branch')) document.getElementById('prof-branch').value = p.branch || 'CSE';
      if (document.getElementById('prof-passing-year')) document.getElementById('prof-passing-year').value = p.passing_year || 2026;
      if (document.getElementById('prof-cgpa')) document.getElementById('prof-cgpa').value = p.cgpa || '';
      if (document.getElementById('prof-backlogs')) document.getElementById('prof-backlogs').value = p.active_backlogs !== undefined ? p.active_backlogs : 0;
      if (document.getElementById('prof-tenth')) document.getElementById('prof-tenth').value = p.tenth_percentage || '';
      if (document.getElementById('prof-twelfth')) document.getElementById('prof-twelfth').value = p.twelfth_percentage || '';
      if (document.getElementById('prof-phone')) document.getElementById('prof-phone').value = p.phone_no || '';
      if (document.getElementById('prof-linkedin')) document.getElementById('prof-linkedin').value = p.linkedin_url || '';
      if (document.getElementById('prof-github')) document.getElementById('prof-github').value = p.github_url || '';
      if (document.getElementById('prof-skills')) document.getElementById('prof-skills').value = p.skills ? p.skills.join(', ') : '';
    }
  } catch (err) {
    console.error('Profile fetch error:', err);
  }
}

async function saveCompleteProfile() {
  const enrollment_no = document.getElementById('prof-enrollment').value.trim();
  const degree = document.getElementById('prof-degree').value;
  const branch = document.getElementById('prof-branch').value;
  const passing_year = parseInt(document.getElementById('prof-passing-year').value, 10) || 2026;
  const cgpa = parseFloat(document.getElementById('prof-cgpa').value) || 0.0;
  const active_backlogs = parseInt(document.getElementById('prof-backlogs').value, 10) || 0;
  const tenth_percentage = parseFloat(document.getElementById('prof-tenth').value) || null;
  const twelfth_percentage = parseFloat(document.getElementById('prof-twelfth').value) || null;
  const phone_no = document.getElementById('prof-phone').value.trim();
  const linkedin_url = document.getElementById('prof-linkedin').value.trim();
  const github_url = document.getElementById('prof-github').value.trim();
  
  const rawSkills = document.getElementById('prof-skills').value;
  const skills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);

  if (!enrollment_no) {
    alert('University Enrollment Number is required.');
    return;
  }

  try {
    await fetchWithAuth('/student/profile', {
      method: 'PUT',
      body: JSON.stringify({
        userId: user.id,
        enrollment_no, degree, branch, passing_year,
        cgpa, active_backlogs, tenth_percentage, twelfth_percentage,
        phone_no, linkedin_url, github_url, skills
      })
    });

    alert('Academic Dossier saved successfully! Updated criteria reflected in drives.');
    loadEligibleDrives();
  } catch (err) {
    alert(err.message);
  }
}

// 3. PREPARATION MATERIAL (DSA/SQL)
async function loadPrepMaterials() {
  const container = document.getElementById('prep-cards-container');
  if (!container) return;
  try {
    const res = await fetchWithAuth('/prep');
    container.innerHTML = res.data.map(q => `
      <div class="glass-card rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition">
        <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">${q.category}</span>
        <h4 class="font-bold text-white text-sm mt-1">${q.title}</h4>
        <div class="mt-4 flex justify-between items-center text-xs">
          <span class="text-slate-400">Difficulty: <span class="text-emerald-400 font-semibold">${q.difficulty}</span></span>
          <span class="text-indigo-300 font-medium">${q.company_tags ? q.company_tags.join(', ') : ''}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-400 text-xs">${err.message}</p>`;
  }
}

// 4. INTERVIEW EXPERIENCES
async function loadExperiences() {
  const container = document.getElementById('experiences-container');
  if (!container) return;
  try {
    const res = await fetchWithAuth('/experiences');
    container.innerHTML = res.data.map(e => `
      <div class="glass-card rounded-2xl p-6 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-bold text-white text-base">${e.company_name} — <span class="text-indigo-400">${e.role}</span></h4>
          <span class="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold">${e.verdict}</span>
        </div>
        <p class="text-xs text-slate-400 mb-3">Shared by: <span class="text-slate-200 font-medium">${e.student_name}</span></p>
        <p class="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80">${e.rounds_breakdown}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-400 text-xs">${err.message}</p>`;
  }
}

// 5. MY APPLICATIONS
async function loadMyApplications() {
  const container = document.getElementById('applications-container');
  if (!container) return;
  try {
    const res = await fetchWithAuth('/applications/my');
    if (res.data.length === 0) {
      container.innerHTML = `<div class="py-12 text-center text-slate-500 text-sm">You have not applied to any placement drives yet.</div>`;
      return;
    }
    container.innerHTML = res.data.map(app => `
      <div class="glass-card rounded-xl p-4 flex justify-between items-center border border-slate-800">
        <div>
          <h4 class="font-bold text-white text-sm">${app.company_name}</h4>
          <p class="text-xs text-slate-400 mt-0.5">${app.job_title}</p>
        </div>
        <span class="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold uppercase">${app.status}</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-400 text-xs">${err.message}</p>`;
  }
}

// 6. RESUME SAVE
async function saveResume() {
  const resumeUrl = document.getElementById('resume-input').value.trim();
  if (!resumeUrl) return alert('Please enter a valid link');
  try {
    await fetchWithAuth('/student/resume', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, resumeUrl })
    });
    alert('Resume link successfully connected with profile!');
  } catch (err) {
    alert(err.message);
  }
}

// 7. AI ASSISTANT CHAT
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const chatBox = document.getElementById('chat-box');
  const text = input.value.trim();
  if (!text) return;

  chatBox.innerHTML += `
    <div class="bg-indigo-600/20 border border-indigo-500/30 p-3 rounded-xl text-xs text-indigo-200 text-right">
      <strong>You:</strong> ${text}
    </div>
  `;
  input.value = '';

  setTimeout(() => {
    chatBox.innerHTML += `
      <div class="bg-slate-900/80 p-3 rounded-xl text-xs text-slate-300 border border-slate-800">
        <strong>Assistant:</strong> Focus on core Data Structures (Arrays, Strings, Hashmaps), standard SQL window functions, and system design basics for this company's hiring pattern.
      </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 400);
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// Initial Data Load
loadEligibleDrives();