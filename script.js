const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskSubject = document.getElementById('taskSubject');
const taskCategory = document.getElementById('taskCategory');
const taskDate = document.getElementById('taskDate');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const completedCount = document.getElementById('completedCount');
const totalCount = document.getElementById('totalCount');
const progressPercent = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const homeworkCount = document.getElementById('homeworkCount');
const revisionCount = document.getElementById('revisionCount');
const examCount = document.getElementById('examCount');
const streakCount = document.getElementById('streakCount');
const themeToggle = document.getElementById('themeToggle');
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');
const calendarGrid = document.getElementById('calendarGrid');
const timerDisplay = document.getElementById('timerDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const timerModeInputs = document.querySelectorAll('[name="timerMode"]');

const quotes = [
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Study while others are sleeping; work while others are loafing.', author: 'William A. Ward' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: 'Small progress is still progress.', author: 'Unknown' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Don’t stop until you’re proud.', author: 'Unknown' }
];

let tasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
let streak = Number(localStorage.getItem('studyStreak') || '0');
let lastCompletedDate = localStorage.getItem('lastCompletedDate') || '';
let currentQuoteIndex = Number(localStorage.getItem('currentQuoteIndex') || '0');
let settings = JSON.parse(localStorage.getItem('studyPlannerSettings') || '{"theme":"dark"}');

let timer = null;
let timerSeconds = 1500;
let isRunning = false;
let activeMode = 'study';

const categoryColors = {
  Homework: '#60a5fa',
  Revision: '#a855f7',
  Assignment: '#38bdf8',
  'Exam Prep': '#f472b6'
};

function saveState() {
  localStorage.setItem('studyTasks', JSON.stringify(tasks));
  localStorage.setItem('studyStreak', String(streak));
  localStorage.setItem('lastCompletedDate', lastCompletedDate);
  localStorage.setItem('studyPlannerSettings', JSON.stringify(settings));
  localStorage.setItem('currentQuoteIndex', String(currentQuoteIndex));
}

function createNotificationSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.15;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.35);
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTasks() {
  const filter = filterCategory.value;
  const query = searchInput.value.trim().toLowerCase();
  taskList.innerHTML = '';

  const filtered = tasks.filter(task => {
    const matchesCategory = filter === 'all' || task.category === filter;
    const matchesSearch = task.title.toLowerCase().includes(query) || task.subject.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  filtered.sort((a, b) => new Date(a.date || Date.now()) - new Date(b.date || Date.now()));

  filtered.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const header = document.createElement('div');
    header.className = 'task-header';

    const title = document.createElement('h4');
    title.className = 'task-title';
    title.textContent = task.title;
    if (task.completed) title.style.textDecoration = 'line-through';

    const badge = document.createElement('span');
    badge.className = `badge ${task.category.replace(/\s/g, '')}`;
    badge.textContent = task.category;
    badge.style.background = `${categoryColors[task.category] || '#7c3aed'}33`;
    badge.style.color = categoryColors[task.category] || '#d8b4fe';

    header.append(title, badge);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.innerHTML = `
      <span>${task.subject || 'General'}</span>
      <span>${task.date ? new Date(task.date).toLocaleDateString() : 'No date'}</span>
      ${task.completed ? '<span class="task-complete">Completed</span>' : ''}
    `;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const completeBtn = document.createElement('button');
    completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
    completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(completeBtn, editBtn, deleteBtn);
    card.append(header, meta, actions);
    taskList.append(card);
  });

  updateProgress();
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const homework = tasks.filter(task => task.category === 'Homework').length;
  const revision = tasks.filter(task => task.category === 'Revision').length;
  const exam = tasks.filter(task => task.category === 'Exam Prep').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  completedCount.textContent = completed;
  totalCount.textContent = total;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  homeworkCount.textContent = homework;
  revisionCount.textContent = revision;
  examCount.textContent = exam;

  streakCount.textContent = streak;
  saveState();
}

function addTask(task) {
  tasks.push(task);
  saveState();
  renderTasks();
  renderCalendar();
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  taskTitle.value = task.title;
  taskSubject.value = task.subject;
  taskCategory.value = task.category;
  taskDate.value = task.date || '';
  taskForm.dataset.editing = id;
  taskForm.querySelector('button[type="submit"]').textContent = 'Save Changes';
}

