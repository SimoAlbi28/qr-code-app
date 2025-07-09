const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");
const btnCreateManual = document.getElementById("btn-create-manual");

let searchFilter = "";
let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;

// --- Render macchinari + note + PDF controls
function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const filtered = Object.entries(savedMacchinari).filter(([_, data]) =>
    data.nome.toLowerCase().startsWith(searchFilter.toLowerCase())
  );

  const sorted = filtered.sort((a, b) => a[1].nome.localeCompare(b[1].nome));

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
      const notes = data.note || [];

      if (notes.length > 0) {
        box.innerHTML += `<div class="line-separator"></div><div class="titolo-note">Note</div>`;

        const noteList = document.createElement("ul");
        noteList.className = "note-list";

        const notesSorted = notes.sort((a, b) => b.data.localeCompare(a.data));

        notesSorted.forEach((nota, index) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <input type="checkbox" class="nota-checkbox hidden" data-index="${index}" onchange="aggiornaCheckbox(this, '${id}')">
            <span class="nota-data">${formatData(nota.data)}</span><br>
            <span class="nota-desc">${nota.desc}</span>
            <div class="btns-note">
              <button class="btn-blue" onclick="modificaNota('${id}', ${index})">✏️</button>
              <button class="btn-red" onclick="eliminaNota('${id}', ${index})">🗑️</button>
            </div>
          `;
          noteList.appendChild(li);
        });

        box.appendChild(noteList);

        // PDF Controls
        const pdfControls = document.createElement("div");
        pdfControls.className = "pdf-controls";
        pdfControls.innerHTML = `
          <button class="btn-purple" onclick="mostraSelezionePDF('${id}')">📄 Crea PDF</button>
          <div class="selezione-pdf hidden">
            <div class="btns-pdf">
              <button class="btn-aqua" onclick="selezionaTutte('${id}')">✔️ Seleziona tutte</button>
              <button class="btn-orange-scuro" onclick="deselezionaTutte('${id}')" id="btn-deselect-${id}" disabled>❌ Deseleziona tutte</button>
            </div>
            <button class="btn-pink" onclick="generaPDF('${id}')">🖨️ Stampa PDF</button>
            <button class="btn-yellow" onclick="nascondiSelezionePDF('${id}')">🔙 Indietro</button>
          </div>
        `;
        box.appendChild(pdfControls);
      }

      // Form Inserimento Note
      box.innerHTML += `<div class="line-separator"></div><div class="titolo-note">Inserimento Note</div>`;

      const noteForm = document.createElement("div");
      noteForm.className = "note-form";
      noteForm.innerHTML = `
        <label>Data:</label>
        <input type="date" id="data-${id}">
        <label>Descrizione (max 300):</label>
        <input type="text" id="desc-${id}" maxlength="300">
        <div style="text-align:center; margin-top:10px;">
          <button class="btn-green" onclick="aggiungiNota('${id}')">➕ Aggiungi Nota</button>
        </div>
        <div class="btns-macchinario" style="margin-top:8px;">
          <button class="btn-blue" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
          <button id="btn-chiudi" class="btn-orange" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
          <button class="btn-red" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
        </div>
      `;

      box.appendChild(noteForm);
    }

    listContainer.appendChild(box);
  });

  if (highlightId) {
    const highlightBox = document.querySelector(`.macchinario[data-id="${highlightId}"]`);
    if (highlightBox) {
      highlightBox.classList.add("highlight");
      setTimeout(() => {
        highlightBox.classList.remove("highlight");
      }, 2500);
      highlightBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

// --- Funzioni note e macchinari ---
function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome, note: [], expanded: true };
  } else {
    savedMacchinari[id].nome = nome;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim().length > 0) {
    savedMacchinari[id].nome = nuovoNome.trim();
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function eliminaMacchinario(id) {
  if (confirm(`Eliminare macchinario "${savedMacchinari[id].nome}"?`)) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function aggiungiNota(id) {
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);

  if (!dataInput.value) {
    alert("Seleziona una data valida.");
    return;
  }
  if (!descInput.value.trim()) {
    alert("Inserisci una descrizione valida.");
    return;
  }

  savedMacchinari[id].note = savedMacchinari[id].note || [];
  savedMacchinari[id].note.push({ data: dataInput.value, desc: descInput.value.trim() });
  dataInput.value = "";
  descInput.value = "";
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function eliminaNota(id, index) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  const nuovaData = prompt("Modifica data (YYYY-MM-DD):", nota.data);
  if (!nuovaData) return;
  const nuovaDesc = prompt("Modifica descrizione:", nota.desc);
  if (!nuovaDesc) return;
  savedMacchinari[id].note[index] = { data: nuovaData, desc: nuovaDesc };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

// --- FUNZIONI PDF ---
// Variabile per selezione note per PDF
let selezionePdfAttivaId = null;

function mostraSelezionePDF(id) {
  const container = document.querySelector(`.macchinario[data-id="${id}"]`);
  const selezioneDiv = container.querySelector(".selezione-pdf");
  const creaPdfBtn = container.querySelector(".btn-purple");
  selezioneDiv.classList.remove("hidden");
  creaPdfBtn.classList.add("hidden");

  // Mostra checkboxes per note e abilita seleziona/deseleziona
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  checkboxes.forEach(cb => cb.classList.remove("hidden"));

  // Disabilita il pulsante "Deseleziona tutte" all'inizio
  aggiornaBottoniPdf(container);

  selezionePdfAttivaId = id;
}

function nascondiSelezionePDF(id) {
  const container = document.querySelector(`.macchinario[data-id="${id}"]`);
  const selezioneDiv = container.querySelector(".selezione-pdf");
  const creaPdfBtn = container.querySelector(".btn-purple");
  selezioneDiv.classList.add("hidden");
  creaPdfBtn.classList.remove("hidden");

  // Nascondi checkboxes e deseleziona tutto
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  checkboxes.forEach(cb => {
    cb.checked = false;
    cb.classList.add("hidden");
  });

  selezionePdfAttivaId = null;
}

function aggiornaCheckbox(checkbox, id) {
  const container = document.querySelector(`.macchinario[data-id="${id}"]`);
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  const btnDeselect = container.querySelector(`#btn-deselect-${id}`);

  // Controlla se almeno una è selezionata
  const almenoUnoSelezionato = Array.from(checkboxes).some(cb => cb.checked);

  btnDeselect.disabled = !almenoUnoSelezionato;
}

function selezionaTutte(id) {
  const container = document.querySelector(`.macchinario[data-id="${id}"]`);
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  checkboxes.forEach(cb => {
    if (!cb.disabled) cb.checked = true;
  });
  aggiornaBottoniPdf(container);
}

function deselezionaTutte(id) {
  const container = document.querySelector(`.macchinario[data-id="${id}"]`);
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  checkboxes.forEach(cb => {
    if (!cb.disabled) cb.checked = false;
  });
  aggiornaBottoniPdf(container);
}

function aggiornaBottoniPdf(container) {
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  const btnDeselect = container.querySelector(`#btn-deselect-${selezionePdfAttivaId}`);
  const almenoUnoSelezionato = Array.from(checkboxes).some(cb => cb.checked);
  btnDeselect.disabled = !almenoUnoSelezionato;
}

function generaPDF(id) {
  const container = document.querySelector(`.macchinario[data-id="${id}"]`);
  const checkboxes = container.querySelectorAll(".nota-checkbox");
  const notes = savedMacchinari[id].note;

  const selezionate = [];
  checkboxes.forEach((cb, i) => {
    if (cb.checked) selezionate.push(notes[i]);
  });

  if (selezionate.length === 0) {
    alert("Seleziona almeno una nota per creare il PDF.");
    return;
  }

  // Genera testo PDF
  let contenuto = `Note per macchinario: ${savedMacchinari[id].nome}\n\n`;
  selezionate.forEach(nota => {
    contenuto += `Data: ${formatData(nota.data)}\nDescrizione: ${nota.desc}\n\n`;
  });

  // Usa jsPDF per creare PDF
  if (typeof window.jsPDF === "undefined") {
    alert("jsPDF non caricato. Scarica la libreria jsPDF per usare questa funzione.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const maxLineWidth = pageWidth - 2 * margin;
  const lines = doc.splitTextToSize(contenuto, maxLineWidth);

  doc.setFontSize(12);
  doc.text(lines, margin, 20);

  doc.save(`Note_${savedMacchinari[id].nome}.pdf`);

  // Dopo la stampa PDF resetto selezione
  nascondiSelezionePDF(id);
}

// --- FUNZIONI UTILI ---
function formatData(dataString) {
  const date = new Date(dataString);
  if (isNaN(date)) return dataString;
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- RICERCA ---
searchInput.addEventListener("input", (e) => {
  searchFilter = e.target.value.trim();
  renderMacchinari();
});

showAllBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchFilter = "";
  renderMacchinari();
});

// --- CREAZIONE MANUALE ---
btnCreateManual.addEventListener("click", () => {
  const nome = prompt("Inserisci nome macchinario:");
  if (!nome || nome.trim() === "") return;
  const id = "mac_" + Date.now();
  salvaMacchinario(id, nome.trim());
  renderMacchinari(id);
});

// --- INIT ---
renderMacchinari();
