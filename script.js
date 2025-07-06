const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

let currentExpanded = null;
let editingNoteId = null;
let html5QrcodeScanner = null;
let cameraId = null;

function renderMacchinari() {
  listContainer.innerHTML = "";

  Object.entries(savedMacchinari).forEach(([id, data]) => {
    const isExpanded = currentExpanded === id;
    const macchinarioDiv = document.createElement("div");
    macchinarioDiv.className = "macchinario";

    macchinarioDiv.innerHTML = `
      <h3>${escapeHtml(data.nome)}</h3>
      ${isExpanded ? renderDettagli(id, data) : ""}
    `;

    listContainer.appendChild(macchinarioDiv);
  });
}

function renderDettagli(id, data) {
  let notesHtml = "";

  if (data.note && data.note.length) {
    // Ordino le note per data decrescente (più recenti in alto)
    const sortedNotes = data.note.slice().sort((a, b) => b.data.localeCompare(a.data));

    sortedNotes.forEach((nota, i) => {
      notesHtml += `
        <li>
          <div class="nota-data">${formatDate(nota.data)}</div>
          <div class="nota-desc">${escapeHtml(nota.descrizione)}</div>
          <div class="btns-note">
            <button class="btn-blue" onclick="modificaNota('${id}', ${i})">Modifica</button>
            <button class="btn-red" onclick="eliminaNota('${id}', ${i})">Elimina</button>
          </div>
        </li>
      `;
    });
  }

  const dataValue = editingNoteId !== null && savedMacchinari[id].note[editingNoteId]
    ? savedMacchinari[id].note[editingNoteId].data
    : "";

  const descValue = editingNoteId !== null && savedMacchinari[id].note[editingNoteId]
    ? savedMacchinari[id].note[editingNoteId].descrizione
    : "";

  return `
    <ul class="note-list">${notesHtml}</ul>
    <form class="note-form" onsubmit="event.preventDefault(); salvaNota('${id}')">
      <label for="data-nota">Data (gg/mm/aaaa):</label>
      <input type="date" id="data-nota" name="data-nota" required value="${dataValue}" />
      
      <label for="desc-nota">Descrizione (max 100 caratteri):</label>
      <input type="text" id="desc-nota" name="desc-nota" maxlength="100" required value="${descValue}" />
      
      <div class="btns-macchinario">
        <button type="submit" class="btn-green">${editingNoteId !== null ? "Salva Modifica" : "Aggiungi Nota"}</button>
        <button type="button" class="btn-red" onclick="annullaModificaNota()">Annulla</button>
        <button type="button" class="btn-red" onclick="toggleDettagli('${id}')">Chiudi Dettagli</button>
        <button type="button" class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
        <button type="button" class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
      </div>
    </form>
  `;
}

function toggleDettagli(id) {
  if (currentExpanded === id) {
    currentExpanded = null;
    editingNoteId = null;
    stopScan();
  } else {
    currentExpanded = id;
    editingNoteId = null;
  }
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Inserisci il nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim()) {
    savedMacchinari[id].nome = nuovoNome.trim();
    salvaDati();
    renderMacchinari();
  }
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    if (currentExpanded === id) {
      currentExpanded = null;
      editingNoteId = null;
    }
    salvaDati();
    renderMacchinari();
  }
}

function salvaNota(id) {
  const dataInput = document.querySelector(".note-form #data-nota");
  const descInput = document.querySelector(".note-form #desc-nota");
  if (!dataInput.value || !descInput.value) return alert("Compila tutti i campi!");

  const nota = {
    data: dataInput.value,
    descrizione: descInput.value.trim().substring(0, 100)
  };

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];

  if (editingNoteId !== null) {
    savedMacchinari[id].note[editingNoteId] = nota;
    editingNoteId = null;
  } else {
    savedMacchinari[id].note.push(nota);
  }

  salvaDati();
  renderMacchinari();
}

function modificaNota(id, noteIndex) {
  currentExpanded = id;
  editingNoteId = noteIndex;
  renderMacchinari();
}

function annullaModificaNota() {
  editingNoteId = null;
  renderMacchinari();
}

function eliminaNota(id, noteIndex) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(noteIndex, 1);
    salvaDati();
    renderMacchinari();
  }
}

function salvaDati() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function escapeHtml(text) {
  const map = {
    '&': "&amp;",
    '<': "&lt;",
    '>': "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

// --- Scanner ---

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  try {
    const devices = await Html5Qrcode.getCameras();
    cameraId = devices.find(dev => dev.label.toLowerCase().includes("back"))?.id || devices[0]?.id;

    if (!cameraId) {
      alert("Nessuna fotocamera disponibile");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }

    reader.classList.remove("hidden");

    if (html5QrcodeScanner) {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
    }

    html5QrcodeScanner = new Html5Qrcode("reader");
    await html5QrcodeScanner.start(
      cameraId,
      {
        fps: 10,
        qrbox: 250,
      },
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    );
  } catch (e) {
    alert("Errore nell'avvio della fotocamera: " + e.message);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

stopBtn.addEventListener("click", () => {
  stopScan();
});

async function stopScan() {
  if (html5QrcodeScanner) {
    await html5QrcodeScanner.stop();
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
  }
  reader.classList.add("hidden");
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

async function qrCodeSuccessCallback(decodedText, decodedResult) {
  stopScan();

  if (savedMacchinari[decodedText]) {
    currentExpanded = decodedText;
    editingNoteId = null;
    renderMacchinari();
    alert("Macchinario già registrato: " + savedMacchinari[decodedText].nome);
  } else {
    const nomeMacchinario = prompt("Nuovo macchinario rilevato! Inserisci il nome:");
    if (nomeMacchinario && nomeMacchinario.trim()) {
      savedMacchinari[decodedText] = {
        nome: nomeMacchinario.trim(),
        note: []
      };
      currentExpanded = decodedText;
      editingNoteId = null;
      salvaDati();
      renderMacchinari();
      alert("Macchinario aggiunto!");
    }
  }
}

function qrCodeErrorCallback(errorMessage) {
  // Ignoriamo errori lettura QR
}

renderMacchinari();
