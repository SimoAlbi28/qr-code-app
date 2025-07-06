const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner;

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    return a[1].nome.localeCompare(b[1].nome);
  });

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === highlightId;
    const box = document.createElement("div");
    box.className = "macchinario" + (expanded ? " expanded" : "");
    box.innerHTML = `
      <div class="nome-e-btn">
        <h3>${data.nome}</h3>
        <button class="toggle-btn" onclick="toggleMacchinario('${id}')">${expanded ? "🔽" : "🔼"}</button>
      </div>
      ${expanded ? `
        <ul class="note-list" id="note-list-${id}">
          ${data.note ? [...data.note]
            .sort((a, b) => {
              const d1 = a.data.split("/").reverse().join("-");
              const d2 = b.data.split("/").reverse().join("-");
              return d2.localeCompare(d1);
            })
            .map((nota, idx) => `
              <li>
                <p class="nota-data">${nota.data}</p>
                <p class="nota-desc">${nota.desc}</p>
                <div class="btns-note">
                  <button class="btn-blue" onclick="modificaNota('${id}', ${idx})">✏️</button>
                  <button class="btn-red" onclick="eliminaNota('${id}', ${idx})">🗑️</button>
                </div>
              </li>
          `).join("") : ""}
        </ul>
        <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
          <label for="data-${id}">Data (gg/mm/aaaa):</label>
          <input type="date" id="data-${id}" name="data" required />
          <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
          <input type="text" id="desc-${id}" name="desc" maxlength="50" required />
          <button type="submit" class="btn-green">Aggiungi Nota</button>
        </form>
        <div class="btns-macchinario">
          <button class="renomina btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
          <button class="elimina btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
        </div>
      ` : ""}
    `;
    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome, note: [] };
  else savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome) {
    salvaMacchinario(id, nuovoNome);
  }
}

function toggleMacchinario(id) {
  const expanded = document.querySelector(`.macchinario.expanded`);
  if (expanded && expanded.querySelector("h3").textContent === savedMacchinari[id].nome) {
    renderMacchinari();
  } else {
    renderMacchinari(id);
  }
}

function aggiungiNota(e, id) {
  e.preventDefault();
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);

  const data = dataInput.value.split("-").reverse().join("/"); // yyyy-mm-dd -> dd/mm/yyyy
  const desc = descInput.value.trim();

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];

  savedMacchinari[id].note.push({ data, desc });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function modificaNota(id, idx) {
  const nota = savedMacchinari[id].note[idx];
  const nuovaData = prompt("Nuova data (gg/mm/aaaa):", nota.data);
  const nuovaDesc = prompt("Nuova descrizione (max 50 caratteri):", nota.desc);
  if (nuovaData && nuovaDesc && nuovaDesc.length <= 50) {
    savedMacchinari[id].note[idx] = { data: nuovaData, desc: nuovaDesc };
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  } else {
    alert("Inserimento non valido o descrizione troppo lunga!");
  }
}

function eliminaNota(id, idx) {
  savedMacchinari[id].note.splice(idx, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

async function checkCameraPermission() {
  if (!navigator.permissions) return false;

  try {
    const status = await navigator.permissions.query({ name: 'camera' });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

function startScan() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5QrcodeScanner = new Html5Qrcode("reader", { videoConstraints: { facingMode: "environment" } });

  html5QrcodeScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 280, height: 280 } },
    onScanSuccess,
    (error) => {}
  ).catch(err => {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function stopScan() {
  if (!html5QrcodeScanner) return;
  html5QrcodeScanner.stop().then(() => {
    reader.classList.add("hidden");
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }).catch((err) => {
    alert("Errore nel fermare la fotocamera: " + err);
  });
}

async function startScanWithPermissionCheck() {
  const granted = await checkCameraPermission();
  if (granted) {
    startScan();
  } else {
    startScan(); // parte comunque, browser chiederà permesso se necessario
  }
}

function onScanSuccess(decodedText) {
  stopScan();

  if (!savedMacchinari[decodedText]) {
    const nome = prompt("Nome del macchinario:");
    if (nome) {
      salvaMacchinario(decodedText, nome);
    }
  } else {
    renderMacchinari(decodedText);
  }
}

startBtn.addEventListener("click", () => {
  startScanWithPermissionCheck();
});

stopBtn.addEventListener("click", () => {
  stopScan();
});

renderMacchinari();
