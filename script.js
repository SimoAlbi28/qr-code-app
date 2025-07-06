const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner;

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    return a[1].nome.localeCompare(b[1].nome);
  });

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === highlightId;
    const box = document.createElement("div");
    box.className = "macchinario";
    box.innerHTML = `
      <h3>${data.nome}</h3>
      ${expanded ? `
        <ul class="note-list">
          ${data.note.map((n, i) => `
            <li>
              <div class="nota-data">${n.data}</div>
              <div class="nota-desc">${n.desc}</div>
              <div class="btns-note">
                <button class="btn-blue" onclick="modificaNota('${id}', ${i})">Modifica</button>
                <button class="btn-red" onclick="eliminaNota('${id}', ${i})">Elimina</button>
              </div>
            </li>
          `).join("")}
        </ul>
        <form class="note-form" onsubmit="aggiungiNota(event, '${id}')">
          <label>Data:</label>
          <input type="date" required />
          <label>Descrizione (max 100 caratteri):</label>
          <input type="text" maxlength="100" required />
          <div class="btns-macchinario">
            <button type="submit" class="btn-green">Aggiungi Nota</button>
            <button type="button" class="btn-red" onclick="chiudiMacchinario()">Chiudi Dettagli</button>
          </div>
        </form>
        <div class="btns-macchinario">
          <button class="btn-blue" onclick="modificaMacchinario('${id}')">Rinomina</button>
          <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
        </div>
      ` : `
        <div class="btns-macchinario">
          <button class="toggle-btn" onclick="espandiMacchinario('${id}')">Dettagli</button>
        </div>
      `}
    `;
    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome: "", note: [] };
  savedMacchinari[id].nome = nome;
  salvaLocale();
}

function salvaLocale() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function espandiMacchinario(id) {
  renderMacchinari(id);
}

function chiudiMacchinario() {
  renderMacchinari();
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome per il macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    savedMacchinari[id].nome = nuovoNome.trim();
    salvaLocale();
    renderMacchinari(id);
  }
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    salvaLocale();
    renderMacchinari();
  }
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const dataInput = form.querySelector('input[type="date"]');
  const descInput = form.querySelector('input[type="text"]');
  const data = dataInput.value;
  const desc = descInput.value.trim();
  if (!data || !desc) return alert("Compila tutti i campi.");

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];
  savedMacchinari[id].note.push({ data, desc });

  // Ordina note per data discendente (più recente in alto)
  savedMacchinari[id].note.sort((a,b) => new Date(b.data) - new Date(a.data));

  salvaLocale();
  renderMacchinari(id);
}

let notaInModifica = null;

function modificaNota(id, index) {
  const macchinario = savedMacchinari[id];
  if (!macchinario) return;

  const nota = macchinario.note[index];
  if (!nota) return;

  // Apri dettagli macchinario con form compilato
  renderMacchinari(id);

  // Dopo render, riempi i campi del form con dati da modificare
  setTimeout(() => {
    const form = listContainer.querySelector("form.note-form");
    if (!form) return;
    const dateInput = form.querySelector('input[type="date"]');
    const descInput = form.querySelector('input[type="text"]');
    dateInput.value = nota.data;
    descInput.value = nota.desc;

    // Salva quale nota stiamo modificando
    notaInModifica = { id, index };

    // Cambia bottone "Aggiungi Nota" in "Salva Modifica"
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "Salva Modifica";

    // Cambia handler form per salvataggio modifica
    form.onsubmit = (e) => salvaModificaNota(e, id);
  }, 100);
}

function salvaModificaNota(event, id) {
  event.preventDefault();
  if (!notaInModifica || notaInModifica.id !== id) return;

  const form = event.target;
  const dataInput = form.querySelector('input[type="date"]');
  const descInput = form.querySelector('input[type="text"]');
  const data = dataInput.value;
  const desc = descInput.value.trim();
  if (!data || !desc) return alert("Compila tutti i campi.");

  savedMacchinari[id].note[notaInModifica.index] = { data, desc };
  // Ordina note per data discendente (più recente in alto)
  savedMacchinari[id].note.sort((a,b) => new Date(b.data) - new Date(a.data));

  notaInModifica = null;
  salvaLocale();
  renderMacchinari(id);
}

function eliminaNota(id, index) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    salvaLocale();
    renderMacchinari(id);
  }
}

startBtn.addEventListener("click", () => {
  startScan();
});

stopBtn.addEventListener("click", () => {
  stopScan();
});

function startScan() {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  reader.classList.remove("hidden");

  html5QrcodeScanner = new Html5Qrcode("reader");

  // Forza la camera posteriore
  const config = { fps: 10, qrbox: { width: 250, height: 250 }, facingMode: "environment" };

  html5QrcodeScanner.start(
    config,
    {
      fps: 10,
      qrbox: 250,
    },
    (decodedText, decodedResult) => {
      stopScan();
      const id = decodedText.trim();
      if (!savedMacchinari[id]) {
        const nome = prompt("Nuovo macchinario trovato! Inserisci il nome:");
        if (nome && nome.trim() !== "") {
          salvaMacchinario(id, nome.trim());
          renderMacchinari(id);
        }
      } else {
        renderMacchinari(id);
      }
    },
    (errorMessage) => {
      // optional error callback, puoi anche loggare
    }
  ).catch((err) => {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    reader.classList.add("hidden");
  });
}

function stopScan() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then(() => {
      html5QrcodeScanner.clear();
      html5QrcodeScanner = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      reader.classList.add("hidden");
    }).catch((err) => {
      alert("Errore nella chiusura della fotocamera: " + err);
    });
  }
}

window.addEventListener("load", () => {
  renderMacchinari();
});
