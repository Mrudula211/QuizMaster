// session.js

let currentUser = null;

async function fetchUser() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      currentUser = await res.json();
      return currentUser;
    } else {
      currentUser = null;
      return null;
    }
  } catch (e) {
    currentUser = null;
    return null;
  }
}

function updateUI(user) {
  const userInfo = document.getElementById('user-info');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const logoutBtn = document.getElementById('logoutBtn');

  if (user) {
    userInfo.textContent = `  ${user.email}`;
    loginLink.style.display = 'none';
    signupLink.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    userInfo.textContent = '';
    loginLink.style.display = 'inline-block';
    signupLink.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

async function initSession() {
  const user = await fetchUser();
  updateUI(user);

  // Dispatch a custom event for other scripts to listen if needed
  window.dispatchEvent(new CustomEvent('sessionChanged', { detail: user }));
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  updateUI(null);
  window.dispatchEvent(new CustomEvent('sessionChanged', { detail: null }));
  window.location.reload();
}

function isLoggedIn() {
  return currentUser !== null;
}

// Initialize session UI and logic on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initSession();

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', logout);
});

// Expose isLoggedIn and currentUser globally
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = () => currentUser;
