let quizData = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 10;

async function loadQuizData() {
  try {
    const response = await fetch('/api/questions');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    quizData = await response.json();

    if (!quizData.length) {
      alert("No quiz questions found.");
      return;
    }

    loadQuestion();
  } catch (error) {
    alert("Failed to load quiz data.");
    console.error(error);
  }
}

function loadQuestion() {
  if (current >= quizData.length) return showResult();

  const q = quizData[current];
  document.getElementById("question").innerText = q.question;

  const optionsBox = document.getElementById("options");
  optionsBox.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => checkAnswer(i, btn);
    optionsBox.appendChild(btn);
  });

  document.getElementById("progress-bar").style.width = `${(current / quizData.length) * 100}%`;

  startTimer();
}

function checkAnswer(selected, button) {
  stopTimer();
  const correctAnswer = quizData[current].correctAnswer;

  const buttons = document.querySelectorAll("#options button");

  buttons.forEach((btn) => {
    if (btn.innerText === correctAnswer) btn.classList.add("correct");
    else if (btn.innerText === quizData[current].options[selected]) btn.classList.add("wrong");
    btn.disabled = true;
  });

  if (selected !== -1 && quizData[current].options[selected] === correctAnswer) {
    score++;
  }

  setTimeout(() => {
    current++;
    loadQuestion();
  }, 1000);
}

function startTimer() {
  timeLeft = 10;
  document.getElementById("time").innerText = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;
    if (timeLeft === 0) {
      clearInterval(timer);
      checkAnswer(-1, null);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function showResult() {
  document.getElementById("quiz-box").classList.add("hidden");
  document.getElementById("result-modal").classList.remove("hidden");
  document.getElementById("final-score").innerText = `${score} / ${quizData.length}`;

  const playerName = localStorage.getItem("username") || prompt("Enter your name:");
  if (playerName) {
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, score })
    }).catch(err => console.error("Failed to save score:", err));
  }
}

window.onload = loadQuizData; 