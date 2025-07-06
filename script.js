const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const cameraSelection = document.getElementById("camera-selection");
const cameraSelect = document.getElementById("camera-select");
const scanStatus = document.getElementById("scan-status");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeInstance = null;
let currentCameraId = null;
let expandedId = null;

// Bottone chiudi scansione creato dinamicamente
const stopScanBtn = document.createElement("button");
stopScanBtn.textContent = "✖ Chiudi scansione";
stopScanBtn.classList.add("close-scan-btn");
stopScanBtn.style.display = "none";
cameraSelection.appendChild(stopScanBtn);

// Funzione formatta data gg/mm/aaaa da yyyy-mm-dd
function formatDateIt(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Render macchinari lista
function renderMacchinari() {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  entriesOrdinate.forEach(([id, data]) => {
    const isExpanded = id === expandedId;

    const noteListHtml =
      (data.note || [])
        .map(
          (n, i) => `
      <li>
        <strong class="nota-data">${formatDateIt(n.data)}</strong>
        <div class="nota-desc">${n.desc}</div>
        <div class="btns-note">
          <button title="Modifica nota" onclick="modificaNota('${id}', ${i})">✏️</button>
          <button title="Elimina nota" onclick="eliminaNota('${id}', ${i})">🗑️</button>
        </div>
      </li>`
        )
        .join("") || '<li><em>Nessuna nota aggiunta</em></li>';

    listContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="macchinario${isExpanded ? " expanded" : ""}">
        <div class="nome-e-btn">
          <h3>${data.nome}</h3>
          <button aria-label="${isExpanded ? "Chiudi dettagli" : "Apri dettagli"}" onclick="toggleExpand('${id}')">
            ${isExpanded ? "🔽" : "🔼"}
          </button>
        </div>

        ${
          isExpanded
            ? `
          <ul class="note-list" aria-label="Note del macchinario">
            ${noteListHtml}
          </ul>

          <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
            <label for="data-${id}">Data:</label>
            <input id="data-${id}" name="data" type="date" required />

            <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
            <input id="desc-${id}" name="desc" type="text" maxlength="50" placeholder="Descrizione" required />

            <button type="submit">Aggiungi nota</button>
          </form>

          <div class="btns-macchinario">
            <button onclick="modificaMacchinario('${id}')">Rinomina macchinario</button>
            <button onclick="eliminaMacchinario('${id}')">Elimina macchinario</button>
          </div>
          `
            : ""
        }
      </div>
    `
    );
  });
}

// Salva macchinario in locale
function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome: nome, note: [] };
  else savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

// Elimina macchinario
function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    if (expandedId === id) expandedId = null;
    renderMacchinari();
  }
}

// Modifica nome macchinario
function modificaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim().length > 0) {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

// Toggle espandi/chiudi macchinario
function toggleExpand(id) {
  if (expandedId === id) expandedId = null;
  else expandedId = id;
  renderMacchinari();
}

// Aggiungi nota macchinario
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

// Elimina nota
function eliminaNota(id, index) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

// Modifica nota
function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  if (!nota) return;

  const nuovaData = prompt("Nuova data (aaaa-mm-gg):", nota.data);
  if (!nuovaData) return;

  const nuovaDesc = prompt("Nuova descrizione (max 50 caratteri):", nota.desc);
  if (!nuovaDesc || nuovaDesc.length > 50) return alert("Descrizione max 50 caratteri.");

  savedMacchinari[id].note[index] = { data: nuovaData, desc: nuovaDesc };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

// Inizializza scanner QR
function initScanner() {
  scanStatus.textContent = "Scansione attiva...";
  cameraSelection.style.display = "flex";
  reader.classList.remove("hidden");
  stopScanBtn.style.display = "inline-block";

  if (!html5QrcodeInstance) {
    html5QrcodeInstance = new Html5Qrcode("reader");
  }

  html5QrcodeInstance
    .start(
      currentCameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        html5QrcodeInstance.pause();

        if (!savedMacchinari[decodedText]) {
          const nome = prompt("Nome del macchinario:");
          if (nome && nome.trim().length > 0) {
            salvaMacchinario(decodedText, nome.trim());
            alert("Macchinario salvato!");
            expandedId = decodedText;
          }
        } else {
          expandedId = decodedText;
        }
        renderMacchinari();

        stopScanner();
      },
      (errorMessage) => {
        // errore ignorato o gestito se vuoi
      }
    )
    .catch((err) => {
      alert("Errore nell'avviare la fotocamera: " + err);
      startBtn.classList.remove("hidden");
      cameraSelection.style.display = "none";
      reader.classList.add("hidden");
      stopScanBtn.style.display = "none";
    });
}

// Stop scanner
function stopScanner() {
  if (html5QrcodeInstance) {
    html5QrcodeInstance.stop().then(() => {
      scanStatus.textContent = "";
      cameraSelection.style.display = "none";
      reader.classList.add("hidden");
      stopScanBtn.style.display = "none";
      startBtn.classList.remove("hidden");
    });
  }
}

// Carica liste fotocamere
function loadCameras() {
  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        cameraSelect.innerHTML = "";
        devices.forEach((device) => {
          const option = document.createElement("option");
          option.value = device.id;
          option.text = device.label || `Camera ${device.id}`;
          cameraSelect.appendChild(option);
        });
        currentCameraId = devices[devices.length - 1].id; // default posteriore
        cameraSelect.value = currentCameraId;
      } else {
        alert("Nessuna fotocamera trovata.");
      }
    })
    .catch((err) => {
      alert("Errore nel caricamento fotocamere: " + err);
    });
}

// Event listeners
startBtn.addEventListener("click", () => {
  startBtn.classList.add("hidden");
  loadCameras();
  initScanner();
  renderMacchinari();
});

stopScanBtn.addEventListener("click", () => {
  stopScanner();
});

cameraSelect.addEventListener("change", () => {
  currentCameraId = cameraSelect.value;
  if (html5QrcodeInstance) {
    html5QrcodeInstance.stop().then(() => {
      html5QrcodeInstance
        .start(
          currentCameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            html5QrcodeInstance.pause();

            if (!savedMacchinari[decodedText]) {
              const nome = prompt("Nome del macchinario:");
              if (nome && nome.trim().length > 0) {
                salvaMacchinario(decodedText, nome.trim());
                alert("Macchinario salvato!");
                expandedId = decodedText;
              }
            } else {
              expandedId = decodedText;
            }
            renderMacchinari();

            stopScanner();
          }
        )
        .catch((err) => {
          alert("Errore nel cambio fotocamera: " + err);
        });
    });
  }
});

// Render iniziale
renderMacchinari();
