const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const scanStatus = document.getElementById("scan-status");
const startBtn = document.getElementById("start-scan-btn");
const stopBtn = document.getElementById("stop-scan-btn");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let expandedId = null; // macchinari sempre chiusi all’avvio
let html5QrcodeInstance = null;

function renderMacchinari() {
  listContainer.innerHTML = "";

  Object.entries(savedMacchinari).forEach(([id, data]) => {
    const isExpanded = expandedId === id;

    const macchinarioDiv = document.createElement("div");
    macchinarioDiv.className = "macchinario" + (isExpanded ? " expanded" : "");

    macchinarioDiv.innerHTML = `
      <div class="nome-e-btn">
        <h3>${data.nome}</h3>
        <button class="toggle-btn" aria-label="${isExpanded ? "Chiudi" : "Apri"} dettagli" onclick="toggleExpand('${id}')">
          ${isExpanded ? "🔽" : "🔼"}
        </button>
      </div>
      ${isExpanded ? renderNoteSection(id, data) : ""}
      <div class="btns-macchinario">
        <button class="renomina" onclick="rinominaMacchinario('${id}')">Modifica nome</button>
        <button class="elimina" onclick="eliminaMacchinario('${id}')">Elimina macchinario</button>
      </div>
    `;
    listContainer.appendChild(macchinarioDiv);
  });
}

function renderNoteSection(id, data) {
  const noteEntries = Object.entries(data.note || {}).sort((a, b) => a[0] - b[0]);

  let notesHtml = `<ul class="note-list">`;

  noteEntries.forEach(([timestamp, note]) => {
    notesHtml += `
      <li>
        <span class="nota-data">${formatDate(note.data)}</span>
        <p class="nota-desc">${escapeHtml(note.desc)}</p>
        <div class="btns-note">
          <button class="btn-blue" onclick="modificaNota('${id}', ${timestamp})">Modifica</button>
          <button class="btn-red" onclick="eliminaNota('${id}', ${timestamp})">Elimina</button>
        </div>
      </li>
    `;
  });

  notesHtml += `</ul>`;

  notesHtml += `
    <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
      <label for="data-${id}">Data (gg/mm/aaaa):</label>
      <input type="date" id="data-${id}" name="data" required />
      
      <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
      <input type="text" id="desc-${id}" name="desc" maxlength="50" required placeholder="Descrizione..." />

      <button type="submit" class="btn-green">Aggiungi nota</button>
    </form>
  `;

  return notesHtml;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

function aggiungiNota(event, id) {
  event.preventDefault();

  const form = event.target;
  const dataInput = form.querySelector("input[name='data']");
  const descInput = form.querySelector("input[name='desc']");

  if (!dataInput.value || !descInput.value) return;

  if (!savedMacchinari[id].note) savedMacchinari[id].note = {};

  const timestamp = Date.now();

  savedMacchinari[id].note[timestamp] = {
    data: dataInput.value,
    desc: descInput.value.trim().substring(0, 50),
  };

  salvaTutto();

  expandedId = id;
  renderMacchinari();

  form.reset();
}

function modificaNota(idMacchinario, timestamp) {
  const nota = savedMacchinari[idMacchinario].note[timestamp];
  if (!nota) return;

  const nuovaData = prompt("Modifica data (gg/mm/aaaa):", formatDate(nota.data));
  if (!nuovaData) return;

  const parts = nuovaData.split("/");
  if (parts.length !== 3) {
    alert("Formato data non valido, usa gg/mm/aaaa");
    return;
  }
  const dataISO = `${parts[2]}-${parts[1]}-${parts[0]}`;

  const nuovaDesc = prompt("Modifica descrizione (max 50 caratteri):", nota.desc);
  if (!nuovaDesc || nuovaDesc.length > 50) {
    alert("Descrizione troppo lunga o vuota");
    return;
  }

  savedMacchinari[idMacchinario].note[timestamp] = {
    data: dataISO,
    desc: nuovaDesc.trim().substring(0, 50),
  };

  salvaTutto();
  renderMacchinari();
  expandedId = idMacchinario;
}

function eliminaNota(idMacchinario, timestamp) {
  if (!confirm("Sei sicuro di voler eliminare questa nota?")) return;
  delete savedMacchinari[idMacchinario].note[timestamp];
  salvaTutto();
  renderMacchinari();
  expandedId = idMacchinario;
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome macchinario:", savedMacchinari[id].nome);
  if (!nuovoNome) return;
  savedMacchinari[id].nome = nuovoNome.trim();
  salvaTutto();
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (!confirm("Sei sicuro di voler eliminare questo macchinario?")) return;
  delete savedMacchinari[id];
  if (expandedId === id) expandedId = null;
  salvaTutto();
  renderMacchinari();
}

function toggleExpand(id) {
  expandedId = expandedId === id ? null : id;
  renderMacchinari();
}

function salvaTutto() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function onScanSuccess(qrCodeMessage) {
  stopScan();

  if (!savedMacchinari[qrCodeMessage]) {
    const nome = prompt("Nome del macchinario rilevato:");
    if (!nome) {
      alert("Nome non inserito, scansione annullata.");
      return;
    }
    savedMacchinari[qrCodeMessage] = {
      nome: nome.trim(),
      note: {},
    };
    salvaTutto();
    expandedId = qrCodeMessage;
    renderMacchinari();
  } else {
    expandedId = qrCodeMessage;
    renderMacchinari();
  }
}

function startScan() {
  if (html5QrcodeInstance) return;

  reader.hidden = false;
  scanStatus.hidden = false;
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5QrcodeInstance = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
  };

  html5QrcodeInstance.start(
    { facingMode: { exact: "environment" } },
    config,
    onScanSuccess,
    errorMessage => {
      // scan errors ignored silently
    }
  ).catch(err => {
    alert("Errore nell'avviare la fotocamera: " + err);
    stopScan();
  });
}

function stopScan() {
  if (!html5QrcodeInstance) return;

  html5QrcodeInstance.stop()
    .then(() => {
      html5QrcodeInstance.clear();
      html5QrcodeInstance = null;
      reader.hidden = true;
      scanStatus.hidden = true;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    })
    .catch(err => {
      alert("Errore nel fermare la fotocamera: " + err);
    });
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

renderMacchinari();
