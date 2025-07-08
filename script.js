const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

const nomeModal = document.getElementById("nomeModal");
const nomeInput = document.getElementById("nomeInput");
const btnConferma = document.getElementById("btnConferma");
const btnAnnulla = document.getElementById("btnAnnulla");
const erroreNome = document.getElementById("erroreNome");

let searchFilter = "";
let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;

// Funzione per mostrare modal inserimento nome
function chiediNomeModal(onSuccess, onCancel) {
  nomeModal.classList.remove("hidden");
  nomeInput.value = "";
  erroreNome.style.display = "none";
  nomeInput.focus();

  function confermaHandler() {
    const val = nomeInput.value.trim().toUpperCase();
    if (!val) return;
    if (Object.values(savedMacchinari).some(m => m.nome === val)) {
      erroreNome.style.display = "block";
      nomeInput.focus();
      return;
    }
    cleanup();
    onSuccess(val);
  }

  function annullaHandler() {
    cleanup();
    if (onCancel) onCancel();
  }

  function cleanup() {
    btnConferma.removeEventListener("click", confermaHandler);
    btnAnnulla.removeEventListener("click", annullaHandler);
    nomeModal.classList.add("hidden");
  }

  btnConferma.addEventListener("click", confermaHandler);
  btnAnnulla.addEventListener("click", annullaHandler);
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
      // Note list
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
            <button class="btn-blue" onclick="modificaNota('${id}', ${index})">✏️</button>
            <button class="btn-red" onclick="eliminaNota('${id}', ${index})">🗑️</button>
          </div>
        `;
        noteList.appendChild(li);
      });

      // Form note
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
        <div class="btns-macchinario" style="margin-top:8px;">
          <button class="btn-blue" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
          <button id="btn-chiudi" class="btn-orange" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
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
  chiediNomeModal(
    (nuovoNome) => {
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
    },
    () => {}
  );
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
        chiediNomeModal(
          (nome) => {
            salvaMacchinario(qrCodeMessage, nome);
            savedMacchinari[qrCodeMessage].expanded = true;
            renderMacchinari(qrCodeMessage);
          },
          () => {
            // utente annulla, non chiudo scansione ma non salvo
          }
        );
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

// Eventi
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

// All'avvio, chiudi tutti i macchinari
Object.values(savedMacchinari).forEach(macch => macch.expanded = false);
localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));

renderMacchinari();

// Esporta alcune funzioni per onclick inline nel render
window.toggleDettagli = toggleDettagli;
window.modificaNota = modificaNota;
window.eliminaNota = eliminaNota;
window.aggiungiNota = aggiungiNota;
window.rinominaMacchinario = rinominaMacchinario;
window.eliminaMacchinario = eliminaMacchinario;
