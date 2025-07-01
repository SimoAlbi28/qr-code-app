// Variabili DOM
const taskText = document.getElementById('task-text');
const taskDate = document.getElementById('task-date');
const taskTime = document.getElementById('task-time');
const addTaskBtn = document.getElementById('add-task');
const tasksContainer = document.getElementById('tasks-container');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Registra SW e richiedi permesso notifiche
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('Service Worker registrato');
  });
}

if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('Permesso notifiche concesso');
    }
  });
}

function salva() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  tasksContainer.innerHTML = '';
  tasks.forEach((task, index) => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const datetimeDiv = document.createElement('div');
    datetimeDiv.className = 'task-datetime';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'task-date';
    dateSpan.textContent = task.date;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-time';
    timeSpan.textContent = task.time;

    datetimeDiv.appendChild(dateSpan);
    datetimeDiv.appendChild(timeSpan);

    const descDiv = document.createElement('div');
    descDiv.className = 'task-desc';
    descDiv.textContent = task.description;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'task-buttons';

    // Modifica
    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit';
    editBtn.textContent = '✏️ Modifica';
    editBtn.onclick = () => startEditTask(index);

    // Elimina
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete';
    deleteBtn.textContent = '🗑️ Elimina';
    deleteBtn.onclick = () => {
      if (confirm('Sei sicuro di voler eliminare questa attività?')) {
        tasks.splice(index, 1);
        salva();
        renderTasks();
      }
    };

    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(deleteBtn);

    card.appendChild(datetimeDiv);
    card.appendChild(descDiv);
    card.appendChild(buttonsDiv);

    tasksContainer.appendChild(card);
  });
}

// Funzione per schedulare notifiche 1h prima
function scheduleNotification(task) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const eventDate = new Date(task.date + 'T' + task.time);
  const notifyTime = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1h prima
  const now = new Date();
  const diffMs = notifyTime - now;

  if (diffMs > 0) {
    setTimeout(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Promemoria Attività', {
          body: `Tra 1 ora: ${task.description}`,
          icon: 'icon.png',
          badge: 'badge.png',
          tag: 'reminder-' + task.date + task.time
        });
      });
    }, diffMs);
  }
}

// Aggiungi attività
addTaskBtn.onclick = () => {
  const description = taskText.value.trim();
  const date = taskDate.value;
  const time = taskTime.value;

  if (!description || !date || !time) {
    alert('Completa tutti i campi!');
    return;
  }

  const newTask = { description, date, time };
  tasks.push(newTask);
  salva();
  renderTasks();
  scheduleNotification(newTask);

  // Reset form
  taskText.value = '';
  taskDate.value = '';
  taskTime.value = '';
};

// Modifica attività
function startEditTask(index) {
  const task = tasks[index];
  taskText.value = task.description;
  taskDate.value = task.date;
  taskTime.value = task.time;

  addTaskBtn.textContent = 'Salva Modifica';

  addTaskBtn.onclick = () => {
    const description = taskText.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (!description || !date || !time) {
      alert('Completa tutti i campi!');
      return;
    }

    tasks[index] = { description, date, time };
    salva();
    renderTasks();
    scheduleNotification(tasks[index]);

    // Reset form
    taskText.value = '';
    taskDate.value = '';
    taskTime.value = '';
    addTaskBtn.textContent = 'Aggiungi';

    // Ripristina evento click aggiungi normale
    addTaskBtn.onclick = addTaskHandler;
  };
}

function addTaskHandler() {
  const description = taskText.value.trim();
  const date = taskDate.value;
  const time = taskTime.value;

  if (!description || !date || !time) {
    alert('Completa tutti i campi!');
    return;
  }

  const newTask = { description, date, time };
  tasks.push(newTask);
  salva();
  renderTasks();
  scheduleNotification(newTask);

  taskText.value = '';
  taskDate.value = '';
  taskTime.value = '';
}

addTaskBtn.onclick = addTaskHandler;

renderTasks();
