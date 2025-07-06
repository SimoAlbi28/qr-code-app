const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");

let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5Qr;

function salvaMacchinari() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function renderMacchinari() {
  listContainer.innerHTML = "";

  Object.entries(savedMacchinari).forEach(([id, data]) => {
    const box = document.createElement("div");
    box.className = "macchinario";

    const nome = document.createElement("h3");
    nome.textContent = data.nome.toUpperCase();

    const toggle = document.createElement("button");
    toggle.textContent = data.espanso ? "➖" : "➕";
    toggle.className = "toggle-btn";
    toggle.onclick = () => {
      data.espanso = !data.espanso;
      salvaMacchinari();
      renderMacchinari();
    };

    const nomeContainer = document.createElement("div");
    nomeContainer.className = "nome-e-btn";
    nomeContainer.appendChild(nome);
    nomeContainer.appendChild(toggle);
    box.appendChild(nomeContainer);

    if (data.espanso) {
      const form = document.createElement("div");
      form.className = "note-form";

      const inputData = document.createElement("input");
      inputData.type = "date";
      inputData.required = true;

      const inputDesc = document.createElement("input");
      inputDesc.type = "text";
      inputDesc.maxLength = 100;
      inputDesc.placeholder = "Descrizione (max 100 caratteri)";

      const btnAggiungi = document.createElement("button");
      btnAggiungi.textContent = "➕ Aggiungi Nota";
      btnAggiungi.className = "btn-green";
      btnAggiungi.onclick = () => {
        const dataVal = inputData.value;
        const descVal = inputDesc.value.trim();
        if (dataVal && descVal) {
          data.note.push({ data: dataVal, desc: descVal });
          data.note.sort((a, b) => new Date(b.data) - new Date(a.data));
          salvaMacchinari();
          renderMacchinari();
        }
      };

      form.appendChild(inputData);
      form.appendChild(inputDesc);
      form.appendChild(btnAggiungi);
      box.appendChild(form);

      const ul = document.createElement("ul");
      ul.className = "note-list";
      data.note.forEach((nota, index) => {
        const li = document.createElement("li");

        const spanData = document.createElement("div");
        spanData.className = "nota-data";
        const [y, m, d] = nota.data.split("-");
        spanData.textContent = `${d}/${m}/${y}`;

        const spanDesc = document.createElement("div");
        spanDesc.className = "nota-desc";
        spanDesc.textContent = nota.desc;

        const btns = document.createElement("div");
        btns.className = "btns-note";

        const btnModifica = document.createElement("button");
        btnModifica.textContent = "✏️";
        btnModifica.className = "btn-blue";
        btnModifica.onclick = () => {
          inputData.value = nota.data;
          inputDesc.value = nota.desc;
          data.note.splice(index, 1);
          salvaMacchinari();
          renderMacchinari();
        };

        const btnElimina = document.createElement("button");
        btnElimina.textContent = "🗑️";
        btnElimina.className = "btn-red";
        btnElimina.onclick = () => {
          data.note.splice(index, 1);
          salvaMacchinari();
          renderMacchinari();
        };

        btns.appendChild(btnModifica);
        btns.appendChild(btnElimina);

        li.appendChild(btns);
        li.appendChild(spanData);
        li.appendChild(spanDesc);

        ul.appendChild(li);
      });
      box.appendChild(ul);
    }

    listContainer.appendChild(box);
  });
}

startBtn.addEventListener("click", () => {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5Qr = new Html5Qrcode("reader");
  html5Qr.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      html5Qr.stop().then(() => {
        reader.classList.add("hidden");
        startBtn.disabled = false;
        stopBtn.disabled = true;

        if (!savedMacchinari[decodedText]) {
          const nome = prompt("Nome del macchinario:");
          if (nome) {
            savedMacchinari[decodedText] = {
              nome,
              note: [],
              espanso: false,
            };
            salvaMacchinari();
          }
        } else {
          savedMacchinari[decodedText].espanso = true;
          salvaMacchinari();
        }

        renderMacchinari();
      });
    },
    (err) => {}
  );
});

stopBtn.addEventListener("click", () => {
  if (html5Qr) {
    html5Qr.stop().then(() => {
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
});

renderMacchinari();
