const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner = null;

let editNoteInfo = null; // { macchinarioId, noteIndex } se stai modificando una nota

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";
  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    return a[1].nome.localeCompare(b[1].nome);
  });
  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === highlightId;
    const box = document.createElement("div");
    box.className = "macchinario";
    box.innerHTML = `
      <h3>${data.nome.toUpperCase()}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn">${expanded ? "Chiudi" : "Dettagli"}</button>
        <button class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
      </div>
      <div class="details" style="display:${expanded ? "block" : "none"};">
        ${renderNoteForm(id)}
        ${renderNoteList(id)}
      </div>
    `;
    listContainer.appendChild(box);

    box.querySelector(".toggle-btn").onclick = () => {
      if (expanded) {
        editNoteInfo = null;
        renderMacchinari();
      } else {
        editNoteInfo = null;
        renderMacchinari(id);
      }
    };
  });

  if (editNoteInfo) {
    // Se stai modificando una nota, riempi il form coi dati
    const form = document.querySelector(`form[data-macchinario-id="${editNoteInfo.macchinarioId}"]`);
    if (form) {
      const nota = savedMacchinari[editNoteInfo.macchinarioId].note[editNoteInfo.noteIndex];
      if (nota) {
        form.data.value = nota.data;
        form.descrizione.value = nota.descrizione;
        form.querySelector("button[type=submit]").textContent = "Salva Modifica";
      }
    }
  }
}

function renderNoteForm(macchinarioId) {
  // Aggiunto data-macchinario-id per gestire modifica
  return `
    <form data-macchinario-id="${macchinarioId}" onsubmit="aggiungiOModificaNota(event, '${macchinarioId}')">
      <label for="data-${macchinarioId}">Data (gg/mm/aa):</label>
      <input id="data-${macchinarioId}" name="data" type="date" required />
      <label for="descrizione-${macchinarioId}">Descrizione (max 100 caratteri):</label>
      <input id="descrizione-${macchinarioId}" name="descrizione" type="text" maxlength="100" required />
      <button type="submit" class="btn-green">Aggiungi Nota</button>
      <button type="button" class="btn-red" onclick="annullaModifica()">Annulla</button>
    </form>
  `;
}

function renderNoteList(macchinarioId) {
  if (!savedMacchinari[macchinarioId].note || savedMacchinari[macchinarioId].note.length === 0) {
    return "<p>Nessuna nota.</p>";
  }
  // Ordino note per data discendente
  const notes = savedMacchinari[macchinarioId].note.slice().sort((a,b) => b.data.localeCompare(a.data));
  return `<ul class="note-list">
    ${notes.map((nota, i) => `
      <li>
        <span class="nota-data">${formatData(nota.data)}</span>
        <span class="nota-desc">${nota.descrizione}</span>
        <div class="btns-note">
          <button onclick="modificaNota('${macchinarioId}', ${i})" class="btn-blue">Modifica</button>
          <button onclick="eliminaNota('${macchinarioId}', ${i})" class="btn-red">Elimina</button>
        </div>
      </li>
    `).join("")}
  </ul>`;
}

function formatData(isoDate) {
  const d = new Date(isoDate);
  const gg = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth()+1).padStart(2, '0');
  const aa = String(d.getFullYear()).slice(2);
  return `${gg}/${mm}/${aa}`;
}

function aggiungiOModificaNota(e, macchinarioId) {
  e.preventDefault();
  const form = e.target;
  const data = form.data.value;
  const descrizione = form.descrizione.value.trim();
  if (!descrizione) return alert("Descrizione obbligatoria");
  if (!savedMacchinari[macchinarioId].note) savedMacchinari[macchinarioId].note = [];

  if (editNoteInfo && editNoteInfo.macchinarioId === macchinarioId) {
    // Modifica nota
    savedMacchinari[macchinarioId].note[editNoteInfo.noteIndex] = { data, descrizione };
    editNoteInfo = null;
  } else {
    // Aggiungi nota
    savedMacchinari[macchinarioId].note.push({ data, descrizione });
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(macchinarioId);
}

function modificaNota(macchinarioId, index) {
  editNoteInfo = { macchinarioId, noteIndex: index };
  renderMacchinari(macchinarioId);
}

function annullaModifica() {
  editNoteInfo = null;
  renderMacchinari();
}

function eliminaNota(macchinarioId, index) {
  if (!confirm("Sei sicuro di eliminare questa nota?")) return;
  savedMacchinari[macchinarioId].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(macchinarioId);
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    savedMacchinari[id].nome = nuovoNome.trim();
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

startBtn.addEventListener("click", () => {
  if (html5QrcodeScanner) return;
  reader.classList.remove("hidden");
  stopBtn.disabled = false;
  startBtn.disabled = true;

  html5QrcodeScanner = new Html5Qrcode("reader", { 
    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
    experimentalFeatures: {useBarCodeDetectorIfSupported: true},
    verbose: false
  });

  html5QrcodeScanner.start(
    { facingMode: "environment" }, // SOLO POSTERIORE
    { fps: 10, qrbox: {width: 250, height: 250} },
    qrCodeMessage => {
      html5QrcodeScanner.stop().then(() => {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
        reader.classList.add("hidden");
        stopBtn.disabled = true;
        startBtn.disabled = false;

        if (savedMacchinari[qrCodeMessage]) {
          renderMacchinari(qrCodeMessage);
          return;
        }
        const nome = prompt("Nuovo macchinario trovato, inserisci nome:");
        if (!nome || nome.trim() === "") return;
        savedMacchinari[qrCodeMessage] = {nome: nome.trim(), note: []};
        localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
        renderMacchinari(qrCodeMessage);
      });
    },
    err => {
      // console.log("Scan error:", err);
    }
  ).catch(err => {
    alert("Errore attivando fotocamera: " + err);
    reader.classList.add("hidden");
    stopBtn.disabled = true;
    startBtn.disabled = false;
    html5QrcodeScanner = null;
  });
});

stopBtn.addEventListener("click", () => {
  if (!html5QrcodeScanner) return;
  html5QrcodeScanner.stop().then(() => {
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
    reader.classList.add("hidden");
    stopBtn.disabled = true;
    startBtn.disabled = false;
  });
});

// render iniziale
renderMacchinari();
