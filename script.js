const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const entries = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  entries.forEach(([id, data]) => {
    const expanded = data.expanded || false;
    const box = document.createElement("div");
    box.className = "macchinario";
    box.innerHTML = `
      <div class="nome-e-btn">
        <h3>${data.nome}</h3>
        <button class="toggle-btn" onclick="toggleMacchinario('${id}')">
          ${expanded ? "🔽" : "🔼"}
        </button>
      </div>
      ${expanded ? `
        <ul class="note-list">
          ${(data.note || [])
            .sort((a, b) => b.data.localeCompare(a.data))
            .map((nota, index) => `
              <li>
                <p class="nota-data">${formatDate(nota.data)}</p>
                <div class="btns-note">
                  <button class="btn-blue" onclick="modificaNota('${id}', ${index})">✏️</button>
                  <button class="btn-red" onclick="eliminaNota('${id}', ${index})">🗑️</button>
                </div>
                <p class="nota-desc">${nota.desc}</p>
              </li>
            `).join("")}
        </ul>
        <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
          <label for="data-${id}">Data:</label>
          <input type="date" id="data-${id}" required />
          <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
          <input type="text" id="desc-${id}" maxlength="50" required />
          <button type="submit" class="btn-green">Aggiungi Nota</button>
        </form>
        <div class="btns-macchinario">
          <button class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
          <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
        </div>
      ` : ""}
    `;
    listContainer.appendChild(box);
  });
}

function toggleMacchinario(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
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

function eliminaMacchinario(id) {
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome) {
    savedMacchinari[id].nome = nuovoNome;
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function aggiungiNota(e, id) {
  e.preventDefault();
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);
  const data = dataInput.value;
  const desc = descInput.value.trim();

  if (!data || !desc) return;

  savedMacchinari[id].note.push({ data, desc });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  const nuovaData = prompt("Nuova data (aaaa-mm-gg):", nota.data);
  const nuovaDesc = prompt("Nuova descrizione (max 50 caratteri):", nota.desc);

  if (nuovaData && nuovaDesc && nuovaDesc.length <= 50) {
    savedMacchinari[id].note[index] = { data: nuovaData, desc: nuovaDesc };
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function eliminaNota(id, index) {
  savedMacchinari[id].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function onScanSuccess(decodedText) {
  stopScanner();

  if (!savedMacchinari[decodedText]) {
    const nome = prompt("Nome del macchinario:");
    if (nome) {
      salvaMacchinario(decodedText, nome);
    }
  } else {
    savedMacchinari[decodedText].expanded = true;
    renderMacchinari();
  }
}

function startScanner() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    onScanSuccess
  ).catch(err => {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    reader.classList.add("hidden");
  });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }).catch(err => {
      console.error("Errore nello stop:", err);
    });
  }
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

renderMacchinari();
