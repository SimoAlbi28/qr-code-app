const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const cameraSelection = document.getElementById("camera-selection");
const cameraSelect = document.getElementById("camera-select");
const restartBtn = document.getElementById("restart-scan");
const scanStatus = document.getElementById("scan-status");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeInstance = null;
let currentCameraId = null;
let expandedId = null; // quale macchinario è aperto

function renderMacchinari() {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  entriesOrdinate.forEach(([id, data]) => {
    const isExpanded = id === expandedId;

    const noteListHtml = (data.note || [])
      .map(
        (n, i) => `
      <li>
        <strong class="nota-data">${n.data}</strong>
        <div class="nota-desc">${n.desc.length > 50 ? n.desc.slice(0, 47) + "..." : n.desc}</div>
        <div class="btns-note">
          <button title="Modifica nota" onclick="modificaNota('${id}', ${i})">✏️</button>
          <button title="Elimina nota" onclick="eliminaNota('${id}', ${i})">🗑️</button>
        </div>
      </li>`
      )
      .join("");

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

        ${isExpanded ? `
          <ul class="note-list" aria-label="Note del macchinario">
            ${noteListHtml || '<li><em>Nessuna nota aggiunta</em></li>'}
          </ul>

          <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
            <label for="data-${id}">Data:</label>
            <input id="data-${id}" name="data" type="date" required />

            <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
            <input id="desc-${id}" name="desc" type="text" maxlength="50" placeholder="Es. Verifica manutenzione" required />

            <button type="submit">Aggiungi nota</button>
          </form>

          <div class="btns-macchinario">
            <button title="Rinomina macchinario" onclick="modificaMacchinario('${id}')">✏️ Rinomina</button>
            <button title="Elimina macchinario" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
          </div>
        ` : ""}
      </div>`
    );
  });
}

function toggleExpand(id) {
  expandedId = expandedId === id ? null : id;
  renderMacchinari();
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome: "", note: [] };
  savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    expandedId = null;
    renderMacchinari();
  }
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const dataVal = form.elements["data"].value;
  const descVal = form.elements["desc"].value.trim();

  if (!dataVal || !descVal || descVal.length > 50) {
    alert("Inserisci una data valida e una descrizione di massimo 50 caratteri.");
    return;
  }

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];

  savedMacchinari[id].note.push({ data: dataVal, desc: descVal });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
  expandedId = id; // rimani aperto
}

function eliminaNota(id, notaIndex) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(notaIndex, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
    expandedId = id; // rimani aperto
  }
}

function modificaNota(id, notaIndex) {
  const nota = savedMacchinari[id].note[notaIndex];
  if (!nota) return;

  const nuovaData = prompt("Modifica data (YYYY-MM-DD):", nota.data);
  if (!nuovaData) return;

  const nuovaDesc = prompt("Modifica descrizione (max 50 caratteri):", nota.desc);
  if (!nuovaDesc || nuovaDesc.length > 50) {
    alert("Descrizione non valida o troppo lunga.");
    return;
  }

  nota.data = nuovaData;
  nota.desc = nuovaDesc.trim();
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
  expandedId = id; // rimani aperto
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim().length > 0) {
    salvaMacchinario(id, nuovoNome.trim());
    expandedId = id; // rimani aperto
  }
}

function onScanSuccess(decodedText) {
  if (html5QrcodeInstance) {
    html5QrcodeInstance.stop().then(() => {
      reader.classList.add("hidden");
      scanStatus.textContent = "";
      if (!savedMacchinari[decodedText]) {
        const nome = prompt("Inserisci il nome del macchinario:");
        if (nome && nome.trim().length > 0) {
          salvaMacchinario(decodedText, nome.trim());
          expandedId = decodedText;
        }
      } else {
        expandedId = decodedText;
      }
      renderMacchinari();
    }).catch(console.error);
  }
}

function startScanning(cameraId) {
  if (html5QrcodeInstance) {
    html5QrcodeInstance.stop().then(() => {
      html5QrcodeInstance.clear();
      startScanner(cameraId);
    });
  } else {
    startScanner(cameraId);
  }
}

function startScanner(cameraId) {
  reader.classList.remove("hidden");
  scanStatus.textContent = "Scansione attiva...";
  html5QrcodeInstance = new Html5Qrcode("reader");
  html5QrcodeInstance
    .start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      (error) => {
        // ignore scan errors
      }
    )
    .catch((err) => {
      scanStatus.textContent = "Errore avvio scansione: " + err;
    });
}

function loadCameras() {
  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        cameraSelect.innerHTML = "";
        devices.forEach((device, i) => {
          const option = document.createElement("option");
          option.value = device.id;
          option.text = device.label || `Fotocamera ${i + 1}`;
          cameraSelect.appendChild(option);
        });
        cameraSelection.classList.remove("hidden");
        currentCameraId = devices[0].id;
        startScanning(currentCameraId);
      } else {
        scanStatus.textContent = "Nessuna fotocamera trovata.";
      }
    })
    .catch((err) => {
      scanStatus.textContent = "Errore accesso fotocamere.";
      console.error(err);
    });
}

startBtn.addEventListener("click", () => {
  scanStatus.textContent = "";
  loadCameras();
});

cameraSelect.addEventListener("change", (e) => {
  currentCameraId = e.target.value;
  startScanning(currentCameraId);
});

restartBtn.addEventListener("click", () => {
  startScanning(currentCameraId);
});

// Rendi le funzioni globali perché usate negli onclick inline
window.modificaMacchinario = modificaMacchinario;
window.eliminaMacchinario = eliminaMacchinario;
window.toggleExpand = toggleExpand;
window.aggiungiNota = aggiungiNota;
window.eliminaNota = eliminaNota;
window.modificaNota = modificaNota;

renderMacchinari();
