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
            <input id="desc-${id}" name="desc" type="text" maxlength="50" placeholder="Es. Verifica manutenzione" required />

            <button type="submit">Aggiungi nota</button>
          </form>

          <div class="btns-macchinario">
            <button title="Rinomina macchinario" onclick="modificaMacchinario('${id}')">✏️ Rinomina</button>
            <button title="Elimina macchinario" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
          </div>
        `
            : ""
        }
      </div>`
    );
  });
}

// Toggle espandi macchinario
function toggleExpand(id) {
  expandedId = expandedId === id ? null : id;
  renderMacchinari();
}

// Salva o aggiorna macchinario
function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome: "", note: [] };
  savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

// Elimina macchinario
function eliminaMacchinario(id) {
  if (confirm("Eliminare il macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    if (expandedId === id) expandedId = null;
    renderMacchinari();
  }
}

// Modifica nome macchinario
function modificaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim().length > 0) {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

// Aggiungi nota (data + descrizione)
function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const data = form.data.value;
  const desc = form.desc.value.trim();

  if (!data || !desc) return alert("Compila tutti i campi!");

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];
  savedMacchinari[id].note.push({ data, desc });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));

  form.reset();
  renderMacchinari();
}

// Modifica nota
function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  if (!nota) return;

  const nuovaData = prompt("Nuova data (gg/mm/aaaa):", formatDateIt(nota.data));
  if (!nuovaData) return;

  const parts = nuovaData.split("/");
  if (parts.length !== 3) return alert("Formato data non valido!");

  const yyyy_mm_dd = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;

  const nuovaDesc = prompt("Nuova descrizione (max 50 caratteri):", nota.desc);
  if (!nuovaDesc || nuovaDesc.trim().length === 0) return;

  savedMacchinari[id].note[index] = { data: yyyy_mm_dd, desc: nuovaDesc.trim() };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
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

// Funzione stop scanner (chiude tutto)
function stopScanner() {
  if (html5QrcodeInstance) {
    html5QrcodeInstance.stop().then(() => {
      html5QrcodeInstance.clear();
      html5QrcodeInstance = null;
      reader.classList.add("hidden");
      cameraSelection.classList.add("hidden");
      stopScanBtn.style.display = "none";
      startBtn.classList.remove("hidden");
      scanStatus.textContent = "";
    }).catch(err => {
      alert("Errore nello stoppare la fotocamera: " + err);
    });
  }
}

// Init scanner con posteriore di default e UI
async function initScanner() {
  if (html5QrcodeInstance) {
    await html5QrcodeInstance.clear();
    html5QrcodeInstance = null;
  }

  html5QrcodeInstance = new Html5Qrcode("reader");

  const devices = await Html5Qrcode.getCameras();
  if (!devices || devices.length === 0) {
    alert("Nessuna fotocamera trovata");
    startBtn.classList.remove("hidden");
    return;
  }

  // Cerca fotocamera posteriore (back, rear, environment)
  let rearCamera = devices.find(device =>
    /back|rear|posteriore|environment/i.test(device.label)
  );

  currentCameraId = rearCamera ? rearCamera.id : devices[0].id;

  cameraSelect.innerHTML = "";
  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.id;
    option.text = device.label || `Camera ${cameraSelect.length + 1}`;
    cameraSelect.appendChild(option);
  });

  cameraSelect.value = currentCameraId;
  cameraSelection.classList.remove("hidden");
  reader.classList.remove("hidden");
  stopScanBtn.style.display = "inline-block";
  scanStatus.textContent = "Scansione attiva...";

  html5QrcodeInstance.start(
    currentCameraId,
    { fps: 10, qrbox: 250 },
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

      // Chiudi scanner dopo inserimento nome
      stopScanner();
    },
    (errorMessage) => {
      // puoi gestire errori o ignorarli
    }
  ).catch((err) => {
    alert("Errore nell'avviare la fotocamera: " + err);
    startBtn.classList.remove("hidden");
  });
}

// Bottone chiudi scansione manuale
stopScanBtn.addEventListener("click", () => {
  stopScanner();
});

// Cambio fotocamera da select
cameraSelect.addEventListener("change", () => {
  currentCameraId = cameraSelect.value;
  if (html5QrcodeInstance) {
    html5QrcodeInstance.stop().then(() => {
      html5QrcodeInstance
        .start(
          currentCameraId,
          { fps: 10, qrbox: 250 },
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

// Bottone avvia scansione
startBtn.addEventListener("click", () => {
  startBtn.classList.add("hidden");
  initScanner();
  renderMacchinari();
});

// Render iniziale
renderMacchinari();
