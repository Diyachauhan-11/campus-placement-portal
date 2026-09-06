let isLoginMode = false;

const authForm = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-auth');
const authSubtitle = document.getElementById('auth-subtitle');
const submitBtn = document.getElementById('submit-btn');
const academicFields = document.getElementById('student-academic-fields');
const nameGroup = document.getElementById('name-group');

// Toggle between Login and Register modes
toggleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;

  if (isLoginMode) {
    authSubtitle.innerText = 'Welcome Back! Sign in to access placement drives';
    submitBtn.innerText = 'Sign In to Account';
    academicFields.classList.add('hidden');
    nameGroup.classList.add('hidden');
    document.getElementById('toggle-msg').innerText = "Don't have an account?";
    toggleBtn.innerText = 'Register Here';
  } else {
    authSubtitle.innerText = 'Enterprise Campus Placement & Recruitment OS';
    submitBtn.innerText = 'Register Candidate Profile';
    academicFields.classList.remove('hidden');
    nameGroup.classList.remove('hidden');
    document.getElementById('toggle-msg').innerText = 'Already have an account?';
    toggleBtn.innerText = 'Sign In';
  }
});

// Form submission handler
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    if (isLoginMode) {
      // 1. LOGIN API CALL
      const res = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!res.token || !res.user) {
        throw new Error('Authentication failed. No session returned.');
      }

      // Store auth session
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      // Redirect based on role
      if (res.user.role === 'STUDENT') {
        window.location.href = 'student-dashboard.html';
      } else {
        alert(`Logged in as ${res.user.role}`);
      }

    } else {
      // 2. REGISTER API CALL
      const name = document.getElementById('name').value.trim();
      const branch = document.getElementById('branch').value;
      const cgpa = parseFloat(document.getElementById('cgpa').value) || 0.0;
      const active_backlogs = parseInt(document.getElementById('backlogs').value, 10) || 0;

      if (!name) {
        alert('Please provide your full name.');
        return;
      }

      await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'STUDENT',
          branch,
          cgpa,
          active_backlogs
        })
      });

      alert('Account registered successfully! Now sign in with your credentials.');
      toggleBtn.click(); // Automatically switch to sign-in screen
    }
  } catch (err) {
    alert(err.message || 'Error occurred during authentication');
  }
});