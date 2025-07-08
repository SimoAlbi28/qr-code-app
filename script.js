const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;

function renderMacchinari(highlightId = null, filter = "") {
  listContainer.innerHTML = "";

  const sorted = Object.entries(savedMacchinari)
    .filter(([id, data]) => data.nome.toLowerCase().startsWith(filter.toLowerCase()))
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  sorted.forEach(([id, data]) => {
    const expanded = data.expanded;

    const box = document.createElement("div");
    box.className = "macchinario";
    box.setAttribute("data-id", id);

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

      const notesSorted = (data.note || []).sort((a, b) => b.data.localeCompare(a.data));

      notesSorted.forEach((nota, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
          <span class="nota-data">${formatData(nota.data)}</span>
          <span class="nota-desc">${nota.desc}</span>
          <div class="btns-note">
            <button class="btn-blue btn-modifica-nota" onclick="modificaNota('${id}', ${index})">✏️</button>
            <button class="btn-red btn-elimina-nota" onclick="eliminaNota('${id}', ${index})">🗑️</button>
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
        <div class="btns-macchinario">
          <button class="btn-blue btn-rinomina-macchinario" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
          <button id="btn-chiudi" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
          <button class="btn-red btn-elimina-macchinario" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
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
  if (!nome.trim()) return false;

  // controllo duplicati ignorando maiuscole/minuscole
  const nomeUpper = nome.trim().toUpperCase();
  const esiste = Object.values(savedMacchinari).some(m => m.nome.toUpperCase() === nomeUpper);

  if (esiste) {
    alert("Nome già esistente, inserisci un nome diverso.");
    // lascia aperto il form con campi svuotati
    const dataInput = document.getElementById(`data-${id}`);
    const descInput = document.getElementById(`desc-${id}`);
    if (dataInput) dataInput.value = "";
    if (descInput) descInput.value = "";
    return false;
  }

  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome, note: [], expanded: true };
  } else {
    savedMacchinari[id].nome = nome;
    savedMacchinari[id].expanded = true;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id, searchInput.value);
  return true;
}

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(null, searchInput.value);
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome) {
    const nomeUpper = nuovoNome.trim().toUpperCase();
    const esiste = Object.values(savedMacchinari).some((m, i) => m.nome.toUpperCase() === nomeUpper && i !== id);
    if (esiste) {
      alert("Nome già esistente, inserisci un nome diverso.");
      return;
    }
    savedMacchinari[id].nome = nuovoNome;
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id, searchInput.value);
  }
}

function eliminaMacchinario(id) {
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(null, searchInput.value);
}

function aggiungiNota(id) {
  const data = document.getElementById(`data-${id}`).value;
  const desc = document.getElementById(`desc-${id}`).value.trim();
  if (data && desc) {
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id, searchInput.value);
  }
}

function modificaNota(id, index) {
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);
  const nota = savedMacchinari[id].note[index];

  if (dataInput.value === nota.data && descInput.value === nota.desc) {
    dataInput.value = "";
    descInput.value = "";
  } else {
    dataInput.value = nota.data;
    descInput.value = nota.desc;
  }
}

function eliminaNota(id, index) {
  savedMacchinari[id].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(null, searchInput.value);
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

  html5QrCode
    .start(
      { facingMode: { exact: "environment" } },
      {
        fps: 10,
        qrbox: 250,
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
            const ok = salvaMacchinario(qrCodeMessage, nome);
            if (!ok) {
              // Se nome duplicato, riapri prompt finché non correggi o annulli
              let nuovoNome;
              do {
                nuovoNome = prompt("Nome già esistente. Inserisci nome diverso:");
                if (nuovoNome === null) break;
              } while (!salvaMacchinario(qrCodeMessage, nuovoNome));
            }
          }
        } else {
          savedMacchinari[qrCodeMessage].expanded = true;
          renderMacchinari(qrCodeMessage, searchInput.value);
        }
      }
    )
    .catch((err) => {
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

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

searchInput.addEventListener("input", () => {
  renderMacchinari(null, searchInput.value);
});

showAllBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderMacchinari();
});

renderMacchinari();
