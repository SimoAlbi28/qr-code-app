const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const cameraSelection = document.getElementById("camera-selection");
const cameraSelect = document.getElementById("camera-select");
const restartBtn = document.getElementById("restart-scan");
const scanStatus = document.getElementById("scan-status");

let html5QrcodeScanner;
let currentCameraId = null;

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

// Carica e popola fotocamere
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
      } else {
        scanStatus.textContent = "Nessuna fotocamera trovata.";
      }
    })
    .catch((err) => {
      scanStatus.textContent = "Errore accesso fotocamere.";
      console.error(err);
    });
}

function startScanner(cameraId) {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear().catch(() => {});
  }
  reader.classList.remove("hidden");
  scanStatus.textContent = "Scansione in corso...";
  html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { fps: 10, qrbox: 250 },
    false
  );
  html5QrcodeScanner.render(
    onScanSuccess,
    (error) => {
      // errori scansione opzionali
    },
    cameraId
  );
}

startBtn.addEventListener("click", () => {
  scanStatus.textContent = "";
  loadCameras();
  startScanner(currentCameraId);
});

cameraSelect.addEventListener("change", (e) => {
  currentCameraId = e.target.value;
  startScanner(currentCameraId);
});

restartBtn.addEventListener("click", () => {
  startScanner(currentCameraId);
});

// Funzioni per gestione macchinari e note

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  // Ordina macchinari per data ultima nota discendente (più recente prima)
  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    const getLastDate = (mac) => {
      if (!mac.note || mac.note.length === 0) return null;
      return mac.note[mac.note.length - 1].data;
    };

    const dateA = getLastDate(a[1]);
    const dateB = getLastDate(b[1]);

    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;

    return dateB.localeCompare(dateA);
  });

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === highlightId;
    const box = document.createElement("div");
    box.className = "macchinario" + (expanded ? " expanded" : "");

    let innerHTML = `
      <div class="macchinario-header">
        <h3 tabindex="0" role="button" aria-expanded="${expanded}" onclick="toggleExpand('${id}')" onkeypress="if(event.key==='Enter') toggleExpand('${id}')">${data.nome}</h3>
        <button class="btn-elimina" title="Elimina macchinario" onclick="eliminaMacchinario('${id}')">🗑️</button>
      </div>
    `;

    if (expanded) {
      innerHTML += `
        <section class="note-section" aria-label="Note di ${data.nome}">
          <h4>Note</h4>
          <ul class="note-list">
            ${data.note && data.note.length > 0
              ? data.note
                  .map(
                    (n, i) => `
            <li>
              <strong>${n.data}</strong>
              <span class="desc">${n.desc.length > 50 ? n.desc.slice(0, 47) + "..." : n.desc}</span>
              <div class="btns">
                <button title="Modifica nota" onclick="modificaNota('${id}', ${i})">✏️</button>
                <button title="Elimina nota" onclick="eliminaNota('${id}', ${i})">🗑️</button>
              </div>
            </li>`
                  )
                  .join("")
              : "<li>Nessuna nota</li>"
            }
          </ul>

          <form onsubmit="aggiungiNota(event, '${id}')">
            <input type="date" name="data" required aria-label="Data nota" />
            <input type="text" name="desc" placeholder="Descrizione (max 50 caratteri)" maxlength="50" required aria-label="Descrizione nota" />
            <button type="submit">➕ Aggiungi nota</button>
          </form>
        </section>
      `;
    }

    box.innerHTML = innerHTML;
    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome: nome, note: [] };
  } else {
    savedMacchinari[id].nome = nome;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function toggleExpand(id) {
  const expanded = document.querySelector(".macchinario.expanded");
  if (expanded && expanded.querySelector("h3").textContent !== savedMacchinari[id].nome) {
    renderMacchinari(id);
  } else {
    renderMacchinari();
  }
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const dataInput = form.elements["data"];
  const descInput = form.elements["desc"];
  const dataVal = dataInput.value;
  const descVal = descInput.value.trim();

  if (!dataVal || !descVal || descVal.length > 50) {
    alert("Inserisci una data valida e una descrizione di massimo 50 caratteri.");
    return;
  }

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];

  savedMacchinari[id].note.push({ data: dataVal, desc: descVal });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function eliminaNota(id, notaIndex) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(notaIndex, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
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
  renderMacchinari(id);
}

function onScanSuccess(decodedText) {
  html5QrcodeScanner.clear().then(() => {
    reader.classList.add("hidden");
    scanStatus.textContent = "";

    if (!savedMacchinari[decodedText]) {
      const nome = prompt("Inserisci il nome del macchinario:");
      if (nome && nome.trim().length > 0) {
        salvaMacchinario(decodedText, nome.trim());
      }
    } else {
      renderMacchinari(decodedText);
    }
  });
}

// Avvio scanner
function startScanning(cameraId) {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear().catch(() => {});
  }
  reader.classList.remove("hidden");
  scanStatus.textContent = "Scansione in corso...";
  html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
  html5QrcodeScanner.render(onScanSuccess, (error) => {}, cameraId);
}

// Carica fotocamere
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
      } else {
        scanStatus.textContent = "Nessuna fotocamera trovata.";
      }
    })
    .catch((err) => {
      scanStatus.textContent = "Errore accesso fotocamere.";
      console.error(err);
    });
}

// Event listeners

startBtn.addEventListener("click", () => {
  scanStatus.textContent = "";
  loadCameras();
  startScanning(currentCameraId);
});

cameraSelect.addEventListener("change", (e) => {
  currentCameraId = e.target.value;
  startScanning(currentCameraId);
});

restartBtn.addEventListener("click", () => {
  startScanning(currentCameraId);
});

// Render iniziale
renderMacchinari();
