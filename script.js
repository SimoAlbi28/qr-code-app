const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

let currentExpanded = null;
let editingNoteId = null;
let html5QrcodeScanner = null;
let cameraId = null;

function renderMacchinari() {
  listContainer.innerHTML = "";

  Object.entries(savedMacchinari).forEach(([id, data]) => {
    const isExpanded = currentExpanded === id;
    const macchinarioDiv = document.createElement("div");
    macchinarioDiv.className = "macchinario";

    macchinarioDiv.innerHTML = `
      <h3>${escapeHtml(data.nome)}</h3>
      ${isExpanded ? renderDettagli(id, data) : ""}
    `;

    listContainer.appendChild(macchinarioDiv);
  });
}

function renderDettagli(id, data) {
  let notesHtml = "";

  if (data.note && data.note.length) {
    // Ordino le note per data decrescente (più recenti in alto)
    const sortedNotes = data.note.slice().sort((a, b) => b.data.localeCompare(a.data));

    sortedNotes.forEach((nota, i) => {
      notesHtml += `
        <li>
          <div class="nota-data">${formatDate(nota.data)}</div>
          <div class="nota-desc">${escapeHtml(nota.descrizione)}</div>
          <div class="btns-note">
            <button class="btn-blue" onclick="modificaNota('${id}', ${i})">Modifica</button>
            <button class="btn-red" onclick="eliminaNota('${id}', ${i})">Elimina</button>
          </div>
        </li>
      `;
    });
  }

  const dataValue = editingNoteId !== null && savedMacchinari[id].note[editingNoteId]
    ? savedMacchinari[id].note[editingNoteId].data
    : "";

  const descValue = editingNoteId !== null && savedMacchinari[id].note[editingNoteId]
    ? savedMacchinari[id].note[editingNoteId].descrizione
    : "";

  return `
    <ul class="note-list">${notesHtml}</ul>
    <form class="note-form" onsubmit="event.preventDefault(); salvaNota('${id}')">
      <label for="data-nota">Data (gg/mm/aaaa):</label>
      <input type="date" id="data-nota" name="data-nota" required value="${dataValue}" />
      
      <label for="desc-nota">Descrizione (max 100 caratteri):</label>
      <input type="text" id="desc-nota" name="desc-nota" maxlength="100" required value="${descValue}" />
      
      <div class="btns-macchinario">
        <button type="submit" class="btn-green">${editingNoteId !== null ? "Salva Modifica" : "Aggiungi Nota"}</button>
        <button type="button" class="btn-red" onclick="annullaModificaNota()">Annulla</button>
        <button type="button" class="btn-red" onclick="toggleDettagli('${id}')">Chiudi Dettagli</button>
        <button type="button" class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
        <button type="button" class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
      </div>
    </form>
  `;
}

function toggleDettagli(id) {
  if (currentExpanded === id) {
    currentExpanded = null;
    editingNoteId = null;
    stopScan();
  } else {
    currentExpanded = id;
    editingNoteId = null;
  }
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Inserisci il nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim()) {
    savedMacchinari[id].nome = nuovoNome.trim();
    salvaDati();
    renderMacchinari();
  }
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    if (currentExpanded === id) {
      currentExpanded = null;
      editingNoteId = null;
    }
    salvaDati();
    renderMacchinari();
  }
}

function salvaNota(id) {
  const dataInput = document.querySelector(".note-form #data-nota");
  const descInput = document.querySelector(".note-form #desc-nota");
  if (!dataInput.value || !descInput.value) return alert("Compila tutti i campi!");

  const nota = {
    data: dataInput.value,
    descrizione: descInput.value.trim().substring(0, 100)
  };

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];

  if (editingNoteId !== null) {
    savedMacchinari[id].note[editingNoteId] = nota;
    editingNoteId = null;
  } else {
    savedMacchinari[id].note.push(nota);
  }

  salvaDati();
  renderMacchinari();
}

function modificaNota(id, noteIndex) {
  currentExpanded = id;
  editingNoteId = noteIndex;
  renderMacchinari();
}

function annullaModificaNota() {
  editingNoteId = null;
  renderMacchinari();
}

function eliminaNota(id, noteIndex) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(noteIndex, 1);
    salvaDati();
    renderMacchinari();
  }
}

