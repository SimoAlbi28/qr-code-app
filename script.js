const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

let searchFilter = "";
let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;

function createLineSeparator() {
  const line = document.createElement("div");
  line.className = "line-separator";
  return line;
}

function formatData(d) {
  const [yyyy, mm, dd] = d.split("-");
  return `${dd}/${mm}/${yyyy.slice(2)}`;
}

// Funzione per avviare la selezione note da copiare
function avviaSelezioneNote(id) {
  const macchBox = document.querySelector(`.macchinario[data-id="${id}"]`);
  if (!macchBox) return;

  const listaCheckbox = macchBox.querySelectorAll(".note-list li input[type=checkbox]");
  if (!listaCheckbox.length) return;

  // Mostra i checkbox (li sono già con checkbox dentro)
  listaCheckbox.forEach(cb => cb.style.display = "inline-block");
  
  // Mostra i bottoni sotto le note per seleziona/deseleziona, indietro, copia selezionate
  const btnContainer = macchBox.querySelector(".btns-copia-note");
  if (btnContainer) btnContainer.style.display = "flex";

  // Nascondi bottone "Copia Note"
  const btnCopiaNote = macchBox.querySelector(".btn-copia-note");
  if (btnCopiaNote) btnCopiaNote.style.display = "none";
}

function terminaSelezioneNote(id) {
  const macchBox = document.querySelector(`.macchinario[data-id="${id}"]`);
  if (!macchBox) return;

  const listaCheckbox = macchBox.querySelectorAll(".note-list li input[type=checkbox]");
  if (!listaCheckbox.length) return;

  // Nascondi checkbox
  listaCheckbox.forEach(cb => cb.style.display = "none");

  // Nascondi bottoni seleziona/deseleziona, indietro, copia selezionate
  const btnContainer = macchBox.querySelector(".btns-copia-note");
  if (btnContainer) btnContainer.style.display = "none";

  // Mostra bottone "Copia Note"
  const btnCopiaNote = macchBox.querySelector(".btn-copia-note");
  if (btnCopiaNote) btnCopiaNote.style.display = "inline-block";
}

