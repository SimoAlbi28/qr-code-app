const listContainer = document.getElementById("manutenzioni-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

const createBtn = document.getElementById("create-manutenzione");
const nomeModal = document.getElementById("nomeModal");
const nomeInput = document.getElementById("nomeInput");
const btnConferma = document.getElementById("btnConferma");
const btnAnnulla = document.getElementById("btnAnnulla");
const erroreNome = document.getElementById("erroreNome");

const urlParams = new URLSearchParams(window.location.search);
const currentAnno = urlParams.get("id");

let folders = JSON.parse(localStorage.getItem("folders") || "{}");
let savedManutenzioni = {};

// Funzione per inizializzare l'app
function inizializzaApp() {
  // Se la cartella non esiste, torna alla home
  if (!currentAnno) {
    alert("Nessuna cartella selezionata. Torna alla home.");
    window.location.href = "home.html";
    return;
  }

  // Ricarica folders dal localStorage
  folders = JSON.parse(localStorage.getItem("folders") || "{}");
  
  if (!folders[currentAnno]) {
    alert("Cartella non trovata (ID: " + currentAnno + "). Potrebbe essere stata eliminata. Torna alla home.");
    window.location.href = "home.html";
    return;
  }

  savedManutenzioni = folders[currentAnno]?.manutenzioni || {};
  if (!savedManutenzioni) savedManutenzioni = {};

  // Reset expanded = false ogni volta che si carica pagina
  Object.entries(savedManutenzioni).forEach(([id, manut]) => {
    savedManutenzioni[id].expanded = false;
  });

  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));
}

// Inizializza app solo quando il DOM è pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inizializzaApp);
} else {
  inizializzaApp();
}

// --- MOSTRA ANNO SOTTO TITOLO ---
function mostraAnnoCartella() {
  const titoloTop = document.getElementById("titleTop");
  if (!titoloTop) return;

  const annoCartella = currentAnno;

  const oldAnno = document.getElementById("annoSottoTitolo");
  if (oldAnno) oldAnno.remove();

  const divAnno = document.createElement("div");
  divAnno.id = "annoSottoTitolo";
  divAnno.textContent = `Anno cartella: ${annoCartella}`;
  divAnno.style.fontSize = "1rem";
  divAnno.style.color = "white";
  divAnno.style.marginTop = "5px";
  divAnno.style.fontWeight = "bold";

  titoloTop.insertAdjacentElement("afterend", divAnno);
}