function salvaDati() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function escapeHtml(text) {
  const map = {
    '&': "&amp;",
    '<': "&lt;",
    '>': "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

// --- Scanner ---

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  try {
    const devices = await Html5Qrcode.getCameras();
    cameraId = devices.find(dev => dev.label.toLowerCase().includes("back"))?.id || devices[0]?.id;

    if (!cameraId) {
      alert("Nessuna fotocamera disponibile");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }

    reader.classList.remove("hidden");

    if (html5QrcodeScanner) {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
    }

    html5QrcodeScanner = new Html5Qrcode("reader");
    await html5QrcodeScanner.start(
      cameraId,
      {
        fps: 10,
        qrbox: 250,
      },
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    );
  } catch (e) {
    alert("Errore nell'avvio della fotocamera: " + e.message);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

stopBtn.addEventListener("click", () => {
  stopScan();
});

async function stopScan() {
  if (html5QrcodeScanner) {
    await html5QrcodeScanner.stop();
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
  }
  reader.classList.add("hidden");
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

async function qrCodeSuccessCallback(decodedText, decodedResult) {
  stopScan();

  if (savedMacchinari[decodedText]) {
    currentExpanded = decodedText;
    editingNoteId = null;
    renderMacchinari();
    alert("Macchinario già registrato: " + savedMacchinari[decodedText].nome);
  } else {
    const nomeMacchinario = prompt("Nuovo macchinario rilevato! Inserisci il nome:");
    if (nomeMacchinario && nomeMacchinario.trim()) {
const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner = null;
let cameraId = null;

function renderMacchinari(expandedId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === expandedId;

    const macchinarioDiv = document.createElement("div");
    macchinarioDiv.className = "macchinario";

    // Nome macchinario con sfondo cyan e testo nero (in css h3)
    const nomeDiv = document.createElement("h3");
    nomeDiv.textContent = data.nome.toUpperCase();
    macchinarioDiv.appendChild(nomeDiv);

    // Se espanso mostra note e form
    if (expanded) {
      // Lista note ordinate per data decrescente (più recente sopra)
      const noteOrdinate = [...(data.note || [])].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
      );

      const noteList = document.createElement("ul");
      noteList.className = "note-list";

      noteOrdinate.forEach((nota, idx) => {
        const li = document.createElement("li");

        const dataSpan = document.createElement("span");
        dataSpan.className = "nota-data";
        dataSpan.textContent = formatDate(nota.data);
        li.appendChild(dataSpan);

        const descP = document.createElement("p");
        descP.className = "nota-desc";
        descP.textContent = nota.desc;
        li.appendChild(descP);

        // Bottoni modifica/elimina in basso a destra
        const btnsDiv = document.createElement("div");
        btnsDiv.className = "btns-note";

        const modBtn = document.createElement("button");
        modBtn.className = "btn-blue";
        modBtn.textContent = "Modifica";
        modBtn.onclick = () => modificaNota(id, idx);

        const delBtn = document.createElement("button");
        delBtn.className = "btn-red";
        delBtn.textContent = "Elimina";
        delBtn.onclick = () => eliminaNota(id, idx);

        btnsDiv.appendChild(modBtn);
        btnsDiv.appendChild(delBtn);

        li.appendChild(btnsDiv);

        noteList.appendChild(li);
      });

      macchinarioDiv.appendChild(noteList);

      // Form aggiungi nota
      const formDiv = document.createElement("div");
      formDiv.className = "note-form";

      const labelData = document.createElement("label");
      labelData.textContent = "Data (gg/mm/aaaa):";
      formDiv.appendChild(labelData);

      const inputData = document.createElement("input");
      inputData.type = "date";
      inputData.id = `data-input-${id}`;
      inputData.required = true;
      formDiv.appendChild(inputData);

      const labelDesc = document.createElement("label");
      labelDesc.textContent = "Descrizione (max 100 caratteri):";
      formDiv.appendChild(labelDesc);

      const inputDesc = document.createElement("input");
      inputDesc.type = "text";
      inputDesc.id = `desc-input-${id}`;
      inputDesc.maxLength = 100;
      inputDesc.placeholder = "Descrizione...";
      inputDesc.required = true;
      formDiv.appendChild(inputDesc);

      // Bottoni aggiungi e annulla
      const btnsNote = document.createElement("div");
      btnsNote.className = "btns-note";

      const addBtn = document.createElement("button");
      addBtn.className = "btn-green";
      addBtn.textContent = "Aggiungi Nota";
      addBtn.onclick = () => aggiungiNota(id);

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-red";
      cancelBtn.textContent = "Annulla";
      cancelBtn.onclick = () => {
        inputData.value = "";
        inputDesc.value = "";
      };

      btnsNote.appendChild(addBtn);
      btnsNote.appendChild(cancelBtn);

      formDiv.appendChild(btnsNote);
      macchinarioDiv.appendChild(formDiv);

      // Bottoni chiudi, rinomina, elimina macchinario
      const btnsMacchinario = document.createElement("div");
      btnsMacchinario.className = "btns-macchinario";

      const closeBtn = document.createElement("button");
      closeBtn.className = "btn-red";
      closeBtn.textContent = "Chiudi Dettagli";
      closeBtn.onclick = () => renderMacchinari();

      const renameBtn = document.createElement("button");
      renameBtn.className = "btn-blue";
      renameBtn.textContent = "Rinomina Macchinario";
      renameBtn.onclick = () => rinominaMacchinario(id);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-red";
      deleteBtn.textContent = "Elimina Macchinario";
      deleteBtn.onclick = () => eliminaMacchinario(id);

      btnsMacchinario.appendChild(closeBtn);
      btnsMacchinario.appendChild(renameBtn);
      btnsMacchinario.appendChild(deleteBtn);

      macchinarioDiv.appendChild(btnsMacchinario);
    }

    listContainer.appendChild(macchinarioDiv);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome, note: [] };
  else savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Inserisci il nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function aggiungiNota(id) {
  const dataInput = document.getElementById(`data-input-${id}`);
  const descInput = document.getElementById(`desc-input-${id}`);
  if (!dataInput.value || !descInput.value) {
    alert("Inserisci data e descrizione validi.");
    return;
  }
  const nota = {
    data: dataInput.value,
    desc: descInput.value.trim().slice(0, 100),
  };
  savedMacchinari[id].note = savedMacchinari[id].note || [];
  savedMacchinari[id].note.push(nota);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function eliminaNota(id, idx) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[id].note.splice(idx, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function modificaNota(id, idx) {
  const nota = savedMacchinari[id].note[idx];
  if (!nota) return;

  const dataInput = document.getElementById(`data-input-${id}`);
  const descInput = document.getElementById(`desc-input-${id}`);

  dataInput.value = nota.data;
  descInput.value = nota.desc;

  // Quando modifichi, rimuovi la vecchia nota
  savedMacchinari[id].note.splice(idx, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

// Formato data gg/mm/aaaa
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aa = String(d.getFullYear()).slice(-2);
  return `${gg}/${mm}/${aa}`;
}

// Gestione QR Code scanner
async function qrCodeSuccessCallback(decodedText, decodedResult) {
  // decodedText = contenuto QR
  stopScanner();

  // Chiedi nome macchinario all'utente
  let nome = prompt("QR scansionato: " + decodedText + "\nInserisci nome macchinario:");
  if (!nome || nome.trim() === "") {
    nome = decodedText;
  }

  const id = decodedText;

  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome: nome.trim(), note: [] };
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function qrCodeErrorCallback(errorMessage) {
  // non fare niente per ora
}

function startScanner() {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  Html5Qrcode.getCameras()
    .then(devices => {
      if (!devices || devices.length === 0) {
        alert("Nessuna fotocamera trovata.");
        startBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }
      // Forza fotocamera posteriore
      cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[devices.length - 1].id;

      reader.classList.remove("hidden");

      if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().catch(() => {}).then(() => {
          html5QrcodeScanner.clear();
          html5QrcodeScanner.start(cameraId, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback, qrCodeErrorCallback);
        });
      } else {
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start(cameraId, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback, qrCodeErrorCallback);
      }
    })
    .catch(err => {
      alert("Errore nell'avvio della fotocamera: " + err.message);
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
}

function stopScanner() {
  stopBtn.disabled = true;
  startBtn.disabled = false;
  reader.classList.add("hidden");

  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().catch(() => {}).then(() => {
      html5QrcodeScanner.clear();
    });
  }
}

startBtn.addEventListener("click", () => {
  startScanner();
});

stopBtn.addEventListener("click", () => {
  stopScanner();
});

renderMacchinari();
        nome: nomeMacchinario.trim(),
        note: []
      };
      currentExpanded = decodedText;
      editingNoteId = null;
      salvaDati();
      renderMacchinari();
      alert("Macchinario aggiunto!");
    }
  }
}

function qrCodeErrorCallback(errorMessage) {
  // Ignoriamo errori lettura QR
}

renderMacchinari();
