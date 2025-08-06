const foldersList = document.getElementById("folders-list");
const btnAddFolder = document.getElementById("btn-add-folder");

let folders = JSON.parse(localStorage.getItem("folders") || "{}");

function ordinaCartelle() {
  return Object.entries(folders).sort((a, b) => {
    const annoA = parseInt(a[1].anno);
    const annoB = parseInt(b[1].anno);
    return annoB - annoA;
  });
}

function renderFolders() {
  foldersList.innerHTML = "";
  const foldersOrdinati = ordinaCartelle();

  foldersOrdinati.forEach(([id, folder]) => {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";
    folderDiv.dataset.id = id;

    folderDiv.innerHTML = `
      <img src="img/folder-icon.jpg" alt="Icona cartella" class="folder-icon" />
      <h2>${folder.nome}</h2>
      <div class="year">${folder.anno}</div>
      <div class="btns">
        <button title="Rinomina" class="btn-rename">✏️</button>
        <button title="Elimina" class="btn-delete">🗑️</button>
        <button title="Copia tutto" class="btn-copy">📋</button>
      </div>
    `;

    folderDiv.querySelector(".btn-rename").onclick = (e) => {
      e.stopPropagation();
      rinominaCartella(id);
    };

    folderDiv.querySelector(".btn-delete").onclick = (e) => {
      e.stopPropagation();
      eliminaCartella(id);
    };

    folderDiv.querySelector(".btn-copy").onclick = (e) => {
      e.stopPropagation();
      copiaTuttoCartella(id);
    };

    folderDiv.onclick = () => {
      window.location.href = `index.html?id=${encodeURIComponent(id)}`;
    };

    foldersList.appendChild(folderDiv);
  });
}

btnAddFolder.onclick = () => {
  const anno = prompt("Inserisci l'anno della cartella (es. 2023):")?.trim();
  if (!anno || !/^\d{4}$/.test(anno)) {
    alert("Anno non valido. Usa 4 cifre, es: 2023");
    return;
  }

  if (Object.values(folders).some(f => f.anno === anno)) {
    alert("Esiste già una cartella con questo anno.");
    return;
  }

  const nome = `Cartella ${anno}`;
  const id = "folder-" + Math.random().toString(36).slice(2, 9);

  folders[id] = { nome, anno, manutenzioni: [] };
  salvaCartelle();
  renderFolders();
};

function rinominaCartella(id) {
  const nuovoNome = prompt("Nuovo nome cartella:", folders[id].nome)?.trim();
  if (!nuovoNome) return;

  if (Object.entries(folders).some(([key, f]) => f.nome === nuovoNome && key !== id)) {
    alert("Nome già esistente.");
    return;
  }

  folders[id].nome = nuovoNome;
  salvaCartelle();
  renderFolders();
}

function eliminaCartella(id) {
  if (confirm(`Sei sicuro di eliminare la cartella "${folders[id].nome}"?`)) {
    delete folders[id];
    salvaCartelle();
    renderFolders();
  }
}

function copiaTuttoCartella(id) {
  const folder = folders[id];
  if (!folder) return;

  let testo = `${folder.nome.toUpperCase()} (${folder.anno})\n\n`;

  if (!folder.manutenzioni.length) {
    testo += "(Nessuna manutenzione presente)\n";
  } else {
    folder.manutenzioni.forEach(m => {
      testo += `- ${m.nome}\n`;
      if (m.note && m.note.length) {
        m.note.forEach(n => {
          testo += `   • [${n.data}]: ${n.desc}\n`;
        });
      }
    });
  }

  navigator.clipboard.writeText(testo)
    .then(() => alert("📋 Contenuto copiato negli appunti!"))
    .catch(() => alert("Errore durante la copia negli appunti."));
}

function salvaCartelle() {
  localStorage.setItem("folders", JSON.stringify(folders));
}

renderFolders();
