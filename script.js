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

    // nome con onclick per modifica, e tasto elimina
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
            <input type="date" name="data" required />
            <input type="text" name="desc" placeholder="Descrizione" required />
            <button type="submit">➕ Aggiungi nota</button>
          </form>
          <button onclick="toggleExpand('${id}')">🔽 Chiudi</button>
        </div>
      `;
    } else {
      innerHTML += `
        <button onclick="toggleExpand('${id}')" title="Mostra note">🔼 Dettagli</button>
      `;
    }

    box.innerHTML = innerHTML;
    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome, note: [] };
  } else {
    savedMacchinari[id].nome = nome;
  }
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

function modificaMacchinario(id) {
  const nuovoNome = prompt("Modifica nome macchinario:", savedMacchinari[id].nome);
  if (nuovoNome === null) return;
  if (nuovoNome.trim()) {
    savedMacchinari[id].nome = nuovoNome.trim();
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari();
  } else {
    alert("Il nome non può essere vuoto!");
  }
}

function toggleExpand(id) {
  const expandedId = document.querySelector(".macchinario.expanded")?.querySelector("h3")?.textContent === savedMacchinari[id].nome
    ? null
    : id;
  renderMacchinari(expandedId);
}

function aggiungiNota(event, id) {
  event.preventDefault();
  const form = event.target;
  const dataVal = form.data.value;
  const descVal = form.desc.value.trim();
  if (!dataVal || !descVal) return alert("Compila data e descrizione");

  if (!savedMacchinari[id].note) savedMacchinari[id].note = [];
  savedMacchinari[id].note.push({ data: dataVal, desc: descVal });
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function modificaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  if (!nota) return;
  const nuovaData = prompt("Modifica data:", nota.data);
  if (nuovaData === null || nuovaData.trim() === "") return;
  const nuovaDesc = prompt("Modifica descrizione:", nota.desc);
  if (nuovaDesc === null || nuovaDesc.trim() === "") return;

  savedMacchinari[id].note[index] = { data: nuovaData.trim(), desc: nuovaDesc.trim() };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari(id);
}

function eliminaNota(id, index) {
  if (confirm("Eliminare questa nota?")) {
    savedMacchinari[id].note.splice(index, 1);
    localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
    renderMacchinari(id);
  }
}

function onScanSuccess(qr) {
  html5QrcodeScanner.clear().then(() => {
    reader.classList.add("hidden");
    if (!savedMacchinari[qr]) {
      const nome = prompt("Nome del macchinario:");
      if (nome && nome.trim()) {
        salvaMacchinario(qr, nome.trim());
      } else {
        renderMacchinari();
      }
    } else {
      renderMacchinari(qr);
    }
  });
}

let html5QrcodeScanner;

startBtn.addEventListener("click", () => {
  reader.classList.remove("hidden");
  html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 280 });
  html5QrcodeScanner.render(onScanSuccess);
});

renderMacchinari();
