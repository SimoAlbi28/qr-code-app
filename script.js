const listContainer = document.getElementById("macchinari-list");
const readerContainer = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let currentStream = null;
let html5QrScanner = null;
let expandedMacchinarioId = null;
let editingNote = null;

// Start camera with real back camera
async function startCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");
    let backCamera = videoDevices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
    if (!backCamera) backCamera = videoDevices[0];

    if (currentStream) stopCamera();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: backCamera.deviceId ? { exact: backCamera.deviceId } : undefined }
    });
    currentStream = stream;
    readerContainer.classList.remove("hidden");
    startBtn.disabled = true;
    stopBtn.disabled = false;

    html5QrScanner = new Html5Qrcode("reader");
    await html5QrScanner.start(
      { deviceId: { exact: backCamera.deviceId } },
      { fps: 10, qrbox: 250 },
      onScanSuccess,
      onScanFailure
    );
  } catch (e) {
    alert("Errore apertura fotocamera: " + e.message);
    stopCamera();
  }
}

function stopCamera() {
  if (html5QrScanner) {
    html5QrScanner.stop().catch(() => { });
    html5QrScanner.clear();
    html5QrScanner = null;
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  readerContainer.classList.add("hidden");
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// Callback scan success
function onScanSuccess(qrCodeMessage) {
  stopCamera();
  if (!savedMacchinari[qrCodeMessage]) {
    const nome = prompt("Inserisci il nome del macchinario:");
    if (nome && nome.trim() !== "") {
      salvaMacchinario(qrCodeMessage, nome.trim(), []);
      renderMacchinari(qrCodeMessage);
    }
  } else {
    renderMacchinari(qrCodeMessage);
  }
}

function onScanFailure(error) {
  // puoi ignorare o loggare l'errore
  // console.warn(`Scan failed: ${error}`);
}

// Salva/aggiorna macchinario
function salvaMacchinario(id, nome, note) {
  savedMacchinari[id] = { nome, note };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

// Elimina macchinario
function eliminaMacchinario(id) {
  if (confirm("Eliminare il macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

// Rinominare macchinario
function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    savedMacchinari[id].nome = nuovoNome.trim();
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

// Espandi/chiudi macchinario
function toggleMacchinario(id) {
  expandedMacchinarioId = expandedMacchinarioId === id ? null : id;
  editingNote = null;
  renderMacchinari(expandedMacchinarioId);
}

// Render macchinari e note
function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  // Ordina per nome
  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  entriesOrdinate.forEach(([id, data]) => {
    const isExpanded = id === highlightId;

    const macchinarioDiv = document.createElement("div");
    macchinarioDiv.className = "macchinario";

    // Titolo macchinario
    const nomeH3 = document.createElement("h3");
    nomeH3.textContent = data.nome.toUpperCase();
    macchinarioDiv.appendChild(nomeH3);

    // Pulsanti chiudi, rinomina, elimina (solo se espanso)
    if (isExpanded) {
      // Note
      const noteList = document.createElement("ul");
      noteList.className = "note-list";

      // Ordina note per data discendente
      const sortedNotes = data.note.slice().sort((a, b) => b.data.localeCompare(a.data));

      sortedNotes.forEach((nota, idx) => {
        const li = document.createElement("li");

        const dataSpan = document.createElement("div");
        dataSpan.className = "nota-data";
        dataSpan.textContent = formatDate(nota.data);
        li.appendChild(dataSpan);

        const descSpan = document.createElement("div");
        descSpan.className = "nota-desc";
        descSpan.textContent = nota.desc;
        li.appendChild(descSpan);

        const btnsNote = document.createElement("div");
        btnsNote.className = "btns-note";

        // Modifica nota
        const modBtn = document.createElement("button");
        modBtn.textContent = "✏️";
        modBtn.className = "btn-blue";
        modBtn.onclick = () => modificaNota(id, idx);
        btnsNote.appendChild(modBtn);

        // Elimina nota
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.className = "btn-red";
        delBtn.onclick = () => eliminaNota(id, idx);
        btnsNote.appendChild(delBtn);

        li.appendChild(btnsNote);
        noteList.appendChild(li);
      });

      macchinarioDiv.appendChild(noteList);

      // Form aggiungi/modifica nota
      const noteForm = document.createElement("form");
      noteForm.className = "note-form";

      const labelData = document.createElement("label");
      labelData.textContent = "Data (gg/mm/aaaa)";
      noteForm.appendChild(labelData);

      const inputData = document.createElement("input");
      inputData.type = "date";
      inputData.id = "input-data";
      inputData.required = true;
      noteForm.appendChild(inputData);

      const labelDesc = document.createElement("label");
      labelDesc.textContent = "Descrizione (max 100 caratteri)";
      noteForm.appendChild(labelDesc);

      const inputDesc = document.createElement("input");
      inputDesc.type = "text";
      inputDesc.id = "input-desc";
      inputDesc.maxLength = 100;
      inputDesc.required = true;
      noteForm.appendChild(inputDesc);

      // Pulsanti aggiungi/annulla
      const btnsNoteForm = document.createElement("div");
      btnsNoteForm.className = "btns-note";

      const addNoteBtn = document.createElement("button");
      addNoteBtn.type = "submit";
      addNoteBtn.textContent = editingNote !== null ? "Salva" : "Aggiungi";
      addNoteBtn.className = "btn-green";
      btnsNoteForm.appendChild(addNoteBtn);

      const cancelNoteBtn = document.createElement("button");
      cancelNoteBtn.type = "button";
      cancelNoteBtn.textContent = "Annulla";
      cancelNoteBtn.className = "btn-red";
      cancelNoteBtn.onclick = e => {
        e.preventDefault();
        editingNote = null;
        renderMacchinari(id);
      };
      btnsNoteForm.appendChild(cancelNoteBtn);

      noteForm.appendChild(btnsNoteForm);

      noteForm.onsubmit = e => {
        e.preventDefault();
        const d = inputData.value;
        const des = inputDesc.value.trim();
        if (!d || !des) {
          alert("Compila tutti i campi");
          return;
        }
        if (editingNote !== null) {
          data.note[editingNote] = { data: d, desc: des };
          editingNote = null;
        } else {
          data.note.push({ data: d, desc: des });
        }
        salvaMacchinario(id, data.nome, data.note);
        renderMacchinari(id);
      };

      macchinarioDiv.appendChild(noteForm);

      // Pulsanti chiudi, rinomina, elimina macchinario - orizzontali e piccoli
      const btnsMac = document.createElement("div");
      btnsMac.className = "btns-macchinario";

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Chiudi";
      closeBtn.className = "btn-red";
      closeBtn.onclick = () => toggleMacchinario(id);
      btnsMac.appendChild(closeBtn);

      const renameBtn = document.createElement("button");
      renameBtn.textContent = "Rinomina";
      renameBtn.className = "btn-blue";
      renameBtn.onclick = () => rinominaMacchinario(id);
      btnsMac.appendChild(renameBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Elimina";
      deleteBtn.className = "btn-red";
      deleteBtn.onclick = () => eliminaMacchinario(id);
      btnsMac.appendChild(deleteBtn);

      macchinarioDiv.appendChild(btnsMac);
    } else {
      // Solo nome e pulsante espandi
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "Dettagli";
      toggleBtn.className = "toggle-btn";
      toggleBtn.onclick = () => toggleMacchinario(id);
      macchinarioDiv.appendChild(toggleBtn);
    }

    listContainer.appendChild(macchinarioDiv);
  });
}

function modificaNota(idMac, idxNota) {
  editingNote = idxNota;
  renderMacchinari(idMac);
  // Dopo render, setta i valori nel form
  setTimeout(() => {
    const mac = savedMacchinari[idMac];
    if (!mac) return;
    const nota = mac.note[editingNote];
    if (!nota) return;
    const inputData = document.getElementById("input-data");
    const inputDesc = document.getElementById("input-desc");
    if (inputData && inputDesc) {
      inputData.value = nota.data;
      inputDesc.value = nota.desc;
      inputDesc.focus();
    }
  }, 10);
}

function eliminaNota(idMac, idxNota) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[idMac].note.splice(idxNota, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(idMac);
  }
}

function formatDate(isoDate) {
  // isoDate è tipo "2025-07-06"
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Init
renderMacchinari();

startBtn.onclick = () => startCamera();
stopBtn.onclick = () => stopCamera();