function deleteTask(id) {
  tasks = tasks.filter(item => item.id !== id);
  saveState();
  renderTasks();
  renderCalendar();
}

function toggleTaskComplete(id) {
  tasks = tasks.map(item => {
    if (item.id !== id) return item;
    const nextCompleted = !item.completed;
    if (nextCompleted && item.completed === false) {
      const today = new Date().toDateString();
      if (lastCompletedDate !== today) {
        streak += 1;
        lastCompletedDate = today;
      }
    }
    return { ...item, completed: nextCompleted };
  });
  saveState();
  renderTasks();
}

function switchTheme() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark', settings.theme === 'dark');
  themeToggle.textContent = settings.theme === 'dark' ? '🌙' : '☀️';
  saveState();
}

function loadTheme() {
  document.body.classList.toggle('dark', settings.theme === 'dark');
  themeToggle.textContent = settings.theme === 'dark' ? '🌙' : '☀️';
}

function populateQuote() {
  const index = currentQuoteIndex % quotes.length;
  quoteText.textContent = `"${quotes[index].text}"`;
  quoteAuthor.textContent = `— ${quotes[index].author}`;
}

function nextQuote() {
  currentQuoteIndex += 1;
  if (currentQuoteIndex >= quotes.length) currentQuoteIndex = 0;
  populateQuote();
  saveState();
}

function renderCalendar() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startDay = startOfMonth.getDay();
  calendarGrid.innerHTML = '';

  for (let i = 0; i < startDay; i++) {
    const spacer = document.createElement('div');
    calendarGrid.append(spacer);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const dayCount = tasks.filter(task => task.date === date.toISOString().slice(0, 10)).length;
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (date.toDateString() === today.toDateString()) cell.classList.add('active');
    cell.innerHTML = `<strong>${day}</strong>${dayCount ? `<span class="day-badge">${dayCount} task${dayCount > 1 ? 's' : ''}</span>` : ''}`;
    calendarGrid.append(cell);
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startPauseBtn.textContent = 'Pause';
  timer = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timer);
      isRunning = false;
      startPauseBtn.textContent = 'Start';
      createNotificationSound();
      activeMode = activeMode === 'study' ? 'break' : 'study';
      setMode(activeMode);
      return;
    }
    timerSeconds -= 1;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  startPauseBtn.textContent = 'Start';
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  activeMode = document.querySelector('[name="timerMode"]:checked').value;
  timerSeconds = activeMode === 'study' ? 1500 : 300;
  updateTimerDisplay();
  startPauseBtn.textContent = 'Start';
}

function setMode(mode) {
  activeMode = mode;
  timerSeconds = mode === 'study' ? 1500 : 300;
  updateTimerDisplay();
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) return;
  const existingTask = taskForm.dataset.editing ? tasks.find(t => t.id === taskForm.dataset.editing) : null;
  const taskData = {
    id: taskForm.dataset.editing || Date.now().toString(),
    title,
    subject: taskSubject.value.trim(),
    category: taskCategory.value,
    date: taskDate.value,
    completed: existingTask ? existingTask.completed : false
  };

  if (taskForm.dataset.editing) {
    tasks = tasks.map(task => task.id === taskData.id ? { ...task, ...taskData } : task);
    delete taskForm.dataset.editing;
    taskForm.querySelector('button[type="submit"]').textContent = 'Add Task';
  } else {
    addTask(taskData);
  }

  taskForm.reset();
  renderTasks();
  renderCalendar();
});

searchInput.addEventListener('input', renderTasks);
filterCategory.addEventListener('change', renderTasks);
themeToggle.addEventListener('click', switchTheme);
newQuoteBtn.addEventListener('click', nextQuote);
startPauseBtn.addEventListener('click', () => {
  if (isRunning) pauseTimer(); else startTimer();
});
resetBtn.addEventListener('click', resetTimer);
timerModeInputs.forEach(input => {
  input.addEventListener('change', event => {
    setMode(event.target.value);
    resetTimer();
  });
});

function init() {
  loadTheme();
  populateQuote();
  renderTasks();
  renderCalendar();
  setMode(activeMode);
  streakCount.textContent = streak;
}

init();
