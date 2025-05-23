document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/logout', { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      alert(data.message);
      window.location.href = '/login.html';
    } else {
      alert('Logout failed.');
    }
  } catch (e) {
    alert('Network error: ' + e.message);
  }
});
