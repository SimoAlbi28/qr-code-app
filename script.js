const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

let html5QrcodeScanner = null;
let currentScanActive = false;

async function startScanner() {
  if (currentScanActive) return;
  startBtn.disabled = true;
  stopBtn.disabled = false;

  reader.classList.add("visible");

  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5Qrcode("reader");
  }

  try {
    const devices = await Html5Qrcode.getCameras();
    // Prendi la posteriore (environment)
    const backCamera = devices.find(dev => dev.label.toLowerCase().includes("back")) || devices[0];
    if (!backCamera) {
      alert("Nessuna fotocamera trovata");
      stopScanner();
      return;
    }

    await html5QrcodeScanner.start(
      backCamera.id,
      {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1
      },
      qrCodeMessage => {
        // Gestisci QR code letto
        handleQRCode(qrCodeMessage);
      },
      errorMessage => {
        // ignore o log
        // console.log("Scan error:", errorMessage);
      }
    );
    currentScanActive = true;
  } catch (err) {
    alert("Errore avvio fotocamera: " + err);
    stopScanner();
  }
}

async function stopScanner() {
  if (!currentScanActive) return;
  stopBtn.disabled = true;
  startBtn.disabled = false;

  try {
    await html5QrcodeScanner.stop();
  } catch(e) {
    console.warn("Errore stop scanner", e);
  }
  reader.classList.remove("visible");
  currentScanActive = false;
}

startBtn.addEventListener("click", () => startScanner());
stopBtn.addEventListener("click", () => stopScanner());

function handleQRCode(qrMessage) {
  // esempio: aggiungi macchinario o mostra alert se già presente
  if (savedMacchinari[qrMessage]) {
    alert(`Macchinario "${qrMessage}" già presente!`);
    return;
  }
  savedMacchinari[qrMessage] = { nome: qrMessage, note: [] };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(qrMessage);
}

// Funzioni macchinari (render, aggiungi nota, modifica ecc) come prima

function renderMacchinari(expandedId = null) {
  listContainer.innerHTML = "";

  const sortedEntries = Object.entries(savedMacchinari).sort((a,b) => a[1].nome.localeCompare(b[1].nome));

  sortedEntries.forEach(([id, data]) => {
    const expanded = id === expandedId;
    if (!data.note) data.note = [];

    data.note.sort((a,b) => b.data.localeCompare(a.data)); // data discendente

    const div = document.createElement("div");
    div.className = "macchinario";
    div.innerHTML = `
      <h3>${data.nome}</h3>
      ${expanded ? `
        <ul class="note-list">
          ${data.note.map((n,i) => `
            <li>
              <div class="nota-data">${formatDate(n.data)}</div>
              <div class="nota-desc">${n.desc}</div>
              <div class="btns-note">
                <button class="btn-blue" onclick="modificaNota('${id}',${i})">Modifica</button>
                <button class="btn-red" onclick="eliminaNota('${id}',${i})">Elimina</button>
              </div>
            </li>
          `).join('')}
        </ul>
        <form class="note-form" onsubmit="aggiungiNota(event,'${id}')">
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
      ` : `
        <div class="btns-macchinario">
          <button class="toggle-btn" onclick="espandiMacchinario('${id}')">Dettagli</button>
        </div>
      `}
    `;
    listContainer.appendChild(div);
  });
  resetForm();
}

function formatDate(dateStr) {
  // da yyyy-mm-dd a gg/mm/aa
  const parts = dateStr.split("-");
  if(parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

// Gestione note e macchinari (aggiungi, elimina, modifica) — implementa le funzioni come in precedenza
// Per brevità, le funzioni di modificaNota, eliminaNota, aggiungiNota, resetForm, modificaMacchinario, eliminaMacchinario, chiudiMacchinario, espandiMacchinario vanno mantenute come prima.

renderMacchinari();
