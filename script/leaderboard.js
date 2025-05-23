// Get the current logged-in user's name from localStorage
const currentUser = localStorage.getItem("username");

// Fetch leaderboard data from backend
async function fetchLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    renderLeaderboard(data);
    highlightTopThree();  // Highlight top 3 players after rendering
  } catch (err) {
    document.getElementById("leaderboard").innerHTML = "<p>Failed to load leaderboard.</p>";
    console.error("Error loading leaderboard:", err);
  }
}

// Render leaderboard table
function renderLeaderboard(data) {
  const container = document.getElementById("leaderboard");

  if (!data.length) {
    container.innerHTML = "<p>No scores yet!</p>";
    return;
  }

  // Sort by score descending
  const sorted = data.sort((a, b) => b.score - a.score);

  let html = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach((player, index) => {
    const highlightClass = player.name === currentUser ? "highlight" : "";
    html += `
      <tr class="${highlightClass}">
        <td>${index + 1}</td>
        <td>${escapeHtml(player.name)}</td>
        <td>${player.score}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Simple helper to prevent XSS by escaping HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Highlight top three players with crown icons and glowing effect
function highlightTopThree() {
  const rows = document.querySelectorAll('.leaderboard-table table tbody tr');
  if (rows.length >= 3) {
    const crowns = ['👑', '🥈', '🥉'];
    rows.forEach((row, index) => {
      if (index < 3) {
        row.classList.add(`top-${index + 1}`);
        const nameCell = row.querySelector('td:nth-child(2)');
        nameCell.innerHTML = `${crowns[index]} ${nameCell.innerHTML}`;
      }
    });
  }
}

// Run fetchLeaderboard on page load
document.addEventListener("DOMContentLoaded", fetchLeaderboard);
