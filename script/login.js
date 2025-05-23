const loginForm = document.getElementById('loginForm');
const submitBtn = loginForm.querySelector('button[type="submit"]');
const errorMsg = document.getElementById('errorMsg');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorMsg.style.display = 'none';
  errorMsg.textContent = '';

  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  if (!email) {
    errorMsg.textContent = 'Please enter your email.';
    errorMsg.style.display = 'block';
    e.target.email.focus();
    return;
  }
  if (!password) {
    errorMsg.textContent = 'Please enter your password.';
    errorMsg.style.display = 'block';
    e.target.password.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message);

      // Redirect based on role returned from server
      if (data.role === 'teacher') {
        window.location.href = '/create.html';
      } else if (data.role === 'student') {
        window.location.href = '/play.html';
      } else {
        window.location.href = '/index.html';
      }

    } else {
      errorMsg.textContent = data.message || 'Login failed.';
      errorMsg.style.display = 'block';
    }
  } catch (error) {
    errorMsg.textContent = 'Network error: ' + error.message;
    errorMsg.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
});