// --- MODAL PERSONALIZZATO PER CONFERME ---
function mostraModalConferma(messaggio, onConferma, onAnnulla) {
  let oldModal = document.getElementById("custom-confirm-modal");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-confirm-modal";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0", left: "0",
    width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "10000"
  });

  const box = document.createElement("div");
  Object.assign(box.style, {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "320px",
    maxWidth: "90%",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
  });

  const msg = document.createElement("p");
  msg.style.marginBottom = "20px";
  msg.style.whiteSpace = "pre-wrap";
  msg.textContent = messaggio;
  box.appendChild(msg);

  const btnContainer = document.createElement("div");
  Object.assign(btnContainer.style, {
    display: "flex",
    justifyContent: "center",
    gap: "15px"
  });

  const btnAnnullaModal = document.createElement("button");
  btnAnnullaModal.textContent = "Annulla";
  Object.assign(btnAnnullaModal.style, {
    padding: "8px 16px",
    border: "none",
    backgroundColor: "#f44336",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer"
  });
  btnAnnullaModal.onclick = () => {
    document.body.removeChild(overlay);
    if (onAnnulla) onAnnulla();
  };

  const btnConfermaModal = document.createElement("button");
  btnConfermaModal.textContent = "Conferma";
  Object.assign(btnConfermaModal.style, {
    padding: "8px 16px",
    border: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer"
  });
  btnConfermaModal.onclick = () => {
    document.body.removeChild(overlay);
    if (onConferma) onConferma();
  };

  btnContainer.appendChild(btnAnnullaModal);
  btnContainer.appendChild(btnConfermaModal);
  box.appendChild(btnContainer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// --- FUNZIONI UTILI ---
function createLineSeparator() {
  const line = document.createElement("div");
  line.className = "line-separator";
  return line;
}

function formatData(d) {
  const [yyyy, mm, dd] = d.split("-");
  return `${dd}/${mm}/${yyyy.slice(2)}`;
}

// Crea area per copiare note
function creaAreaCopiaNote(manutenzioneBox, id, note) {
  const oldArea = manutenzioneBox.querySelector(".copia-note-area");
  if (oldArea) oldArea.remove();

  const area = document.createElement("div");
  area.className = "copia-note-area";
  area.style.marginTop = "10px";
  area.style.textAlign = "center";

  const btnCopiaNote = document.createElement("button");
  btnCopiaNote.textContent = "📋 Copia";
  btnCopiaNote.className = "btn-copia-note";

  const selezioneDiv = document.createElement("div");
  selezioneDiv.style.display = "none";
  selezioneDiv.style.marginTop = "10px";

  const btnSelezionaTutte = document.createElement("button");
  btnSelezionaTutte.textContent = "✔️ Tutte";
  btnSelezionaTutte.className = "btn-seleziona-tutte";

  const btnDeselezionaTutte = document.createElement("button");
  btnDeselezionaTutte.textContent = "❌ Tutte";
  btnDeselezionaTutte.className = "btn-deseleziona-tutte";

  const btnIndietro = document.createElement("button");
  btnIndietro.textContent = "🔙 Indietro";
  btnIndietro.className = "btn-indietro";

  const btnCopiaSelezionate = document.createElement("button");
  btnCopiaSelezionate.textContent = "📋 Copia";
  btnCopiaSelezionate.className = "btn-copia-selezionate";

  const btnContainer = document.createElement("div");
  Object.assign(btnContainer.style, {
    marginTop: "8px",
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "6px"
  });

  btnContainer.appendChild(btnSelezionaTutte);
  btnContainer.appendChild(btnDeselezionaTutte);
  btnContainer.appendChild(btnIndietro);
  btnContainer.appendChild(btnCopiaSelezionate);

  selezioneDiv.appendChild(btnContainer);
  area.appendChild(btnCopiaNote);
  area.appendChild(selezioneDiv);
  manutenzioneBox.appendChild(area);

  function updateNoteButtonsAndCheckboxes(showCheckboxes) {
    const liNotes = manutenzioneBox.querySelectorAll(".note-list li");
    liNotes.forEach(li => {
      const checkbox = li.querySelector("input[type=checkbox]");
      const btns = li.querySelector(".btns-note");
      if (checkbox) checkbox.style.display = showCheckboxes ? "inline-block" : "none";
      if (btns) btns.style.display = showCheckboxes ? "none" : "flex";
    });
  }

  btnCopiaNote.addEventListener("click", () => {
    btnCopiaNote.style.display = "none";
    selezioneDiv.style.display = "block";
    updateNoteButtonsAndCheckboxes(true);
  });

  btnIndietro.addEventListener("click", () => {
    selezioneDiv.style.display = "none";
    btnCopiaNote.style.display = "inline-block";
    updateNoteButtonsAndCheckboxes(false);
  });

  btnSelezionaTutte.addEventListener("click", () => {
    manutenzioneBox.querySelectorAll(".note-list input[type=checkbox]").forEach(cb => cb.checked = true);
  });

  btnDeselezionaTutte.addEventListener("click", () => {
    manutenzioneBox.querySelectorAll(".note-list input[type=checkbox]").forEach(cb => cb.checked = false);
  });

  btnCopiaSelezionate.addEventListener("click", () => {
    const checkboxes = manutenzioneBox.querySelectorAll(".note-list input[type=checkbox]:checked");
    const checkedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (checkedIndexes.length === 0) {
      alert("Seleziona almeno una nota da copiare.");
      return;
    }

    const nomeManutenzione = savedManutenzioni[id].nome;

    const testoDaCopiare = `${nomeManutenzione.toUpperCase()}\n\n` + 
      checkedIndexes.map(i => {
        const n = note[i];
        return `- [${formatData(n.data)}]: ${n.desc};`;
      }).join("\n");

    navigator.clipboard.writeText(testoDaCopiare).then(() => {
      alert("✅ Note copiate!");
      selezioneDiv.style.display = "none";
      btnCopiaNote.style.display = "inline-block";
      updateNoteButtonsAndCheckboxes(false);
    }).catch(() => {
      alert("Errore nella copia degli appunti.");
    });
  });
}

function renderManutenzioni(highlightId = null) {
  listContainer.innerHTML = "";

  const filtered = Object.entries(savedManutenzioni).filter(([_, data]) =>
    data.nome.toLowerCase().startsWith(searchInput.value.trim().toLowerCase())
  );

  const sorted = filtered.sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  sorted.forEach(([id, data]) => {
    const expanded = data.expanded;

    const box = document.createElement("div");
    box.className = "manutenzione";
    box.setAttribute("data-id", id);
    box.innerHTML = `
      <h3>${data.nome}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" data-id="${id}">
          ${expanded ? "🔽" : "🔼"}
        </button>
      </div>
    `;

    box.querySelector(".toggle-btn").addEventListener("click", () => toggleDettagli(id));

    if (expanded) {
      box.appendChild(createLineSeparator());

      const insertNoteTitle = document.createElement("h4");
      insertNoteTitle.textContent = "Inserimento Note";
      insertNoteTitle.className = "titolo-note";
      box.appendChild(insertNoteTitle);

      const noteForm = document.createElement("div");
      noteForm.className = "note-form";
      noteForm.innerHTML = `
        <label>Data:</label>
        <input type="date" id="data-${id}">
        <label>Descrizione (max 300):</label>
        <textarea id="desc-${id}" maxlength="300" rows="3" style="resize: none; width: 100%;"></textarea>
        <div style="text-align:center; margin-top:10px;">
          <button class="btn-green" id="btn-conferma-${id}">Conferma</button>
        </div>
      `;

      box.appendChild(noteForm);

      noteForm.querySelector(`#btn-conferma-${id}`).addEventListener("click", () => aggiungiNota(id));

      box.appendChild(createLineSeparator());

      if (data.note && data.note.length > 0) {
        const noteTitle = document.createElement("h4");
        noteTitle.textContent = "Note";
        noteTitle.className = "titolo-note";
        box.appendChild(noteTitle);

        const noteList = document.createElement("ul");
        noteList.className = "note-list";

        const notesSorted = (data.note || []).sort((a, b) =>
          b.data.localeCompare(a.data)
        );

        notesSorted.forEach((nota, index) => {
          const li = document.createElement("li");
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.justifyContent = "space-between";
          li.style.gap = "10px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "checkbox-copia-note";
          checkbox.value = index;
          checkbox.style.display = "none";

          const testoNota = document.createElement("div");
          testoNota.style.flex = "1";
          testoNota.innerHTML = `<span class="nota-data">${formatData(nota.data)}</span><br><span class="nota-desc">${nota.desc}</span>`;

          const btns = document.createElement("div");
          btns.className = "btns-note";
          btns.style.display = "flex";
          btns.innerHTML = `
            <button class="btn-blue btn-modifica" data-id="${id}" data-index="${index}">✏️</button>
            <button class="btn-red btn-elimina" data-id="${id}" data-index="${index}">🗑️</button>
          `;

          li.appendChild(checkbox);
          li.appendChild(testoNota);
          li.appendChild(btns);

          noteList.appendChild(li);
        });

        box.appendChild(noteList);

        creaAreaCopiaNote(box, id, notesSorted);

        box.appendChild(createLineSeparator());
      }

      const btnsContainer = document.createElement("div");
      btnsContainer.className = "btns-manutenzione";
      btnsContainer.innerHTML = `
        <div class="nome-e-btn">
          <button class="btn-blue btn-rinomina" data-id="${id}">✏️ Rinomina</button>
          <button class="btn-orange btn-chiudi" data-id="${id}">❌ Chiudi</button>
          <button class="btn-red btn-elimina-manutenzione" data-id="${id}">🗑️ Elimina</button>
        </div>
      `;

      box.appendChild(btnsContainer);

      btnsContainer.querySelector(".btn-rinomina").addEventListener("click", () => rinominaManutenzione(id));
      btnsContainer.querySelector(".btn-chiudi").addEventListener("click", () => toggleDettagli(id));
      btnsContainer.querySelector(".btn-elimina-manutenzione").addEventListener("click", () => eliminaManutenzione(id));

      box.querySelectorAll(".btn-modifica").forEach(btn =>
        btn.addEventListener("click", (e) => {
          const idMod = e.currentTarget.dataset.id;
          const idx = Number(e.currentTarget.dataset.index);
          modificaNota(idMod, idx);
        })
      );

      box.querySelectorAll(".btn-elimina").forEach(btn =>
        btn.addEventListener("click", (e) => {
          const idEl = e.currentTarget.dataset.id;
          const idx = Number(e.currentTarget.dataset.index);
          eliminaNota(idEl, idx);
        })
      );
    }

    listContainer.appendChild(box);
  });

  if (highlightId) {
    const highlightBox = document.querySelector(`.manutenzione[data-id="${highlightId}"]`);
    if (highlightBox) {
      highlightBox.classList.add("highlight");
      setTimeout(() => {
        highlightBox.classList.remove("highlight");
      }, 2500);
      highlightBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function salvaManutenzione(id, nome) {
  if (!savedManutenzioni[id]) {
    savedManutenzioni[id] = { nome, note: [], expanded: true };
  } else {
    savedManutenzioni[id].nome = nome;
  }
  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));
}

function toggleDettagli(id) {
  if (!savedManutenzioni[id]) return;
  savedManutenzioni[id].expanded = !savedManutenzioni[id].expanded;
  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));
  renderManutenzioni();
}

