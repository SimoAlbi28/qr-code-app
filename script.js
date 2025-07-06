const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrcodeScanner = null;
let cameraId = null;

function renderMacchinari(expandedId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === expandedId;

    const macchinarioDiv = document.createElement("div");
    macchinarioDiv.className = "macchinario";

    const nomeDiv = document.createElement("h3");
    nomeDiv.textContent = data.nome.toUpperCase();
    macchinarioDiv.appendChild(nomeDiv);

    if (expanded) {
      const noteOrdinate = [...(data.note || [])].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
      );

      const noteList = document.createElement("ul");
      noteList.className = "note-list";

      noteOrdinate.forEach((nota, idx) => {
        const li = document.createElement("li");

        const dataSpan = document.createElement("span");
        dataSpan.className = "nota-data";
        dataSpan.textContent = formatDate(nota.data);
        li.appendChild(dataSpan);

        const descP = document.createElement("p");
        descP.className = "nota-desc";
        descP.textContent = nota.desc;
        li.appendChild(descP);

        const btnsDiv = document.createElement("div");
        btnsDiv.className = "btns-note";

        const modBtn = document.createElement("button");
        modBtn.className = "btn-blue";
        modBtn.textContent = "Modifica";
        modBtn.onclick = () => modificaNota(id, idx);

        const delBtn = document.createElement("button");
        delBtn.className = "btn-red";
        delBtn.textContent = "Elimina";
        delBtn.onclick = () => eliminaNota(id, idx);

        btnsDiv.appendChild(modBtn);
        btnsDiv.appendChild(delBtn);

        li.appendChild(btnsDiv);

        noteList.appendChild(li);
      });

      macchinarioDiv.appendChild(noteList);

      const formDiv = document.createElement("div");
      formDiv.className = "note-form";

      const labelData = document.createElement("label");
      labelData.textContent = "Data (gg/mm/aaaa):";
      formDiv.appendChild(labelData);

      const inputData = document.createElement("input");
      inputData.type = "date";
      inputData.id = `data-input-${id}`;
      inputData.required = true;
      formDiv.appendChild(inputData);

      const labelDesc = document.createElement("label");
      labelDesc.textContent = "Descrizione (max 100 caratteri):";
      formDiv.appendChild(labelDesc);

      const inputDesc = document.createElement("input");
      inputDesc.type = "text";
      inputDesc.id = `desc-input-${id}`;
      inputDesc.maxLength = 100;
      inputDesc.placeholder = "Descrizione...";
      inputDesc.required = true;
      formDiv.appendChild(inputDesc);

      const btnsNote = document.createElement("div");
      btnsNote.className = "btns-note";

      const addBtn = document.createElement("button");
      addBtn.className = "btn-green";
      addBtn.textContent = "Aggiungi Nota";
      addBtn.onclick = () => aggiungiNota(id);

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-red";
      cancelBtn.textContent = "Annulla";
      cancelBtn.onclick = () => {
        inputData.value = "";
        inputDesc.value = "";
      };

      btnsNote.appendChild(addBtn);
      btnsNote.appendChild(cancelBtn);

      formDiv.appendChild(btnsNote);
      macchinarioDiv.appendChild(formDiv);

      const btnsMacchinario = document.createElement("div");
      btnsMacchinario.className = "btns-macchinario";

      const closeBtn = document.createElement("button");
      closeBtn.className = "btn-red";
      closeBtn.textContent = "Chiudi Dettagli";
      closeBtn.onclick = () => renderMacchinari();

      const renameBtn = document.createElement("button");
      renameBtn.className = "btn-blue";
      renameBtn.textContent = "Rinomina Macchinario";
      renameBtn.onclick = () => rinominaMacchinario(id);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-red";
      deleteBtn.textContent = "Elimina Macchinario";
      deleteBtn.onclick = () => eliminaMacchinario(id);

      btnsMacchinario.appendChild(closeBtn);
      btnsMacchinario.appendChild(renameBtn);
      btnsMacchinario.appendChild(deleteBtn);

      macchinarioDiv.appendChild(btnsMacchinario);
    }

    listContainer.appendChild(macchinarioDiv);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) savedMacchinari[id] = { nome, note: [] };
  else savedMacchinari[id].nome = nome;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Inserisci il nuovo nome del macchinario:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function aggiungiNota(id) {
  const dataInput = document.getElementById(`data-input-${id}`);
  const descInput = document.getElementById(`desc-input-${id}`);
  if (!dataInput.value || !descInput.value) {
    alert("Inserisci data e descrizione validi.");
    return;
  }
  const nota = {
    data: dataInput.value,
    desc: descInput.value.trim().slice(0, 100),
  };
  savedMacchinari[id].note = savedMacchinari[id].note || [];
  savedMacchinari[id].note.push(nota);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function eliminaNota(id, idx) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[id].note.splice(idx, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function modificaNota(id, idx) {
  const nota = savedMacchinari[id].note[idx];
  if (!nota) return;

  const dataInput = document.getElementById(`data-input-${id}`);
  const descInput = document.getElementById(`desc-input-${id}`);

  dataInput.value = nota.data;
  descInput.value = nota.desc;

  // Rimuovo vecchia nota per riscriverla dopo modifica
  savedMacchinari[id].note.splice(idx, 1);
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aa = String(d.getFullYear()).slice(-2);
  return `${gg}/${mm}/${aa}`;
}

async function startScanner() {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  try {
    const devices = await Html5Qrcode.getCameras();

    if (!devices || devices.length === 0) {
      alert("Nessuna fotocamera trovata.");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }

    // Forza fotocamera posteriore
    cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[devices.length - 1].id;

    reader.classList.remove("hidden");

    if (html5QrcodeScanner) {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
      await html5QrcodeScanner.start(cameraId, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback, qrCodeErrorCallback);
    } else {
      html5QrcodeScanner = new Html5Qrcode("reader");
      await html5QrcodeScanner.start(cameraId, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback, qrCodeErrorCallback);
    }
  } catch (err) {
    alert("Errore nell'avvio della fotocamera: " + err.message);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

async function stopScanner() {
  stopBtn.disabled = true;
  startBtn.disabled = false;
  reader.classList.add("hidden");

  if (html5QrcodeScanner) {
    try {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
    } catch {}
  }
}

function qrCodeSuccessCallback(decodedText, decodedResult) {
  stopScanner();

  let nome = prompt("QR scansionato: " + decodedText + "\nInserisci nome macchinario:");
  if (!nome || nome.trim() === "") {
    nome = decodedText;
  }

  const id = decodedText;

  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome: nome.trim(), note: [] };
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function qrCodeErrorCallback(errorMessage) {
  // non serve fare niente
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

renderMacchinari();
