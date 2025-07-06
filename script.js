const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner = null;

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
      if (expanded) renderMacchinari();
      else renderMacchinari(id);
    };
  });
}

function renderNoteForm(macchinarioId) {
  return `
    <form onsubmit="aggiungiNota(event, '${macchinarioId}')">
      <label>Data (gg/mm/aaaa):</label>
      <input type="date" name="data" required />
      <label>Descrizione (max 100 caratteri):</label>
      <input type="text" name="descrizione" maxlength="100" required />
      <button type="submit" class="btn-green">Aggiungi Nota</button>
    </form>
  `;
}

function renderNoteList(macchinarioId) {
  const note = savedMacchinari[macchinarioId].note || [];
  if (note.length === 0) return "<p>Nessuna nota</p>";
  // Ordina per data decrescente
  note.sort((a,b) => new Date(b.data) - new Date(a.data));
  return `<ul class="note-list">
    ${note.map((n, i) => `
      <li>
        <span class="nota-data">${formatData(n.data)}</span>
        <p class="nota-desc">${n.descrizione}</p>
        <div class="btns-note">
          <button onclick="modificaNota('${macchinarioId}', ${i})" class="btn-blue">✏️ Modifica</button>
          <button onclick="eliminaNota('${macchinarioId}', ${i})" class="btn-red">🗑️ Elimina</button>
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

function aggiungiNota(e, macchinarioId) {
  e.preventDefault();
  const form = e.target;
  const data = form.data.value;
  const descrizione = form.descrizione.value.trim();
  if (!savedMacchinari[macchinarioId].note) savedMacchinari[macchinarioId].note = [];
  savedMacchinari[macchinarioId].note.push({data, descrizione});
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(macchinarioId);
}

function modificaNota(macchinarioId, index) {
  const nota = savedMacchinari[macchinarioId].note[index];
  if (!nota) return;
  const nuovoData = prompt("Modifica data (gg/mm/aaaa):", formatData(nota.data));
  if (!nuovoData) return;
  // Converti da gg/mm/aa a ISO
  const parts = nuovoData.split("/");
  if (parts.length !== 3) return alert("Formato data non valido");
  const isoData = `20${parts[2]}-${parts[1]}-${parts[0]}`;
  const nuovaDescr = prompt("Modifica descrizione (max 100 caratteri):", nota.descrizione);
  if (nuovaDescr === null) return;
  savedMacchinari[macchinarioId].note[index] = {data: isoData, descrizione: nuovaDescr.trim().substring(0,100)};
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(macchinarioId);
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
