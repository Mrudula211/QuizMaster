const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const role = e.target.role.value;  // get selected role

  if (!email || !password || !role) {
    alert('Please fill in email, password, and select a role.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),  // send role here
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message + ' You can now log in.');
      window.location.href = '/login.html';
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
});
