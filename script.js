const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let currentScanner = null;

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    return a[1].nome.localeCompare(b[1].nome);
  });

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = data.expanded;
    const box = document.createElement("div");
    box.className = "macchinario";

    let noteHTML = "";
    if (expanded && data.note) {
      const notesSorted = [...data.note].sort((a, b) => new Date(b.data) - new Date(a.data));
      noteHTML = `
        <ul class="note-list">
          ${notesSorted.map((nota, i) => `
            <li>
              <div class="nota-data">${formattaData(nota.data)}</div>
              <div class="nota-desc">${nota.desc}</div>
              <div class="btns-note">
                <button class="btn-blue" onclick="modificaNota('${id}', ${i})">✏️</button>
                <button class="btn-red" onclick="eliminaNota('${id}', ${i})">🗑️</button>
              </div>
            </li>
          `).join('')}
        </ul>
        <form onsubmit="aggiungiNota(event, '${id}')" class="note-form">
          <label>Data</label>
          <input type="date" name="data" required />
          <label>Descrizione (max 100 caratteri)</label>
          <input type="text" name="desc" maxlength="100" required />
          <div class="btns-macchinario">
            <button type="submit" class="btn-green">Aggiungi Nota</button>
            <button type="button" class="btn-red" onclick="chiudiDettagli('${id}')">Annulla</button>
          </div>
        </form>
      `;
    }

    box.innerHTML = `
      <h3 style="background: cyan; color: black; padding: 5px; border-radius: 5px;">${data.nome}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" onclick="toggleDettagli('${id}')">${expanded ? "Chiudi Dettagli" : "Dettagli"}</button>
      </div>
      ${expanded ? noteHTML : ""}
      <div class="btns-macchinario">
        ${expanded ? `<button class="btn-blue" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>` : ""}
        ${expanded ? `<button class="btn-red" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>` : ""}
      </div>
    `;

    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome) {
  savedMacchinari[id] = savedMacchinari[id] || { note: [], expanded: false };
  savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function chiudiDettagli(id) {
  savedMacchinari[id].expanded = false;
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
    savedMacchinari[id].nome = nuovoNome;
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const data = form.data.value;
  const desc = form.desc.value;

  if (!data || !desc) return;

  savedMacchinari[id].note.push({ data, desc });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  form.reset();
  renderMacchinari(id);
}

function eliminaNota(id, index) {
  savedMacchinari[id].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  const nuovaData = prompt("Modifica data:", nota.data);
  const nuovaDesc = prompt("Modifica descrizione:", nota.desc);

  if (nuovaData && nuovaDesc) {
    savedMacchinari[id].note[index] = { data: nuovaData, desc: nuovaDesc };
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function formattaData(dateString) {
  const [yyyy, mm, dd] = dateString.split("-");
  return `${dd}/${mm}/${yyyy.slice(2)}`;
}

function onScanSuccess(qr) {
  stopScan();
  if (!savedMacchinari[qr]) {
    const nome = prompt("Nome del macchinario:");
    if (nome) {
      salvaMacchinario(qr, nome);
    }
  } else {
    savedMacchinari[qr].expanded = true;
    renderMacchinari(qr);
  }
}

function onScanError(err) {
  console.warn("Scan error:", err);
}

async function startScan() {
  try {
    const devices = await Html5Qrcode.getCameras();
    const rearCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];

    currentScanner = new Html5Qrcode("reader");
    await currentScanner.start(
      { deviceId: { exact: rearCam.id } },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      onScanError
    );

    reader.classList.remove("hidden");
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (err) {
    alert("Errore avvio fotocamera: " + err);
    console.error(err);
  }
}

function stopScan() {
  if (currentScanner) {
    currentScanner.stop().then(() => {
      currentScanner.clear();
      currentScanner = null;
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

renderMacchinari();
