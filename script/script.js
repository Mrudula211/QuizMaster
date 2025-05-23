let questionCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadExistingQuestions();

  document.getElementById("quizForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = new FormData(e.target);
    const quiz = [];

    for (let i = 0; i < questionCount; i++) {
      const questionText = form.get(`questionText${i}`);
      const questionType = form.get(`questionType${i}`);
      const marks = parseInt(form.get(`marks${i}`), 10);
      const correctAnswer = form.get(`correctAnswer${i}`);

      if (!questionText || !questionType || !correctAnswer || isNaN(marks) || marks < 1) {
        alert(`Please fill all fields correctly for Question ${i + 1}`);
        return;
      }

      let options = [];

      if (questionType === 'multiple') {
        options = [
          form.get(`optionA${i}`),
          form.get(`optionB${i}`),
          form.get(`optionC${i}`),
          form.get(`optionD${i}`)
        ];
        if (options.some(opt => !opt)) {
          alert(`Please fill all options for Question ${i + 1}`);
          return;
        }
      } else if (questionType === 'truefalse') {
        options = ['True', 'False'];
      } else if (questionType === 'fillblank') {
        options = [];
      }

      quiz.push({
        question: questionText,
        type: questionType,
        options,
        correctAnswer,
        marks
      });
    }

    fetch('/save-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    })
      .then(res => res.text())
      .then(msg => alert(msg))
      .catch(() => alert("Error saving quiz"));
  });
});

function loadExistingQuestions() {
  fetch('/api/questions')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(questionData => addQuestion(questionData));
      } else {
        addQuestion();
      }
    })
    .catch(() => addQuestion());
}

function addQuestion(data = null) {
  const container = document.getElementById('questions-container');

  const questionDiv = document.createElement('div');
  questionDiv.className = 'question-block';
  questionDiv.setAttribute('data-question-id', questionCount);

  const questionText = data?.question || '';
  const questionType = data?.type || 'multiple';
  const marks = data?.marks || 1;
  const correctAnswer = data?.correctAnswer || '';
  const options = data?.options || ['', '', '', ''];

  questionDiv.innerHTML = `
    <h3>Question ${questionCount + 1}</h3>
    <button type="button" class="remove-question-btn" style="float:right;">Remove Question</button>

    <label>Question Text:</label>
    <input type="text" name="questionText${questionCount}" value="${escapeHtml(questionText)}" required />

    <label>Question Type:</label>
    <select name="questionType${questionCount}" onchange="toggleOptions(this, ${questionCount})">
      <option value="multiple" ${questionType === 'multiple' ? 'selected' : ''}>Multiple Choice</option>
      <option value="truefalse" ${questionType === 'truefalse' ? 'selected' : ''}>True / False</option>
      <option value="fillblank" ${questionType === 'fillblank' ? 'selected' : ''}>Fill in the Blank</option>
    </select>

    <div class="options" id="options${questionCount}" style="display: ${questionType === 'multiple' ? 'block' : 'none'};">
      <label>Option A:</label>
      <input type="text" name="optionA${questionCount}" value="${escapeHtml(options[0])}" ${questionType === 'multiple' ? 'required' : ''} />
      <label>Option B:</label>
      <input type="text" name="optionB${questionCount}" value="${escapeHtml(options[1])}" ${questionType === 'multiple' ? 'required' : ''} />
      <label>Option C:</label>
      <input type="text" name="optionC${questionCount}" value="${escapeHtml(options[2])}" ${questionType === 'multiple' ? 'required' : ''} />
      <label>Option D:</label>
      <input type="text" name="optionD${questionCount}" value="${escapeHtml(options[3])}" ${questionType === 'multiple' ? 'required' : ''} />
    </div>

    <label>Correct Answer:</label>
    <input type="text" name="correctAnswer${questionCount}" value="${escapeHtml(correctAnswer)}" required />

    <label>Marks:</label>
    <input type="number" name="marks${questionCount}" value="${marks}" min="1" max="100" required />

    <hr />
  `;

  container.appendChild(questionDiv);

  questionDiv.querySelector('.remove-question-btn').addEventListener('click', () => {
    container.removeChild(questionDiv);
    updateQuestionHeaders();
  });

  questionCount++;
  updateQuestionHeaders();
}

function toggleOptions(select, index) {
  const type = select.value;
  const optionsDiv = document.getElementById(`options${index}`);

  if (type === 'multiple') {
    optionsDiv.style.display = 'block';
    [...optionsDiv.querySelectorAll('input')].forEach(input => input.required = true);
  } else {
    optionsDiv.style.display = 'none';
    [...optionsDiv.querySelectorAll('input')].forEach(input => {
      input.required = false;
      input.value = '';
    });
  }
}

function updateQuestionHeaders() {
  const container = document.getElementById('questions-container');
  const questions = container.querySelectorAll('.question-block');
  questionCount = questions.length;

  questions.forEach((questionDiv, index) => {
    questionDiv.querySelector('h3').textContent = `Question ${index + 1}`;
    questionDiv.setAttribute('data-question-id', index);

    questionDiv.querySelector(`input[name^="questionText"]`).name = `questionText${index}`;
    questionDiv.querySelector(`select[name^="questionType"]`).name = `questionType${index}`;
    questionDiv.querySelector(`input[name^="correctAnswer"]`).name = `correctAnswer${index}`;
    questionDiv.querySelector(`input[name^="marks"]`).name = `marks${index}`;

    const optionsDiv = questionDiv.querySelector('.options');
    optionsDiv.id = `options${index}`;

    const optionA = optionsDiv.querySelector(`input[name^="optionA"]`);
    if (optionA) optionA.name = `optionA${index}`;
    const optionB = optionsDiv.querySelector(`input[name^="optionB"]`);
    if (optionB) optionB.name = `optionB${index}`;
    const optionC = optionsDiv.querySelector(`input[name^="optionC"]`);
    if (optionC) optionC.name = `optionC${index}`;
    const optionD = optionsDiv.querySelector(`input[name^="optionD"]`);
    if (optionD) optionD.name = `optionD${index}`;
  });
}

// Escape HTML helper
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
}

window.addQuestion = addQuestion;
window.toggleOptions = toggleOptions;
