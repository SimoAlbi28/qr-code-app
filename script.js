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

function avviaSelezioneNote(id) {
  const box = document.querySelector(`.macchinario[data-id="${id}"]`);
  if (!box) return;

  // Nascondo la lista note e il btn copia originale
  const noteList = box.querySelector(".note-list");
  const btnCopiaNote = box.querySelector(".btn-copia-note");
  if (noteList) noteList.style.display = "none";
  if (btnCopiaNote) btnCopiaNote.style.display = "none";

  // Creo la lista con checkbox dentro ogni nota
  const listaCheckbox = document.createElement("ul");
  listaCheckbox.className = "note-list";

  const note = savedMacchinari[id].note || [];

  note.forEach((nota, idx) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "8px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox-copia-note";
    checkbox.value = idx;
    checkbox.checked = false;

    const testoNota = document.createElement("span");
    testoNota.textContent = `- [${formatData(nota.data)}]: ${nota.desc};`;

    li.appendChild(checkbox);
    li.appendChild(testoNota);

    listaCheckbox.appendChild(li);
  });

  box.appendChild(listaCheckbox);

  // Creo contenitore bottoni selezione e copia
  const btnsCopiaDiv = document.createElement("div");
  btnsCopiaDiv.style.marginTop = "8px";
  btnsCopiaDiv.style.display = "flex";
  btnsCopiaDiv.style.justifyContent = "center";
  btnsCopiaDiv.style.flexWrap = "wrap";
  btnsCopiaDiv.style.gap = "6px";

  // Btn seleziona tutte
  const btnSelezionaTutte = document.createElement("button");
  btnSelezionaTutte.textContent = "✔️ Seleziona tutte";
  btnSelezionaTutte.className = "btn-seleziona-tutte";
  btnSelezionaTutte.onclick = () => {
    listaCheckbox.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
  };

  // Btn deseleziona tutte
  const btnDeselezionaTutte = document.createElement("button");
  btnDeselezionaTutte.textContent = "❌ Deseleziona tutte";
  btnDeselezionaTutte.className = "btn-deseleziona-tutte";
  btnDeselezionaTutte.onclick = () => {
    listaCheckbox.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
  };

  // Btn indietro (torna alla visualizzazione normale)
  const btnIndietro = document.createElement("button");
  btnIndietro.textContent = "🔙 Indietro";
  btnIndietro.className = "btn-indietro";
  btnIndietro.onclick = () => {
    listaCheckbox.remove();
    btnsCopiaDiv.remove();
    if (noteList) noteList.style.display = "block";
    if (btnCopiaNote) btnCopiaNote.style.display = "inline-block";
  };

  // Btn copia selezionate
  const btnCopiaSelezionate = document.createElement("button");
  btnCopiaSelezionate.textContent = "📋 Copia selezionate";
  btnCopiaSelezionate.className = "btn-copia-selezionate";
  btnCopiaSelezionate.onclick = () => {
    const checkedIndexes = Array.from(listaCheckbox.querySelectorAll("input[type=checkbox]:checked")).map(cb => parseInt(cb.value));

    if (checkedIndexes.length === 0) {
      alert("Seleziona almeno una nota da copiare.");
      return;
    }

    const testoDaCopiare = checkedIndexes.map(i => {
      const n = note[i];
      return `- [${formatData(n.data)}]: ${n.desc};`;
    }).join("\n");

    navigator.clipboard.writeText(testoDaCopiare).then(() => {
      mostraToast("✅ Note copiate!");
      // Torna alla visualizzazione normale
      btnIndietro.onclick();
    }).catch(() => {
      alert("Errore nella copia degli appunti.");
    });
  };

  btnsCopiaDiv.appendChild(btnSelezionaTutte);
  btnsCopiaDiv.appendChild(btnDeselezionaTutte);
  btnsCopiaDiv.appendChild(btnIndietro);
  btnsCopiaDiv.appendChild(btnCopiaSelezionate);

  box.appendChild(btnsCopiaDiv);
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
      </div>
    `;

    if (expanded) {
      box.appendChild(createLineSeparator());

      if (data.note && data.note.length > 0) {
        const noteTitle = document.createElement("h4");
        noteTitle.textContent = "Note";
        noteTitle.className = "titolo-note";
        box.appendChild(noteTitle);

        const noteList = document.createElement("ul");
        noteList.className = "note-list";

        const notesSorted = data.note.sort((a, b) =>
          b.data.localeCompare(a.data)
        );

        notesSorted.forEach((nota, index) => {
          const li = document.createElement("li");

          li.innerHTML = `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" class="checkbox-copia-note" data-id="${id}" data-index="${index}" />
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

        const btnCopiaNote = document.createElement("button");
        btnCopiaNote.className = "btn-copia-note";
        btnCopiaNote.textContent = "📋 Copia note";
        btnCopiaNote.onclick = () => avviaSelezioneNote(id);
        box.appendChild(btnCopiaNote);
      }
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
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function aggiungiNota(id) {
  const data = document.getElementById(`data-${id}`).value;
  const desc = document.getElementById(`desc-${id}`).value.trim();
  if (data && desc) {
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
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

// All'avvio, chiudo tutti i macchinari
Object.values(savedMacchinari).forEach(macch => macch.expanded = false);
localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));

renderMacchinari();
