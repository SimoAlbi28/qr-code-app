const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner = null;
let scanning = false;
let currentEditNote = null; // per modificare nota

function renderMacchinari(expandedId = null) {
  listContainer.innerHTML = "";

  // Ordina macchinari per nome
  const sortedEntries = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  sortedEntries.forEach(([id, data]) => {
    const expanded = id === expandedId;

    const macDiv = document.createElement("div");
    macDiv.className = "macchinario";

    if (!data.note) data.note = [];

    // Ordina note per data desc (più recente sopra)
    data.note.sort((a, b) => {
      const d1 = a.data.split("-").reverse().join("");
      const d2 = b.data.split("-").reverse().join("");
      return d2.localeCompare(d1);
    });

    macDiv.innerHTML = `
      <h3>${data.nome}</h3>
      ${
        expanded
          ? `
      <ul class="note-list">
        ${data.note
          .map(
            (n, i) => `
          <li>
            <div class="nota-data">${formatDate(n.data)}</div>
            <div class="nota-desc">${n.desc}</div>
            <div class="btns-note">
              <button class="btn-blue" onclick="modificaNota('${id}', ${i})">Modifica</button>
              <button class="btn-red" onclick="eliminaNota('${id}', ${i})">Elimina</button>
            </div>
          </li>
        `
          )
          .join("")}
      </ul>

      <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
        <label>Data:</label>
        <input type="date" required />
        <label>Descrizione (max 100 caratteri):</label>
        <input type="text" maxlength="100" required />
        <div class="note-form form-btns">
          <button type="submit" class="btn-green">Aggiungi Nota</button>
          <button type="button" class="btn-red" onclick="resetForm()">Annulla</button>
        </div>
      </form>

      <div class="macchinario-details-btns">
        <button class="btn-blue" onclick="modificaMacchinario('${id}')">Rinomina</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
        <button class="btn-red" onclick="chiudiMacchinario()">Chiudi Dettagli</button>
      </div>
      `
          : `<div class="btns-macchinario">
          <button class="toggle-btn" onclick="espandiMacchinario('${id}')">Dettagli</button>
      </div>`
      }
    `;
    listContainer.appendChild(macDiv);

    if (expanded) {
      // se stiamo modificando nota, riempi i campi
      if (currentEditNote) {
        const form = macDiv.querySelector(".note-form");
        const dataInput = form.querySelector('input[type="date"]');
        const descInput = form.querySelector('input[type="text"]');
        const noteToEdit = data.note[currentEditNote.noteIndex];
        dataInput.value = noteToEdit.data;
        descInput.value = noteToEdit.desc;
      }
    }
  });
}

function formatDate(dateStr) {
  // da yyyy-mm-dd a gg/mm/aa
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}/${mm}/${yyyy.slice(2)}`;
}

function espandiMacchinario(id) {
  currentEditNote = null;
  renderMacchinari(id);
}

function chiudiMacchinario() {
  currentEditNote = null;
  renderMacchinari();
}

function salvaLocalStorage() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function aggiungiNota(e, macId) {
  e.preventDefault();

  const form = e.target;
  const dataInput = form.querySelector('input[type="date"]');
  const descInput = form.querySelector('input[type="text"]');

  if (!dataInput.value || !descInput.value.trim()) return;

  const newNote = {
    data: dataInput.value,
    desc: descInput.value.trim().substring(0, 100),
  };

  if (!savedMacchinari[macId].note) savedMacchinari[macId].note = [];

  if (currentEditNote && currentEditNote.macId === macId) {
    // modifica nota esistente
    savedMacchinari[macId].note[currentEditNote.noteIndex] = newNote;
    currentEditNote = null;
  } else {
    // nuova nota
    savedMacchinari[macId].note.push(newNote);
  }

  salvaLocalStorage();
  form.reset();
  renderMacchinari(macId);
}

function modificaNota(macId, noteIndex) {
  currentEditNote = { macId, noteIndex };
  renderMacchinari(macId);
}

function eliminaNota(macId, noteIndex) {
  if (!confirm("Sei sicuro di eliminare questa nota?")) return;
  savedMacchinari[macId].note.splice(noteIndex, 1);
  salvaLocalStorage();
  renderMacchinari(macId);
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Inserisci il nuovo nome del macchinario:");
  if (nuovoNome && nuovoNome.trim()) {
    savedMacchinari[id].nome = nuovoNome.trim();
    salvaLocalStorage();
    renderMacchinari(id);
  }
}

function eliminaMacchinario(id) {
  if (!confirm("Sei sicuro di eliminare questo macchinario?")) return;
  delete savedMacchinari[id];
  salvaLocalStorage();
  renderMacchinari();
}

function resetForm() {
  currentEditNote = null;
  renderMacchinari();
}

// SCANNER
startBtn.addEventListener("click", () => {
  if (scanning) return;
  startScanner();
});

stopBtn.addEventListener("click", () => {
  if (!scanning) return;
  stopScanner();
});

function startScanner() {
  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5Qrcode("reader");
  }

  // Usa camera posteriore fissa con facingMode: environment
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    // specifica camera posteriore
    facingMode: { exact: "environment" },
  };

  html5QrcodeScanner
    .start(
      { facingMode: { exact: "environment" } },
      config,
      qrCodeMessage => {
        // Quando scansiona il QR
        stopScanner();
        processQRCode(qrCodeMessage);
      },
      errorMessage => {
        // console.log("Scanning error:", errorMessage);
      }
    )
    .then(() => {
      scanning = true;
      reader.classList.add("visible");
      startBtn.disabled = true;
      stopBtn.disabled = false;
    })
    .catch(err => {
      alert("Errore nell'aprire la fotocamera posteriore. Controlla permessi o dispositivo.");
      console.error(err);
    });
}

function stopScanner() {
  if (!html5QrcodeScanner) return;

  html5QrcodeScanner
    .stop()
    .then(() => {
      scanning = false;
      reader.classList.remove("visible");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    })
    .catch(err => {
      console.error("Errore nel fermare la fotocamera:", err);
    });
}

function processQRCode(qrText) {
  const nome = prompt("Nome del macchinario rilevato dal QR:", qrText.trim());
  if (!nome || !nome.trim()) return;

  // id unico con timestamp e random
  const id = "mac-" + Date.now() + "-" + Math.floor(Math.random() * 10000);

  savedMacchinari[id] = {
    nome: nome.trim(),
    note: [],
  };

  salvaLocalStorage();
  renderMacchinari(id);
}

// Al caricamento, renderizzo la lista
renderMacchinari();
