const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

const torchBtn = document.createElement("button");
torchBtn.textContent = "💡 Torcia OFF";
torchBtn.className = "btn-orange";
torchBtn.style.marginTop = "50px";
torchBtn.disabled = true;
startBtn.parentNode.insertBefore(torchBtn, stopBtn.nextSibling);

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

let html5QrCode;
let stream = null;
let videoTrack = null;
let torchOn = false;

let filtroRicerca = "";

const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", (e) => {
  filtroRicerca = e.target.value.toLowerCase();
  renderMacchinari();
});

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const sorted = Object.entries(savedMacchinari)
    .filter(([id, data]) => data.nome.toLowerCase().startsWith(filtroRicerca))
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome));

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
          <button class="btn-blue btn-small" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
          <button id="btn-chiudi" class="btn-red btn-small" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
          <button class="btn-red btn-small" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
        </div>
      `;

      box.appendChild(noteList);
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

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome, note: [], expanded: false };
  } else {
    savedMacchinari[id].nome = nome;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
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

  if (
    dataInput.value === nota.data &&
    descInput.value === nota.desc
  ) {
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

// --- QR CAM + Torcia ---

function updateTorchBtn() {
  if (torchOn) {
    torchBtn.textContent = "💡 Torcia ON";
  } else {
    torchBtn.textContent = "💡 Torcia OFF";
  }
  torchBtn.disabled = !videoTrack || !videoTrack.getCapabilities().torch;
}

torchBtn.addEventListener("click", () => {
  if (!videoTrack) return;

  const cap = videoTrack.getCapabilities();
  if (!cap.torch) {
    alert("Torcia non supportata su questo dispositivo");
    return;
  }

  torchOn = !torchOn;
  videoTrack.applyConstraints({
    advanced: [{ torch: torchOn }]
  }).then(() => {
    updateTorchBtn();
  }).catch(() => {
    alert("Errore nell'attivazione della torcia");
  });
});

function startScan() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;
  torchBtn.disabled = true;
  torchOn = false;
  updateTorchBtn();

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
        torchBtn.disabled = true;
        torchOn = false;
        updateTorchBtn();
      });
      if (!savedMacchinari[qrCodeMessage]) {
        const nome = prompt("Nome del macchinario:");
        if (nome) {
          salvaMacchinario(qrCodeMessage, nome);
          savedMacchinari[qrCodeMessage].expanded = true;
          renderMacchinari(qrCodeMessage);
        }
      } else {
        savedMacchinari[qrCodeMessage].expanded = true;
        renderMacchinari(qrCodeMessage);
      }
    }
  ).then(() => {
    // Ottieni stream e videoTrack per torcia
    html5QrCode.getState().then(state => {
      if (state?.stream) {
        stream = state.stream;
        videoTrack = stream.getVideoTracks()[0];
        updateTorchBtn();
      }
    }).catch(() => {
      // fallback no stream
      torchBtn.disabled = true;
    });
  }).catch((err) => {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    torchBtn.disabled = true;
  });
}

function stopScan() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      torchBtn.disabled = true;
      torchOn = false;
      updateTorchBtn();
    });
  }
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

renderMacchinari();