function rinominaManutenzione(id) {
  if (!savedManutenzioni[id]) return;
  const nuovoNome = prompt("Nuovo nome:", savedManutenzioni[id].nome)?.trim().toUpperCase();
  if (!nuovoNome) return;

  const esisteGia = Object.values(savedManutenzioni).some(
    m => m.nome.toUpperCase() === nuovoNome && m !== savedManutenzioni[id]
  );

  if (esisteGia) {
    alert("⚠️ Nome già esistente.");
    return;
  }

  savedManutenzioni[id].nome = nuovoNome;
  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));
  renderManutenzioni();
}

function eliminaManutenzione(id) {
  if (!savedManutenzioni[id]) return;
  const nome = savedManutenzioni[id].nome;
  mostraModalConferma(
    `Sei sicuro di voler eliminare "${nome}"?`,
    () => {
      delete savedManutenzioni[id];
      folders[currentAnno].manutenzioni = savedManutenzioni;
      localStorage.setItem("folders", JSON.stringify(folders));
      renderManutenzioni();
    }
  );
}

let notaInModifica = null;

function modificaNota(id, index) {
  if (!savedManutenzioni[id]) return;
  const nota = savedManutenzioni[id].note[index];
  if (!nota) return;

  // Se stai già modificando questa nota → annulla modifica (toggle OFF)
  if (notaInModifica && notaInModifica.id === id && notaInModifica.index === index) {
    const box = document.querySelector(`.manutenzione[data-id="${id}"]`);
    if (!box) return;

    const dataInput = box.querySelector(`#data-${id}`);
    const descInput = box.querySelector(`#desc-${id}`);

    // Svuota gli input
    dataInput.value = "";
    descInput.value = "";

    notaInModifica = null;
    return;
  }

  // Altrimenti, attiva la modifica per questa nota (toggle ON)
  notaInModifica = { id, index };

  const box = document.querySelector(`.manutenzione[data-id="${id}"]`);
  if (!box) return;

  const dataInput = box.querySelector(`#data-${id}`);

  // 🔥 sostituisci l’input descrizione con un textarea autosize
  const descInput = box.querySelector(`#desc-${id}`);
  descInput.value = nota.desc;

  descInput.style.height = "auto";
  descInput.style.overflow = "hidden";
  descInput.style.resize = "none";
  descInput.style.height = descInput.scrollHeight + "px";

  descInput.addEventListener("input", () => {
    descInput.style.height = "auto";
    descInput.style.height = descInput.scrollHeight + "px";
  });

  dataInput.value = nota.data;
}