function mostraToast(msg) {
  let toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "#2ecc71";
  toast.style.color = "white";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  toast.style.zIndex = 10000;
  toast.style.fontWeight = "700";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const filtered = Object.entries(savedMacchinari).filter(([_, data]) =>
    data.nome.toLowerCase().startsWith(searchFilter.toLowerCase())
  );

  const sorted = filtered.sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

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
        <button class="btn-green" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
      </div>
    `;

    if (expanded) {
      box.appendChild(createLineSeparator());

      // NOTE SECTION
      if (data.note && data.note.length > 0) {
        const noteTitle = document.createElement("h4");
        noteTitle.textContent = "Note";
        noteTitle.className = "titolo-note";
        box.appendChild(noteTitle);

        const noteList = document.createElement("ul");
        noteList.className = "note-list";

        // Ordina note per data decrescente
        const notesSorted = data.note.slice().sort((a, b) =>
          b.data.localeCompare(a.data)
        );

        notesSorted.forEach((nota, index) => {
          const li = document.createElement("li");

          // Checkbox nascosti di default
          li.innerHTML = `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" class="checkbox-copia-note" data-id="${id}" data-index="${index}" style="display:none" />
              <div>
                <span class="nota-data">${formatData(nota.data)}</span><br>
                <span class="nota-desc">${nota.desc}</span>
              </div>
            </label>
            <div class="btns-note">
              <button class="btn-blue" onclick="modificaNota('${id}', ${index})">✏️</button>
              <button class="btn-red" onclick="eliminaNota('${id}', ${index})">🗑️</button>
            </div>
          `;

          noteList.appendChild(li);
        });

        box.appendChild(noteList);

        box.appendChild(createLineSeparator());

        // Bottoni per la selezione e copia note (nascosti di default)
        const btnsCopiaNote = document.createElement("div");
        btnsCopiaNote.className = "btns-copia-note";
        btnsCopiaNote.style.display = "none";
        btnsCopiaNote.style.justifyContent = "center";
        btnsCopiaNote.style.gap = "6px";
        btnsCopiaNote.style.flexWrap = "wrap";

        const btnSelezionaTutte = document.createElement("button");
        btnSelezionaTutte.textContent = "✔️ Seleziona tutte";
        btnSelezionaTutte.className = "btn-seleziona-tutte";
        btnSelezionaTutte.onclick = () => {
          const checkboxes = box.querySelectorAll(".note-list input[type=checkbox]");
          checkboxes.forEach(cb => cb.checked = true);
        };

        const btnDeselezionaTutte = document.createElement("button");
        btnDeselezionaTutte.textContent = "❌ Deseleziona tutte";
        btnDeselezionaTutte.className = "btn-deseleziona-tutte";
        btnDeselezionaTutte.onclick = () => {
          const checkboxes = box.querySelectorAll(".note-list input[type=checkbox]");
          checkboxes.forEach(cb => cb.checked = false);
        };

        const btnIndietro = document.createElement("button");
        btnIndietro.textContent = "🔙 Indietro";
        btnIndietro.className = "btn-indietro";
        btnIndietro.onclick = () => terminaSelezioneNote(id);

        const btnCopiaSelezionate = document.createElement("button");
        btnCopiaSelezionate.textContent = "📋 Copia selezionate";
        btnCopiaSelezionate.className = "btn-copia-selezionate";
        btnCopiaSelezionate.onclick = () => {
          const checkboxes = box.querySelectorAll(".note-list input[type=checkbox]:checked");
          if (checkboxes.length === 0) {
            alert("Seleziona almeno una nota da copiare.");
            return;
          }
          const testoDaCopiare = Array.from(checkboxes).map(cb => {
            const idx = parseInt(cb.getAttribute("data-index"));
            const n = data.note[idx];
            return `- [${formatData(n.data)}]: ${n.desc};`;
          }).join("\n");

          navigator.clipboard.writeText(testoDaCopiare).then(() => {
            mostraToast("✅ Note copiate!");
            terminaSelezioneNote(id);
          }).catch(() => {
            alert("Errore nella copia degli appunti.");
          });
        };

        btnsCopiaNote.appendChild(btnSelezionaTutte);
        btnsCopiaNote.appendChild(btnDeselezionaTutte);
        btnsCopiaNote.appendChild(btnIndietro);
        btnsCopiaNote.appendChild(btnCopiaSelezionate);

        box.appendChild(btnsCopiaNote);

        // Bottone Copia Note
        const btnCopiaNote = document.createElement("button");
        btnCopiaNote.className = "btn-copia-note";
        btnCopiaNote.textContent = "📋 Copia note";
        btnCopiaNote.onclick = () => avviaSelezioneNote(id);

        box.appendChild(btnCopiaNote);
      }

      // FORM per aggiungere nota
      const formNota = document.createElement("form");
      formNota.className = "note-form";
      formNota.onsubmit = (e) => {
        e.preventDefault();
        const dataInput = formNota.querySelector("input[type=date]");
        const descInput = formNota.querySelector("input[type=text]");
        if (!dataInput.value || !descInput.value.trim()) {
          alert("Inserisci data e descrizione");
          return;
        }
        savedMacchinari[id].note = savedMacchinari[id].note || [];
        savedMacchinari[id].note.push({ data: dataInput.value, desc: descInput.value.trim() });
        localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
        renderMacchinari(id);
      };

      formNota.innerHTML = `
        <label for="data-${id}">Data:</label>
        <input type="date" id="data-${id}" name="data-${id}" required />
        <label for="desc-${id}">Descrizione:</label>
        <input type="text" id="desc-${id}" name="desc-${id}" required placeholder="Descrizione nota" />
        <button type="submit" class="btn-green">➕ Aggiungi Nota</button>
      `;

      box.appendChild(formNota);
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
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome)?.trim().toUpperCase();
  if (!nuovoNome) return;

  const esisteGia = Object.values(savedMacchinari).some(
    m => m.nome.toUpperCase() === nuovoNome && m !== savedMacchinari[id]
  );

  if (esisteGia) {
    alert("⚠️ Nome già esistente.");
    return;
  }

  savedMacchinari[id].nome = nuovoNome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (!confirm("Sei sicuro di voler eliminare questo macchinario?")) return;
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  if (!nota) return;

  // Riempi il form con la nota da modificare
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);

  if (!dataInput || !descInput) return;

  // Se il form è già compilato con questa nota, svuotalo
  if (dataInput.value === nota.data && descInput.value === nota.desc) {
    dataInput.value = "";
    descInput.value = "";
  } else {
    dataInput.value = nota.data;
    descInput.value = nota.desc;
  }
}

function eliminaNota(id, index) {
  if (!confirm("Sei sicuro di voler eliminare questa nota?")) return;
  savedMacchinari[id].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
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
        function chiediNome() {
          const nome = prompt("Nome del macchinario:")?.trim().toUpperCase();
          if (!nome) return;

          const esisteGia = Object.values(savedMacchinari).some(
            m => m.nome.toUpperCase() === nome
          );

          if (esisteGia) {
            alert("⚠️ Nome già esistente. Inserisci un nome diverso.");
            chiediNome();
          } else {
            salvaMacchinario(qrCodeMessage, nome);
            renderMacchinari(qrCodeMessage);
          }
        }
        chiediNome();
      } else {
        savedMacchinari[qrCodeMessage].expanded = true;
        renderMacchinari(qrCodeMessage);
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

// Pulsanti eventi
startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

searchInput.addEventListener("input", () => {
  searchFilter = searchInput.value.trim();
  renderMacchinari();
});

showAllBtn.addEventListener("click", () => {
  searchFilter = "";
  searchInput.value = "";
  renderMacchinari();
});

function creaMacchinarioManuale() {
  const nome = prompt("Inserisci il nome del nuovo macchinario:")?.trim().toUpperCase();
  if (!nome) return;

  const esisteGia = Object.values(savedMacchinari).some(
    m => m.nome.toUpperCase() === nome
  );

  if (esisteGia) {
    alert("⚠️ Nome già esistente. Inserisci un nome diverso.");
    return;
  }

  const id = "custom-" + Math.random().toString(36).substr(2, 9);
  salvaMacchinario(id, nome);
  renderMacchinari(id);
}

document.getElementById("create-macchinario").addEventListener("click", creaMacchinarioManuale);

// All'avvio, chiudi tutti i macchinari
Object.values(savedMacchinari).forEach(macch => macch.expanded = false);
localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));

renderMacchinari();
