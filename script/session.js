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
    console.error("Error fetching user session:", e);
    currentUser = null;
    return null;
  }
}

function updateUI(user) {
  const userInfo = document.getElementById('user-info');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const logoutBtn = document.getElementById('logoutBtn');

  if (userInfo) userInfo.textContent = user ? `  ${user.email}` : '';
  if (loginLink) loginLink.style.display = user ? 'none' : 'inline-block';
  if (signupLink) signupLink.style.display = user ? 'none' : 'inline-block';
  if (logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';
}

async function initSession() {
  const user = await fetchUser();
  updateUI(user);

  // Notify other scripts
  window.dispatchEvent(new CustomEvent('sessionChanged', { detail: user }));
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (err) {
    console.error("Logout error:", err);
  }
  currentUser = null;
  updateUI(null);
  window.dispatchEvent(new CustomEvent('sessionChanged', { detail: null }));
  window.location.href = '/login.html';
}

function isLoggedIn() {
  return currentUser !== null;
}

function getCurrentUser() {
  return currentUser;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initSession();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

// Expose globally
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
