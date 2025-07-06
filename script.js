const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;
let notaInModifica = { macchinarioId: null, notaIndex: null };

function renderMacchinari() {
  listContainer.innerHTML = "";

  const entries = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  entries.forEach(([id, data]) => {
    const expanded = data.expanded || false;
    const box = document.createElement("div");
    box.className = "macchinario";

    let noteHtml = "";
    if (expanded) {
      noteHtml = `
      <ul class="note-list">
        ${(data.note || [])
          .sort((a, b) => b.data.localeCompare(a.data))
          .map((nota, index) => `
            <li>
              <p class="nota-data">${formatDate(nota.data)}</p>
              <div class="btns-note">
                <button class="btn-blue" onclick="preparaModificaNota('${id}', ${index})">✏️</button>
                <button class="btn-red" onclick="eliminaNota('${id}', ${index})">🗑️</button>
              </div>
              <p class="nota-desc">${nota.desc}</p>
            </li>
          `).join("")}
      </ul>
      <form class="note-form" onsubmit="salvaNota(event, '${id}')">
        <label for="data-${id}">Data:</label>
        <input type="date" id="data-${id}" required />
        <label for="desc-${id}">Descrizione (max 50 caratteri):</label>
        <input type="text" id="desc-${id}" maxlength="50" required />
        <button type="submit" class="btn-green">${notaInModifica.macchinarioId === id ? "Modifica Nota" : "Aggiungi Nota"}</button>
        ${notaInModifica.macchinarioId === id ? `<button type="button" class="btn-red" onclick="annullaModifica()">Annulla</button>` : ""}
      </form>
      <div class="btns-macchinario">
        <button class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
      </div>
      `;
    }

    box.innerHTML = `
      <div class="nome-e-btn">
        <h3>${data.nome}</h3>
        <button class="toggle-btn" onclick="toggleMacchinario('${id}')">
          ${expanded ? "🔽" : "🔼"}
        </button>
      </div>
      ${noteHtml}
    `;
    listContainer.appendChild(box);

    if (notaInModifica.macchinarioId === id) {
      const dataInput = document.getElementById(`data-${id}`);
      const descInput = document.getElementById(`desc-${id}`);
      if (dataInput && descInput) {
        const nota = savedMacchinari[id].note[notaInModifica.notaIndex];
        dataInput.value = nota.data;
        descInput.value = nota.desc;
        dataInput.focus();
      }
    }
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aa = String(d.getFullYear()).slice(-2);
  return `${gg}/${mm}/${aa}`;
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
  const nuovoNome = prompt("Inserisci nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function toggleMacchinario(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function onScanSuccess(qr) {
  stopScanner();

  if (!savedMacchinari[qr]) {
    const nome = prompt("Nome del macchinario:");
    if (nome && nome.trim() !== "") {
      salvaMacchinario(qr, nome.trim());
    }
  } else {
    savedMacchinari[qr].expanded = true;
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  }
  renderMacchinari();
}

function salvaNota(event, macchinarioId) {
  event.preventDefault();
  const dataInput = document.getElementById(`data-${macchinarioId}`);
  const descInput = document.getElementById(`desc-${macchinarioId}`);
  const data = dataInput.value;
  const desc = descInput.value.trim();

  if (!data || !desc || desc.length > 50) {
    alert("Inserisci data valida e descrizione max 50 caratteri.");
    return;
  }

  if (!savedMacchinari[macchinarioId].note) {
    savedMacchinari[macchinarioId].note = [];
  }

  if (notaInModifica.macchinarioId === macchinarioId && notaInModifica.notaIndex !== null) {
    // Modifica nota esistente
    savedMacchinari[macchinarioId].note[notaInModifica.notaIndex] = { data, desc };
    notaInModifica = { macchinarioId: null, notaIndex: null };
  } else {
    // Aggiungi nuova nota
    savedMacchinari[macchinarioId].note.push({ data, desc });
  }

  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaNota(macchinarioId, notaIndex) {
  savedMacchinari[macchinarioId].note.splice(notaIndex, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function preparaModificaNota(macchinarioId, notaIndex) {
  notaInModifica = { macchinarioId, notaIndex };
  renderMacchinari();
}

function annullaModifica() {
  notaInModifica = { macchinarioId: null, notaIndex: null };
  renderMacchinari();
}

function startScanner() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onScanSuccess(decodedText);
        stopScanner();
      }
    )
    .catch((err) => {
      alert("Errore fotocamera: " + err);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      reader.classList.add("hidden");
    });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode
      .stop()
      .then(() => {
        reader.classList.add("hidden");
        startBtn.disabled = false;
        stopBtn.disabled = true;
      })
      .catch((err) => {
        console.error("Errore stop cam:", err);
      });
  }
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

renderMacchinari();
