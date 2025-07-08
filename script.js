const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;

function renderMacchinari(filter = "", highlightId = null) {
  listContainer.innerHTML = "";

  const sorted = Object.entries(savedMacchinari)
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome))
    .filter(([id, data]) => data.nome.toLowerCase().startsWith(filter.toLowerCase()));

  sorted.forEach(([id, data]) => {
    const expanded = data.expanded;

    const box = document.createElement("div");
    box.className = "macchinario";
    box.setAttribute('data-id', id);
    box.innerHTML = `
      <h3>${data.nome}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" onclick="toggleDettagli('${id}')">
          ${expanded ? "🔽" : "🔼"}
        </button>
      </div>
    `;

    if (expanded) {
      // note
      const noteList = document.createElement("ul");
      noteList.className = "note-list";

      const notesSorted = (data.note || []).sort((a, b) =>
        b.data.localeCompare(a.data)
      );

      notesSorted.forEach((nota, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="nota-data">${formatData(nota.data)}</span><br>
          <span class="nota-desc">${nota.desc}</span>
          <div class="btns-note">
            <button class="btns-note" onclick="modificaNota('${id}', ${index})">✏️</button>
            <button class="btns-note" onclick="eliminaNota('${id}', ${index})">🗑️</button>
          </div>
        `;
        noteList.appendChild(li);
      });

      // form note con nuovo layout bottoni
      const noteForm = document.createElement("div");
      noteForm.className = "note-form";
      noteForm.innerHTML = `
        <label>Data:</label>
        <input type="date" id="data-${id}">
        <label>Descrizione (max 100):</label>
        <input type="text" id="desc-${id}" maxlength="100">
        <div style="text-align:center; margin-top:10px;">
          <button class="btn-green" onclick="aggiungiNota('${id}')">➕ Aggiungi Nota</button>
        </div>
        <div class="btns-macchinario" style="justify-content:center; margin-top:8px; gap:10px;">
          <button class="btn-rename" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
          <button id="btn-chiudi" class="btn-red" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
          <button class="btn-red" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
        </div>
      `;

      box.appendChild(noteList);
      box.appendChild(noteForm);
    }

    listContainer.appendChild(box);
  });

  // Highlight se richiesto
  if (highlightId) {
    const highlightBox = document.querySelector(`.macchinario[data-id="${highlightId}"]`);
    if (highlightBox) {
      highlightBox.classList.add("highlight");
      setTimeout(() => {
        highlightBox.classList.remove("highlight");
      }, 2500);
      // Scrolla in mezzo allo schermo
      highlightBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function salvaMacchinario(id, nome) {
  if (!nome) return false;

  const nomeUpper = nome.trim().toUpperCase();

  // controllo duplicati insensitive
  for (const key in savedMacchinari) {
    if (savedMacchinari[key].nome.toUpperCase() === nomeUpper && key !== id) {
      alert("Errore: nome macchinario già esistente.");
      // lascia aperto il form per reinserire
      savedMacchinari[id].expanded = true;
      renderMacchinari(searchInput.value, id);
      return false;
    }
  }

  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome: nomeUpper, note: [], expanded: false };
  } else {
    savedMacchinari[id].nome = nomeUpper;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(searchInput.value, id);
  return true;
}

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(searchInput.value);
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome) {
    salvaMacchinario(id, nuovoNome);
  }
}

function eliminaMacchinario(id) {
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(searchInput.value);
}

function aggiungiNota(id) {
  const data = document.getElementById(`data-${id}`).value;
  const desc = document.getElementById(`desc-${id}`).value.trim();
  if (data && desc) {
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(searchInput.value);
  }
}

function modificaNota(id, index) {
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);
  const nota = savedMacchinari[id].note[index];

  if (
    dataInput.value === nota.data &&
    descInput.value === nota.desc
  ) {
    // se già i dati sono uguali, svuota i campi
    dataInput.value = "";
    descInput.value = "";
  } else {
    // altrimenti mette i dati della nota
    dataInput.value = nota.data;
    descInput.value = nota.desc;
  }
}

function eliminaNota(id, index) {
  savedMacchinari[id].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(searchInput.value);
}

function formatData(d) {
  const [yyyy, mm, dd] = d.split("-");
  return `${dd}/${mm}/${yyyy.slice(2)}`;
}

// QR CAM
function startScan() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: { exact: "environment" } },
    {
      fps: 10,
      qrbox: 250
    },
    (qrCodeMessage) => {
      html5QrCode.stop().then(() => {
        reader.classList.add("hidden");
        startBtn.disabled = false;
        stopBtn.disabled = true;
      });
      if (!savedMacchinari[qrCodeMessage]) {
        const nome = prompt("Nome del macchinario:");
        if (nome) {
          const saved = salvaMacchinario(qrCodeMessage, nome);
          if (saved) {
            // Apri e highlighta il nuovo
            savedMacchinari[qrCodeMessage].expanded = true;
            renderMacchinari(searchInput.value, qrCodeMessage);
          }
        } else {
          renderMacchinari(searchInput.value);
        }
      } else {
        // Espandi, mostra e highlighta il macchinario già salvato
        savedMacchinari[qrCodeMessage].expanded = true;
        renderMacchinari(searchInput.value, qrCodeMessage);
      }
    }
  ).catch((err) => {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function stopScan() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
}

function aggiornaRicerca() {
  renderMacchinari(searchInput.value);
}

function mostraTutti() {
  searchInput.value = "";
  renderMacchinari();
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
searchInput.addEventListener("input", aggiornaRicerca);
showAllBtn.addEventListener("click", mostraTutti);

renderMacchinari();
