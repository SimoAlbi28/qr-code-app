const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

function renderMacchinari(expandedId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === expandedId;

    const box = document.createElement("div");
    box.className = "macchinario" + (expanded ? " expanded" : "");

    let innerHTML = `
      <div class="macchinario-header">
        <h3 class="clickable" onclick="modificaMacchinario('${id}')">${data.nome}</h3>
        <button class="btn-elimina" title="Elimina macchinario" onclick="eliminaMacchinario('${id}')">🗑️</button>
      </div>
    `;

    if (expanded) {
      innerHTML += `
        <div class="note-section">
          <h4>Note</h4>
          <ul class="note-list">
            ${
              data.note && data.note.length
                ? data.note
                    .map(
                      (n, i) => `
                      <li>
                        <strong>${n.data}</strong>: ${n.desc}
                        <button title="Modifica nota" onclick="modificaNota('${id}', ${i})">✏️</button>
                        <button title="Elimina nota" onclick="eliminaNota('${id}', ${i})">🗑️</button>
                      </li>`
                    )
                    .join("")
                : "<li>Nessuna nota</li>"
            }
          </ul>
          <form onsubmit="aggiungiNota(event, '${id}')">
            <input type="date" name="data" required aria-label="Data nota" />
            <input type="text" name="desc" placeholder="Descrizione" required aria-label="Descrizione nota" />
            <button type="submit">➕ Aggiungi nota</button>
          </form>
          <button onclick="toggleExpand('${id}')">🔽 Chiudi</button>
        </div>
      `;
    } else {
      innerHTML += `
        <button onclick="toggleExpand('${id}')" title="Mostra dettagli macchinario">🔼 Dettagli</button>
      `;
    }

    box.innerHTML = innerHTML;
    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome: nome, note: [] };
  } else {
    savedMacchinari[id].nome = nome;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
    delete savedMacchinari[id];
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  }
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Inserisci nuovo nome:", savedMacchinari[id].nome);
  if (nuovoNome && nuovoNome.trim() !== "") {
    salvaMacchinario(id, nuovoNome.trim());
  }
}

function toggleExpand(id) {
  const expandedId = document.querySelector(".macchinario.expanded")?.querySelector("h3")?.textContent === savedMacchinari[id].nome ? id : null;
  renderMacchinari(expandedId === id ? null : id);
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const data = form.data.value;
  const desc = form.desc.value.trim();
  if (data && desc) {
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
    form.reset();
  }
}

function eliminaNota(id, index) {
  if (confirm("Sei sicuro di voler eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  const nuovaData = prompt("Modifica data:", nota.data);
  const nuovaDesc = prompt("Modifica descrizione:", nota.desc);
  if (
    nuovaData &&
    nuovaDesc &&
    nuovaData.trim() !== "" &&
    nuovaDesc.trim() !== ""
  ) {
    savedMacchinari[id].note[index] = { data: nuovaData.trim(), desc: nuovaDesc.trim() };
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function onScanSuccess(qr) {
  html5QrcodeScanner.clear().then(() => {
    reader.classList.add("hidden");
    if (!savedMacchinari[qr]) {
      const nome = prompt("Inserisci il nome del macchinario:");
      if (nome && nome.trim() !== "") {
        salvaMacchinario(qr, nome.trim());
      }
    } else {
      renderMacchinari(qr);
    }
  });
}

let html5QrcodeScanner;

startBtn.addEventListener("click", () => {
  reader.classList.remove("hidden");
  html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
  html5QrcodeScanner.render(onScanSuccess);
});

renderMacchinari();
