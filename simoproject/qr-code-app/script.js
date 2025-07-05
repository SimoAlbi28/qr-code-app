const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const entriesOrdinate = Object.entries(savedMacchinari).sort((a, b) => {
    return a[1].nome.localeCompare(b[1].nome);
  });

  entriesOrdinate.forEach(([id, data]) => {
    const expanded = id === highlightId;
    const box = document.createElement("div");
    box.className = "macchinario" + (expanded ? " expanded" : "");
    box.innerHTML = `
      <h3>${data.nome}</h3>
      ${expanded ? `<p>${data.desc}</p>` : ""}
      <div class="btns">
        ${expanded ? `<button onclick="modificaMacchinario('${id}')">✏️</button>` : ""}
        ${expanded ? `<button onclick="chiudiMacchinario('${id}')">🔽</button>` : `<button onclick="espandiMacchinario('${id}')">🔼</button>`}
        <button onclick="eliminaMacchinario('${id}')">🗑️</button>
      </div>
    `;
    listContainer.appendChild(box);
  });
}

function salvaMacchinario(id, nome, desc) {
  savedMacchinari[id] = { nome, desc };
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  delete savedMacchinari[id];
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function modificaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome);
  const nuovaDesc = prompt("Nuova descrizione:", savedMacchinari[id].desc);
  if (nuovoNome && nuovaDesc) {
    salvaMacchinario(id, nuovoNome, nuovaDesc);
  }
}

function espandiMacchinario(id) {
  renderMacchinari(id);
}

function chiudiMacchinario(id) {
  renderMacchinari();
}

function onScanSuccess(qr) {
  html5QrcodeScanner.clear().then(() => {
    reader.classList.add("hidden");
    if (!savedMacchinari[qr]) {
      const nome = prompt("Nome del macchinario:");
      const desc = prompt("Descrizione:");
      if (nome && desc) {
        salvaMacchinario(qr, nome, desc);
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
