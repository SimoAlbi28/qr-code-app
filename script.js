const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let isScanning = false;
let html5QrcodeScanner = null;
let editingNoteId = null;
let currentExpanded = null;

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function formatDateToDMY(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const day = ("0" + d.getDate()).slice(-2);
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateToISO(dmyDate) {
  const parts = dmyDate.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function renderMacchinari() {
  listContainer.innerHTML = "";

  Object.entries(savedMacchinari).forEach(([id, data]) => {
    const expanded = id === currentExpanded;
    const macDiv = document.createElement("div");
    macDiv.className = "macchinario";

    let notesHtml = "";
    if (expanded) notesHtml = renderNoteListHtml(id);

    macDiv.innerHTML = `
      <h3>${data.nome}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" onclick="toggleExpand('${id}')">${expanded ? "Chiudi Dettagli" : "Dettagli"}</button>
        <button class="btn-blue" onclick="modificaMacchinario('${id}')">Rinomina</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
      </div>
      ${notesHtml}
      ${expanded ? renderNoteForm(id) : ""}
    `;

    listContainer.appendChild(macDiv);
  });
}

function toggleExpand(id) {
  currentExpanded = currentExpanded === id ? null : id;
  editingNoteId = null;
  renderMacchinari();
}

function salvaMacchinario(id, nome) {
  savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    if (currentExpanded === id) currentExpanded = null;
    renderMacchinari();
  }
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function renderNoteForm(macchinarioId) {
  const note = savedMacchinari[macchinarioId].note || [];
  let dataVal = "";
  let descVal = "";
  let buttonText = "Aggiungi Nota";

  if (editingNoteId) {
    const noteObj = note.find(n => n.id === editingNoteId);
    if (noteObj) {
      dataVal = formatDateToISO(noteObj.data);
      descVal = noteObj.desc;
      buttonText = "Salva Modifica";
    }
  }

  return `
    <form class="note-form" onsubmit="return aggiungiNota(event, '${macchinarioId}')">
      <label for="nota-data">Data (gg/mm/aaaa):</label>
      <input type="date" id="nota-data" name="nota-data" value="${dataVal}" required />
      <label for="nota-desc">Descrizione (max 100 caratteri):</label>
      <input type="text" id="nota-desc" name="nota-desc" maxlength="100" value="${descVal}" required />
      <div class="btns-note">
        <button type="submit" class="btn-green">${buttonText}</button>
        <button type="button" class="btn-red" onclick="annullaModificaNota()">Annulla</button>
      </div>
    </form>
  `;
}

function renderNoteListHtml(macchinarioId) {
  const note = savedMacchinari[macchinarioId].note || [];
  // Ordina per data discendente (più recente in alto)
  note.sort((a, b) => {
    const dA = new Date(formatDateToISO(a.data));
    const dB = new Date(formatDateToISO(b.data));
    return dB - dA;
  });

  return `
    <ul class="note-list">
      ${note.map(n => `
        <li>
          <div class="nota-data">${n.data}</div>
          <div class="nota-desc">${n.desc}</div>
          <div class="btns-note">
            <button class="btn-blue" onclick="modificaNota('${macchinarioId}', '${n.id}')">Modifica</button>
            <button class="btn-red" onclick="eliminaNota('${macchinarioId}', '${n.id}')">Elimina</button>
          </div>
        </li>
      `).join("")}
    </ul>
  `;
}

function aggiungiNota(event, macchinarioId) {
  event.preventDefault();

  const form = event.target;
  const dataInput = form.querySelector("input[name='nota-data']");
  const descInput = form.querySelector("input[name='nota-desc']");
  const dataVal = dataInput.value;
  const descVal = descInput.value.trim();

  if (!dataVal || !descVal) {
    alert("Compila tutti i campi");
    return false;
  }

  if (!savedMacchinari[macchinarioId].note) savedMacchinari[macchinarioId].note = [];

  if (editingNoteId) {
    // Modifica
    const note = savedMacchinari[macchinarioId].note;
    const idx = note.findIndex(n => n.id === editingNoteId);
    if (idx > -1) {
      note[idx].data = formatDateToDMY(dataVal);
      note[idx].desc = descVal;
    }
    editingNoteId = null;
  } else {
    // Aggiungi nuova nota
    savedMacchinari[macchinarioId].note.push({
      id: generateId(),
      data: formatDateToDMY(dataVal),
      desc: descVal
    });
  }

  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
  return false;
}

function annullaModificaNota() {
  editingNoteId = null;
  renderMacchinari();
}

function modificaNota(macchinarioId, notaId) {
  editingNoteId = notaId;
  currentExpanded = macchinarioId;
  renderMacchinari();
}

function eliminaNota(macchinarioId, notaId) {
  if (confirm("Eliminare questa nota?")) {
    const note = savedMacchinari[macchinarioId].note || [];
    savedMacchinari[macchinarioId].note = note.filter(n => n.id !== notaId);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function onScanSuccess(decodedText, decodedResult) {
  if (!savedMacchinari[decodedText]) {
    // Nuovo macchinario, chiedi nome
    let nome = prompt("Nuovo macchinario trovato, inserisci il nome:");
    if (nome && nome.trim() !== "") {
      savedMacchinari[decodedText] = { nome: nome.trim(), note: [] };
      localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
      currentExpanded = decodedText;
      renderMacchinari();
      stopScan();
    }
  } else {
    currentExpanded = decodedText;
    renderMacchinari();
    stopScan();
  }
}

function startScan() {
  if (isScanning) return;

  html5QrcodeScanner = new Html5Qrcode("reader");
  html5QrcodeScanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: 250
    },
    onScanSuccess
  ).then(() => {
    isScanning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    document.getElementById("reader").classList.remove("hidden");
  }).catch(err => {
    alert("Errore nell'attivare la fotocamera: " + err);
  });
}

function stopScan() {
  if (!isScanning) return;

  html5QrcodeScanner.stop().then(() => {
    html5QrcodeScanner.clear();
    isScanning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    document.getElementById("reader").classList.add("hidden");
  }).catch(err => {
    alert("Errore nello spegnere la fotocamera: " + err);
  });
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

renderMacchinari();
