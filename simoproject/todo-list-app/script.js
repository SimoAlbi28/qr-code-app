window.onload = () => {
  const BASE_PATH = './';

  const taskText = document.getElementById('task-text');
  const taskDate = document.getElementById('task-date');
  const taskTime = document.getElementById('task-time');
  const addTaskBtn = document.getElementById('add-task');
  const tasksContainer = document.getElementById('tasks-container');

  const filterDate = document.getElementById('filter-date');
  const resetFilterBtn = document.getElementById('reset-filter');

  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const toggleNotifiche = document.getElementById('toggle-notifiche');

  const today = new Date().toISOString().split('T')[0];
  taskDate.min = today;
  filterDate.min = today;

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let notificheAttive = JSON.parse(localStorage.getItem('notificheAttive')) ?? true;
  let filteredDate = null;
  let editingIndex = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').then(() => {
      console.log('✅ Service Worker registrato');
    });
  }

  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('✅ Notifiche abilitate');
      }
    });
  }

  function formatDateIT(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  function salva() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('notificheAttive', JSON.stringify(notificheAttive));
  }

  function resetForm() {
    taskText.value = '';
    taskDate.value = '';
    taskTime.value = '';
    addTaskBtn.textContent = 'Aggiungi';
    editingIndex = null;
    taskTime.removeAttribute('min');
  }

  taskDate.addEventListener('change', () => {
    const selectedDate = taskDate.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate === today) {
      const now = new Date();
      const ore = String(now.getHours()).padStart(2, '0');
      const minuti = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${ore}:${minuti}`;
      taskTime.min = currentTime;

      if (taskTime.value && taskTime.value < currentTime) {
        taskTime.value = currentTime;
      }
    } else {
      taskTime.removeAttribute('min');
    }
  });

  function renderTasks() {
    tasksContainer.innerHTML = '';

    let tasksToShow = [...tasks];
    if (filteredDate) {
      tasksToShow = tasks.filter(t => t.date === filteredDate);
    }

    tasksToShow.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA - dateB;
    });

    if (tasksToShow.length === 0) {
      const msg = document.createElement('div');
      msg.textContent = '🟢 Libero !!!';
      msg.style.color = 'green';
      msg.style.fontWeight = '700';
      msg.style.fontSize = '1.3rem';
      msg.style.textAlign = 'center';
      tasksContainer.appendChild(msg);
      return;
    }

    const now = new Date();

    tasksToShow.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card';

      const datetimeDiv = document.createElement('div');
      datetimeDiv.className = 'task-datetime';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      dateSpan.textContent = formatDateIT(task.date);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'task-time';
      timeSpan.textContent = task.time || '-';

      datetimeDiv.appendChild(dateSpan);
      datetimeDiv.appendChild(timeSpan);

      const descDiv = document.createElement('div');
      descDiv.className = 'task-desc';
      descDiv.textContent = task.description;

      const countdownDiv = document.createElement('div');
      countdownDiv.style.color = 'red';
      countdownDiv.style.fontWeight = 'bold';
      countdownDiv.style.fontSize = '1rem';

      // Calcola momento scadenza evento
      let expiry = null;
      const taskDateTime = new Date(`${task.date}T${task.time || '00:00'}`);

      if (!task.time) {
        // Solo data: scade 00:01 del giorno dopo
        expiry = new Date(taskDateTime);
        expiry.setDate(expiry.getDate() + 1);
        expiry.setHours(0, 1, 0, 0);
      } else {
        // Data + ora: scade un minuto dopo l'ora inserita
        expiry = new Date(taskDateTime);
        expiry.setMinutes(expiry.getMinutes() + 1);
      }

      // Data auto-eliminazione = 3 mesi dopo la scadenza
      const autoDeleteDate = new Date(expiry);
      autoDeleteDate.setMonth(autoDeleteDate.getMonth() + 3);

      if (now >= autoDeleteDate) {
        // Auto-elimina
        tasks.splice(tasks.indexOf(task), 1);
        salva();
        renderTasks();
        return;
      }

      if (now >= expiry) {
        // Evento scaduto, mostra messaggio rosso
        countdownDiv.textContent = `⚠️ Questo evento è scaduto! Si Auto-Eliminerà il ${formatDateIT(autoDeleteDate.toISOString().split('T')[0])}`;
        card.appendChild(countdownDiv);
      }

      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'task-buttons';

      const editBtn = document.createElement('button');
      editBtn.className = 'task-btn edit';
      editBtn.textContent = '✏️ Modifica';

      const originalIndex = tasks.indexOf(task);
      editBtn.onclick = () => startEditTask(originalIndex);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-btn delete';
      deleteBtn.textContent = '🗑️ Elimina';
      deleteBtn.onclick = () => {
        if (confirm('Sei sicuro di voler eliminare questa attività?')) {
          tasks.splice(originalIndex, 1);
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

  function addTaskHandler() {
    const description = taskText.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (!description || !date) {
      alert('Completa almeno descrizione e data!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date === todayStr && time) {
      const now = new Date();
      const [hh, mm] = time.split(':');
      const taskTimeObj = new Date();
      taskTimeObj.setHours(parseInt(hh), parseInt(mm), 0, 0);

      if (taskTimeObj < now) {
        alert('Devi inserire un orario > di quello attuale !');
        return;
      }
    }

    if (editingIndex !== null) {
      tasks[editingIndex] = { description, date, time };
      editingIndex = null;
      addTaskBtn.textContent = 'Aggiungi';
    } else {
      tasks.push({ description, date, time });
    }

    salva();
    renderTasks();
    resetForm();

    filteredDate = null;
    filterDate.value = '';
  }

  addTaskBtn.onclick = addTaskHandler;

  function startEditTask(index) {
    const task = tasks[index];
    taskText.value = task.description;
    taskDate.value = task.date;
    taskTime.value = task.time;
    addTaskBtn.textContent = 'Salva Modifica';
    editingIndex = index;
    document.getElementById('input-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  filterDate.onchange = () => {
    filteredDate = filterDate.value || null;
    renderTasks();
  };

  resetFilterBtn.onclick = () => {
    filteredDate = null;
    filterDate.value = '';
    renderTasks();
  };

  settingsBtn.onclick = () => {
    settingsMenu.classList.toggle('show');
  };

  toggleNotifiche.checked = notificheAttive;
  toggleNotifiche.onchange = () => {
    notificheAttive = toggleNotifiche.checked;
    salva();
  };

  // Aggiorna ogni secondo per scritte rosse ed eliminazioni automatiche
  setInterval(renderTasks, 1000);

  renderTasks();
};
