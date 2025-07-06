const listContainer = document.getElementById("macchinari-list");
const readerContainer = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let html5QrScanner = null;
let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let notaInModifica = null;

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  Object.entries(savedMacchinari)
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome))
    .forEach(([id, data]) => {
      const expanded = id === highlightId;
      const macchinarioDiv = document.createElement("div");
      macchinarioDiv.className = "macchinario";

      const nomeHtml = `<h3 style="background: cyan; color: black; padding: 6px; border-radius: 6px;">${data.nome.toUpperCase()}</h3>`;

      let detailsHtml = "";
      if (expanded) {
        let noteHtml = "";
        const noteOrdinate = [...(data.note || [])].sort((a, b) => b.data.localeCompare(a.data));
        if (noteOrdinate.length > 0) {
          noteHtml += `<ul class="note-list">`;
          noteOrdinate.forEach((nota, idx) => {
            noteHtml += `
              <li>
                <div class="nota-data">${formatDate(nota.data)}</div>
                <div class="nota-desc">${escapeHtml(nota.desc)}</div>
                <div class="btns-note">
                  <button class="btn-blue" onclick="modificaNota('${id}', ${idx})">Modifica</button>
                  <button class="btn-red" onclick="eliminaNota('${id}', ${idx})">Elimina</button>
                </div>
              </li>`;
          });
          noteHtml += `</ul>`;
        } else {
          noteHtml = `<p>Nessuna nota presente.</p>`;
        }

        detailsHtml = `
          ${noteHtml}
          ${renderFormNota(id)}
          <div class="btns-macchinario">
            <button class="toggle-btn" onclick="chiudiMacchinario()">Chiudi Dettagli</button>
            <button class="btn-blue" onclick="rinominaMacchinario('${id}')">Rinomina</button>
            <button class="btn-red" onclick="eliminaMacchinario('${id}')">Elimina</button>
          </div>`;
      } else {
        detailsHtml = `
          <div class="btns-macchinario">
            <button class="toggle-btn" onclick="espandiMacchinario('${id}')">Mostra Dettagli</button>
          </div>`;
      }

      macchinarioDiv.innerHTML = nomeHtml + detailsHtml;
      listContainer.appendChild(macchinarioDiv);
    });
}

function renderFormNota(id) {
  return `
    <form class="note-form" onsubmit="return salvaNota(event, '${id}')">
      <label for="data-nota">Data:</label>
      <input type="date" id="data-nota" name="data-nota" max="${getTodayDate()}" required>
      <label for="desc-nota">Descrizione (max 100 caratteri):</label>
      <input type="text" id="desc-nota" name="desc-nota" maxlength="100" required>
      <div class="btns-macchinario">
        <button type="submit" class="btn-green">Aggiungi Nota</button>
        <button type="button" class="btn-red" onclick="annullaNota()">Annulla</button>
      </div>
    </form>`;
}

function getTodayDate() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(txt) {
  return txt.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[m]);
}

function salvaNota(e, id) {
  e.preventDefault();
  const form = e.target;
  const data = form["data-nota"].value;
  const desc = form["desc-nota"].value.trim();

  if (!data || desc.length > 100) return alert("Controlla i campi!");

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];

  if (notaInModifica) {
    savedMacchinari[notaInModifica.id].note[notaInModifica.index] = { data, desc };
    notaInModifica = null;
  } else {
    savedMacchinari[id].note.push({ data, desc });
  }

  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
  form.reset();
  return false;
}

function modificaNota(id, index) {
  notaInModifica = { id, index };
  renderMacchinari(id);
  setTimeout(() => {
    const nota = savedMacchinari[id].note[index];
    const form = document.querySelector(".note-form");
    form["data-nota"].value = nota.data;
    form["desc-nota"].value = nota.desc;
    form.querySelector("button[type=submit]").textContent = "Salva Modifica";
  }, 0);
}

function eliminaNota(id, index) {
  if (!confirm("Eliminare la nota?")) return;
  savedMacchinari[id].note.splice(index, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function annullaNota() {
  notaInModifica = null;
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovo = prompt("Nuovo nome:", savedMacchinari[id].nome);
  if (nuovo) {
    savedMacchinari[id].nome = nuovo.trim();
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function eliminaMacchinario(id) {
  if (!confirm("Eliminare il macchinario?")) return;
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function espandiMacchinario(id) {
  renderMacchinari(id);
}

function chiudiMacchinario() {
  notaInModifica = null;
  renderMacchinari();
}

// Fotocamera
async function startCamera() {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (!devices.length) return alert("Nessuna fotocamera trovata");

    const backCam = devices.find(d => /back|rear/i.test(d.label)) || devices[0];

    if (!html5QrScanner) html5QrScanner = new Html5Qrcode("reader");

    startBtn.disabled = true;
    stopBtn.disabled = false;
    readerContainer.classList.remove("hidden");

    await html5QrScanner.start(
      { deviceId: { exact: backCam.id } },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      text => {
        html5QrScanner.stop().then(() => {
          readerContainer.classList.add("hidden");
          startBtn.disabled = false;
          stopBtn.disabled = true;

          if (!savedMacchinari[text]) {
            const nome = prompt("Nome nuovo macchinario:");
            if (nome) {
              savedMacchinari[text] = { nome: nome.trim(), note: [] };
              localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
              renderMacchinari(text);
            }
          } else {
            alert("Già presente: " + savedMacchinari[text].nome);
            renderMacchinari(text);
          }
        });
      },
      err => {} // ignora errori
    );
  } catch (err) {
    alert("Errore fotocamera: " + err.message);
    stopCamera();
  }
}

function stopCamera() {
  if (html5QrScanner) {
    html5QrScanner.stop().then(() => {
      readerContainer.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
}

startBtn.onclick = startCamera;
stopBtn.onclick = stopCamera;

renderMacchinari();