function eliminaNota(id, index) {
  if (!savedManutenzioni[id]) return;
  const nome = savedManutenzioni[id].nome;
  mostraModalConferma(
    `Sei sicuro di voler eliminare questa nota di "${nome}"?`,
    () => {
      savedManutenzioni[id].note.splice(index, 1);
      if (savedManutenzioni[id].note.length === 0) {
        savedManutenzioni[id].expanded = false;
      }
      folders[currentAnno].manutenzioni = savedManutenzioni;
      localStorage.setItem("folders", JSON.stringify(folders));
      renderManutenzioni();
    }
  );
}

function aggiungiNota(id) {
  if (!savedManutenzioni[id]) return;

  const box = document.querySelector(`.manutenzione[data-id="${id}"]`);
  if (!box) return;

  const dataInput = box.querySelector(`#data-${id}`);
  const descInput = box.querySelector(`#desc-${id}`);

  const data = dataInput.value;
  const desc = descInput.value.trim();

  if (!data) {
    alert("Inserisci una data valida.");
    return;
  }
  if (!desc) {
    alert("Inserisci una descrizione.");
    return;
  }

  if (!savedManutenzioni[id].note) savedManutenzioni[id].note = [];

  if (notaInModifica && notaInModifica.id === id) {
    savedManutenzioni[id].note[notaInModifica.index] = { data, desc };
    notaInModifica = null;
  } else {
    savedManutenzioni[id].note.push({ data, desc });
  }

  savedManutenzioni[id].expanded = true;
  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));
  renderManutenzioni(id);
}

