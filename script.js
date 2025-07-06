const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let expandedId = null;
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
      ${
        isExpanded
          ? `
        <ul class="note-list">
          ${data.note && data.note.length
            ? data.note
                .map(
                  (nota, idx) => `
            <li>
              <span class="nota-data">${formatDate(nota.data)}</span>
              <p class="nota-desc">${escapeHtml(nota.desc)}</p>
              <div class="btns-note">
                <button onclick="modificaNota('${id}', ${idx})">Modifica</button>
                <button onclick="eliminaNota('${id}', ${idx})">Elimina</button>
              </div>
            </li>
          `
                )
                .join("")
            : `<li>Nessuna nota</li>`
          }
        </ul>
        <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
          <label for="data-${id}">Data (gg/mm/aaaa):</label>
          <input id="data-${id}" name="data" type="date" required />

          <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
          <input id="desc-${id}" name="desc" type="text" maxlength="50" placeholder="Descrizione" required />

          <button type="submit">Aggiungi nota</button>
        </form>

        <div class="btns-macchinario">
          <button class="renomina" onclick="modificaMacchinario('${id}')">Rinomina macchinario</button>
          <button class="elimina" onclick="eliminaMacchinario('${id}')">Elimina macchinario</button>
        </div>
      `
          : ""
      }
    `;
    listContainer.appendChild(macchinarioDiv);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome: nome, note: [] };
  else savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    if (expandedId === id) expandedId = null;
    renderMacchinari();
  }
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim().length > 0) {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function toggleExpand(id) {
  if (expandedId === id) expandedId = null;
  else expandedId = id;
  renderMacchinari();
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const data = form.data.value;
  const desc = form.desc.value.trim();

  if (!data) {
    alert("Inserisci una data valida.");
    return;
  }
  if (!desc || desc.length > 50) {
    alert("Descrizione obbligatoria e max 50 caratteri.");
    return;
  }

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];
  savedMacchinari[id].note.push({ data, desc });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));

  form.reset();
  renderMacchinari();
}

function eliminaNota(id, index) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  if (!nota) return;

  const nuovaData = prompt("Nuova data (gg/mm/aaaa):", nota.data);
  if (!nuovaData) return;

  const nuovaDesc = prompt("Nuova descrizione (max 50 caratteri):", nota.desc);
  if (!nuovaDesc || nuovaDesc.length > 50) return alert("Descrizione max 50 caratteri.");

  savedMacchinari[id].note[index] = { data: nuovaData, desc: nuovaDesc };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function startScanner() {
  if (!html5QrcodeInstance) {
    html5QrcodeInstance = new Html5Qrcode("reader");
  }

  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[devices.length - 1].id; // posteriore
        html5QrcodeInstance
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
          )
          .catch((err) => alert("Errore avvio fotocamera: " + err));
      } else {
        alert("Nessuna fotocamera trovata.");
      }
    })
    .catch((err) => alert("Errore accesso fotocamera: " + err));
}

function onScanSuccess(decodedText) {
  html5QrcodeInstance.stop().then(() => {
    if (!savedMacchinari[decodedText]) {
      const nome = prompt("Nome del macchinario:");
      if (nome && nome.trim().length > 0) {
        salvaMacchinario(decodedText, nome.trim());
        expandedId = decodedText;
      }
    } else {
      expandedId = decodedText;
    }
    renderMacchinari();
  });
}

// Avvia scanner subito
startScanner();
renderMacchinari();
