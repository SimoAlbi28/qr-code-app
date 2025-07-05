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

// Funzione per caricare le fotocamere disponibili e popolare la select
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
      scanStatus.textContent = "Errore nell'accesso alle fotocamere.";
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
      // errori scansione (opzionale)
      // scanStatus.textContent = `Errore scansione: ${error}`;
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

function onScanSuccess(qr) {
  html5QrcodeScanner.clear().then(() => {
    reader.classList.add("hidden");
    scanStatus.textContent = "QR rilevato!";
    if (!savedMacchinari[qr]) {
      const nome = prompt("Inserisci il nome del macchinario:");
      if (nome && nome.trim() !== "") {
        salvaMacchinario(qr, nome.trim());
      }
    } else {
      renderMacchinari(qr);
    }
  });
}

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

function modificaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function toggleExpand(id) {
  const expandedId = document.querySelector(".macchinario.expanded")?.querySelector("h3")?.textContent === savedMacchinari[id].nome ? id : null;
  renderMacchinari(expandedId === id ? null : id);
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const data = form.data.value;
  const desc = form.desc.value.trim();
  if (data && desc) {
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
    form.reset();
  }
}

function eliminaNota(id, index) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  const nuovaData = prompt("Modifica data:", nota.data);
  const nuovaDesc = prompt("Modifica descrizione:", nota.desc);
  if (
    nuovaData &&
    nuovaDesc &&
    nuovaData.trim() !== "" &&
    nuovaDesc.trim() !== ""
  ) {
    savedMacchinari[id].note[index] = { data: nuovaData.trim(), desc: nuovaDesc.trim() };
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

renderMacchinari();