// --- RICERCA E MOSTRA TUTTI ---

searchInput.addEventListener("input", e => {
  renderManutenzioni();
});

showAllBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderManutenzioni();
});

// --- CREAZIONE MANUTENZIONE E MODAL ---

createBtn.addEventListener("click", () => {
  nomeInput.value = "";
  erroreNome.style.display = "none";
  nomeModal.classList.remove("hidden");
  nomeInput.focus();
});

btnAnnulla.addEventListener("click", () => {
  nomeModal.classList.add("hidden");
  erroreNome.style.display = "none";
});

btnConferma.addEventListener("click", () => {
  const nome = nomeInput.value.trim().toUpperCase();
  if (!nome) {
    alert("Inserisci un nome valido.");
    return;
  }

  const esisteGia = Object.values(savedManutenzioni).some(m => m.nome === nome);
  if (esisteGia) {
    erroreNome.style.display = "block";
    return;
  }

  const id = Date.now().toString();
  savedManutenzioni[id] = { nome, note: [], expanded: true };
  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));

  nomeModal.classList.add("hidden");
  erroreNome.style.display = "none";

  renderManutenzioni(id);
});

// --- SCANSIONE QR CODE ---

let html5QrCode = null;

startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  reader.classList.remove("hidden");

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      // Prova a prendere una camera posteriore se disponibile
      const backCam = cameras.find(cam =>
        cam.label.toLowerCase().includes("back") ||
        cam.label.toLowerCase().includes("post") ||
        cam.label.toLowerCase().includes("rear")
      );

      const cameraId = backCam ? backCam.id : cameras[0].id;

      html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
          gestioneScan(qrCodeMessage);
        },
        errorMessage => {
          // errore di scansione (puoi anche ignorare)
        }
      ).catch(err => {
        alert(`Errore avvio scansione: ${err}`);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        reader.classList.add("hidden");
      });
    } else {
      alert("Nessuna fotocamera trovata.");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      reader.classList.add("hidden");
    }
  }).catch(err => {
    alert(`Errore fotocamera: ${err}`);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    reader.classList.add("hidden");
  });
});

stopBtn.addEventListener("click", () => {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
});

function gestioneScan(text) {
  const nome = text.trim().toUpperCase();
  if (!nome) return;

  const esisteGia = Object.values(savedManutenzioni).some(m => m.nome === nome);
  if (esisteGia) {
    alert(`Manutenzione "${nome}" già presente.`);
    return;
  }

  const id = Date.now().toString();
  savedManutenzioni[id] = { nome, note: [], expanded: false };
  folders[currentAnno].manutenzioni = savedManutenzioni;
  localStorage.setItem("folders", JSON.stringify(folders));
  renderManutenzioni(id);
}

// Aggiungo il render delle manutenzioni alla funzione di inizializzazione
function avviaRender() {
  renderManutenzioni();
  mostraAnnoCartella();
}

window.addEventListener("DOMContentLoaded", avviaRender);
