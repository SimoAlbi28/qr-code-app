const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner;
let isScanning = false;
let currentExpanded = null; // id macchinario espanso
let editingNoteId = null; // id nota in modifica

function renderMacchinari() {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    return a[0].localeCompare(b[0]); // ordina per id (qr code)
  });

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = currentExpanded === id;

    const box = document.createElement("div");
    box.className = "macchinario";

    box.innerHTML = `
      <h3>${data.nome.toUpperCase()}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" onclick="toggleDetails('${id}')">${expanded ? "Chiudi" : "Dettagli"}</button>
        <button class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
      </div>
      <div class="details" style="display:${expanded ? "block" : "none"};">
        ${renderNoteForm(id)}
        ${renderNoteList(id)}
      </div>
    `;

    listContainer.appendChild(box);
  });
}

function toggleDetails(id) {
  if (currentExpanded === id) {
    currentExpanded = null;
  } else {
    currentExpanded = id;
    editingNoteId = null;
  }
  renderMacchinari();
}

function salvaMacchinario(id, nome) {
  savedMacchinari[id] = savedMacchinari[id] || { nome: "", note: [] };
  savedMacchinari[id].nome = nome;
  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  if (currentExpanded === id) currentExpanded = null;
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function renderNoteForm(macchinarioId) {
  const note = savedMacchinari[macchinarioId].note || [];
  const noteDaModificare = editingNoteId && note.find(n => n.id === editingNoteId);
  return `
    <form class="note-form" onsubmit="return salvaNota(event, '${macchinarioId}')">
      <label for="data">Data (gg/mm/aaaa):</label>
      <input type="text" id="data" name="data" maxlength="10" placeholder="gg/mm/aaaa" pattern="\\d{2}/\\d{2}/\\d{4}" required
        value="${noteDaModificare ? noteDaModificare.data : ''}" />
      
      <label for="desc">Descrizione (max 100 caratteri):</label>
      <input type="text" id="desc" name="desc" maxlength="100" required
        value="${noteDaModificare ? noteDaModificare.desc : ''}" />
      
      <div class="btns-macchinario">
        <button type="submit" class="btn-green">${editingNoteId ? "Salva Modifica" : "Aggiungi Nota"}</button>
        ${editingNoteId ? `<button type="button" class="btn-red" onclick="annullaModifica()">Annulla</button>` : ""}
      </div>
    </form>
  `;
}

function renderNoteList(macchinarioId) {
  let note = savedMacchinari[macchinarioId].note || [];
  // Ordina le note per data decrescente (recenti sopra)
  note = note.slice().sort((a, b) => {
    // Converti stringa "gg/mm/aaaa" in data vera
    const parseData = d => {
      const [gg, mm, aaaa] = d.split("/");
      return new Date(`${aaaa}-${mm}-${gg}`);
    };
    return parseData(b.data) - parseData(a.data);
  });

  if (note.length === 0) return `<p>Nessuna nota.</p>`;

  return `
    <ul class="note-list">
      ${note.map(n => `
        <li>
          <span class="nota-data">${n.data}</span>
          <p class="nota-desc">${n.desc}</p>
          <div class="btns-note">
            <button class="btn-blue" onclick="modificaNota('${macchinarioId}', '${n.id}')">Modifica</button>
            <button class="btn-red" onclick="eliminaNota('${macchinarioId}', '${n.id}')">Elimina</button>
          </div>
        </li>
      `).join("")}
    </ul>
  `;
}

function salvaNota(event, macchinarioId) {
  event.preventDefault();
  const form = event.target;
  const dataInput = form.querySelector('input[name="data"]');
  const descInput = form.querySelector('input[name="desc"]');

  // Validazione semplice formato data gg/mm/aaaa
  const dataVal = dataInput.value.trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataVal)) {
    alert("Data non valida. Usa il formato gg/mm/aaaa.");
    return false;
  }

  const descVal = descInput.value.trim();
  if (descVal.length === 0 || descVal.length > 100) {
    alert("Descrizione obbligatoria, max 100 caratteri.");
    return false;
  }

  const note = savedMacchinari[macchinarioId].note || [];

  if (editingNoteId) {
    // modifica nota
    const notaIndex = note.findIndex(n => n.id === editingNoteId);
    if (notaIndex >= 0) {
      note[notaIndex].data = dataVal;
      note[notaIndex].desc = descVal;
    }
    editingNoteId = null;
  } else {
    // nuova nota, id randomico
    note.push({ id: generateId(), data: dataVal, desc: descVal });
  }

  savedMacchinari[macchinarioId].note = note;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
  return false;
}

function annullaModifica() {
  editingNoteId = null;
  renderMacchinari();
}

function modificaNota(macchinarioId, notaId) {
  editingNoteId = notaId;
  currentExpanded = macchinarioId;
  renderMacchinari();
}

function eliminaNota(macchinarioId, notaId) {
  let note = savedMacchinari[macchinarioId].note || [];
  note = note.filter(n => n.id !== notaId);
  savedMacchinari[macchinarioId].note = note;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

// ID casuale semplice per note
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// QR Code Scanner

startBtn.addEventListener("click", () => {
  if (isScanning) return;
  reader.classList.remove("hidden");
  html5QrcodeScanner = new Html5Qrcode("reader");
  isScanning = true;
  stopBtn.disabled = false;
  startBtn.disabled = true;

  const config = { fps: 10, qrbox: 250, experimentalFeatures: { useBarCodeDetectorIfSupported: true } };

  html5QrcodeScanner.start(
    { facingMode: "environment" },
    config,
    qrCodeMessage => {
      // Quando scanner riconosce QR
      stopScanner();

      if (!savedMacchinari[qrCodeMessage]) {
        const nome = prompt("Nuovo macchinario trovato, inserisci il nome:");
        if (nome && nome.trim() !== "") {
          salvaMacchinario(qrCodeMessage, nome.trim());
          currentExpanded = qrCodeMessage;
        }
      } else {
        alert("Macchinario già presente.");
        currentExpanded = qrCodeMessage;
      }
      renderMacchinari();
    },
    err => {
      // Ignora errori di scansione, normale
      // console.log(err);
    }
  ).catch(err => {
    alert("Errore avvio fotocamera: " + err);
    stopScanner();
  });
});

stopBtn.addEventListener("click", () => {
  stopScanner();
});

function stopScanner() {
  if (html5QrcodeScanner && isScanning) {
    html5QrcodeScanner.stop().then(() => {
      html5QrcodeScanner.clear();
      isScanning = false;
      stopBtn.disabled = true;
      startBtn.disabled = false;
      reader.classList.add("hidden");
    }).catch(err => {
      alert("Errore durante stop fotocamera: " + err);
    });
  }
}

renderMacchinari();
