const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

// Crea dinamicamente il bottone torcia e lo inserisce dopo stopBtn
const torchBtn = document.createElement("button");
torchBtn.textContent = "💡 Torcia OFF";
torchBtn.className = "btn-orange";
torchBtn.style.marginTop = "50px";
torchBtn.disabled = true; // parte disabilitato
startBtn.parentNode.insertBefore(torchBtn, stopBtn.nextSibling);

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

let html5QrCode;
let stream = null;
let videoTrack = null;
let torchOn = false;

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const sorted = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

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
          <button class="btn-blue" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
          <button id="btn-chiudi" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
          <button class="btn-red" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
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

function toggleTorch() {
  if (!videoTrack) return alert("Torcia non disponibile");
  videoTrack.applyConstraints({ advanced: [{ torch: !torchOn }] })
    .then(() => {
      torchOn = !torchOn;
      torchBtn.textContent = torchOn ? "💡 Torcia ON" : "💡 Torcia OFF";
    })
    .catch(() => alert("Impossibile cambiare stato torcia"));
}

async function startScan() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;
  torchBtn.disabled = true;
  torchOn = false;
  torchBtn.textContent = "💡 Torcia OFF";

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });

    videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    torchBtn.disabled = !capabilities.torch;

    html5QrCode = new Html5Qrcode("reader");
    await html5QrCode.start(stream, { fps: 10, qrbox: 250 }, onScanSuccess);

  } catch (err) {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    torchBtn.disabled = true;
  }
}

async function stopScan() {
  if (html5QrCode) await html5QrCode.stop();
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  reader.classList.add("hidden");
  startBtn.disabled = false;
  stopBtn.disabled = true;
  torchBtn.disabled = true;
  torchOn = false;
  torchBtn.textContent = "💡 Torcia OFF";
}

function onScanSuccess(qrCodeMessage) {
  html5QrCode.stop();
  stream.getTracks().forEach(track => track.stop());
  reader.classList.add("hidden");
  startBtn.disabled = false;
  stopBtn.disabled = true;
  torchBtn.disabled = true;
  torchOn = false;
  torchBtn.textContent = "💡 Torcia OFF";

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

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
torchBtn.addEventListener("click", toggleTorch);

renderMacchinari();
