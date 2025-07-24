const traduzioni = {
  it: {
    benvenuto: "Ciao! Cosa vuoi ordinare?",
    categorie: ["🍕 Pizza", "🍣 Sushi", "🥤 Bevande", "🍰 Dolci"],
    menu: {
      "🍕 Pizza": [
        { nome: "Margherita", prezzo: 6 },
        { nome: "Diavola", prezzo: 7 },
        { nome: "Quattro Formaggi", prezzo: 7.5 },
        { nome: "Capricciosa", prezzo: 8 },
        { nome: "Vegetariana", prezzo: 6.5 },
        { nome: "Prosciutto", prezzo: 7 }
      ],
      "🍣 Sushi": [
        { nome: "Nigiri Misto", prezzo: 10 },
        { nome: "Uramaki Salmone", prezzo: 9 },
        { nome: "Futomaki Verdure", prezzo: 8 },
        { nome: "Sashimi Tonno", prezzo: 11 },
        { nome: "Hosomaki Cetriolo", prezzo: 6.5 }
      ],
      "🥤 Bevande": [
        { nome: "Acqua Naturale", prezzo: 1 },
        { nome: "Cola", prezzo: 2 },
        { nome: "Aranciata", prezzo: 2 },
        { nome: "Tè Freddo", prezzo: 2.5 },
        { nome: "Birra", prezzo: 3 }
      ],
      "🍰 Dolci": [
        { nome: "Tiramisù", prezzo: 4 },
        { nome: "Cheesecake", prezzo: 4.5 },
        { nome: "Panna Cotta", prezzo: 4 },
        { nome: "Gelato alla Vaniglia", prezzo: 3.5 }
      ]
    },
    carrelloVuoto: "Il carrello è vuoto.",
    totale: "Totale",
    annulla: "Annulla ordine",
    ordineConfermato: "Ordine confermato! Grazie!"
  },
  en: {
    benvenuto: "Hi! What would you like to order?",
    categorie: ["🍕 Pizza", "🍣 Sushi", "🥤 Drinks", "🍰 Desserts"],
    menu: {
      "🍕 Pizza": [
        { nome: "Margherita", prezzo: 6 },
        { nome: "Spicy Salami", prezzo: 7 },
        { nome: "Four Cheese", prezzo: 7.5 },
        { nome: "Capricciosa", prezzo: 8 },
        { nome: "Vegetarian", prezzo: 6.5 },
        { nome: "Ham", prezzo: 7 }
      ],
      "🍣 Sushi": [
        { nome: "Mixed Nigiri", prezzo: 10 },
        { nome: "Salmon Uramaki", prezzo: 9 },
        { nome: "Veg Futomaki", prezzo: 8 },
        { nome: "Tuna Sashimi", prezzo: 11 },
        { nome: "Cucumber Hosomaki", prezzo: 6.5 }
      ],
      "🥤 Drinks": [
        { nome: "Water", prezzo: 1 },
        { nome: "Cola", prezzo: 2 },
        { nome: "Orange soda", prezzo: 2 },
        { nome: "Iced Tea", prezzo: 2.5 },
        { nome: "Beer", prezzo: 3 }
      ],
      "🍰 Desserts": [
        { nome: "Tiramisù", prezzo: 4 },
        { nome: "Cheesecake", prezzo: 4.5 },
        { nome: "Panna cotta", prezzo: 4 },
        { nome: "Vanilla Ice Cream", prezzo: 3.5 }
      ]
    },
    carrelloVuoto: "Your cart is empty.",
    totale: "Total",
    annulla: "Cancel order",
    ordineConfermato: "Order confirmed! Thank you!"
  },
  es: {
    benvenuto: "¡Hola! ¿Qué te gustaría pedir?",
    categorie: ["🍕 Pizza", "🍣 Sushi", "🥤 Bebidas", "🍰 Postres"],
    menu: {
      "🍕 Pizza": [
        { nome: "Margherita", prezzo: 6 },
        { nome: "Diávola", prezzo: 7 },
        { nome: "Cuatro Quesos", prezzo: 7.5 },
        { nome: "Capricciosa", prezzo: 8 },
        { nome: "Vegetariana", prezzo: 6.5 },
        { nome: "Jamón", prezzo: 7 }
      ],
      "🍣 Sushi": [
        { nome: "Nigiri mixto", prezzo: 10 },
        { nome: "Uramaki de salmón", prezzo: 9 },
        { nome: "Futomaki vegetal", prezzo: 8 },
        { nome: "Sashimi de atún", prezzo: 11 },
        { nome: "Hosomaki de pepino", prezzo: 6.5 }
      ],
      "🥤 Bebidas": [
        { nome: "Agua", prezzo: 1 },
        { nome: "Cola", prezzo: 2 },
        { nome: "Naranja", prezzo: 2 },
        { nome: "Té helado", prezzo: 2.5 },
        { nome: "Cerveza", prezzo: 3 }
      ],
      "🍰 Postres": [
        { nome: "Tiramisú", prezzo: 4 },
        { nome: "Cheesecake", prezzo: 4.5 },
        { nome: "Panna Cotta", prezzo: 4 },
        { nome: "Helado de vainilla", prezzo: 3.5 }
      ]
    },
    carrelloVuoto: "Tu carrito está vacío.",
    totale: "Total",
    annulla: "Cancelar pedido",
    ordineConfermato: "¡Pedido confirmado! ¡Gracias!"
  },
  de: {
    benvenuto: "Hallo! Was möchtest du bestellen?",
    categorie: ["🍕 Pizza", "🍣 Sushi", "🥤 Getränke", "🍰 Nachtisch"],
    menu: {
      "🍕 Pizza": [
        { nome: "Margherita", prezzo: 6 },
        { nome: "Diavola", prezzo: 7 },
        { nome: "Vier Käse", prezzo: 7.5 },
        { nome: "Capricciosa", prezzo: 8 },
        { nome: "Vegetarisch", prezzo: 6.5 },
        { nome: "Schinken", prezzo: 7 }
      ],
      "🍣 Sushi": [
        { nome: "Nigiri Mischung", prezzo: 10 },
        { nome: "Lachs Uramaki", prezzo: 9 },
        { nome: "Futomaki Gemüse", prezzo: 8 },
        { nome: "Thunfisch Sashimi", prezzo: 11 },
        { nome: "Hosomaki Gurke", prezzo: 6.5 }
      ],
      "🥤 Getränke": [
        { nome: "Wasser", prezzo: 1 },
        { nome: "Cola", prezzo: 2 },
        { nome: "Orangensaft", prezzo: 2 },
        { nome: "Eistee", prezzo: 2.5 },
        { nome: "Bier", prezzo: 3 }
      ],
      "🍰 Nachtisch": [
        { nome: "Tiramisù", prezzo: 4 },
        { nome: "Käsekuchen", prezzo: 4.5 },
        { nome: "Panna Cotta", prezzo: 4 },
        { nome: "Vanilleeis", prezzo: 3.5 }
      ]
    },
    carrelloVuoto: "Dein Warenkorb ist leer.",
    totale: "Summe",
    annulla: "Bestellung abbrechen",
    ordineConfermato: "Bestellung bestätigt! Danke!"
  },
  fr: {
    benvenuto: "Bonjour! Que souhaitez-vous commander?",
    categorie: ["🍕 Pizza", "🍣 Sushi", "🥤 Boissons", "🍰 Desserts"],
    menu: {
      "🍕 Pizza": [
        { nome: "Margherita", prezzo: 6 },
        { nome: "Diavola", prezzo: 7 },
        { nome: "Quatre Fromages", prezzo: 7.5 },
        { nome: "Capricciosa", prezzo: 8 },
        { nome: "Végétarienne", prezzo: 6.5 },
        { nome: "Jambon", prezzo: 7 }
      ],
      "🍣 Sushi": [
        { nome: "Nigiri Mixte", prezzo: 10 },
        { nome: "Uramaki Saumon", prezzo: 9 },
        { nome: "Futomaki Légumes", prezzo: 8 },
        { nome: "Sashimi Thon", prezzo: 11 },
        { nome: "Hosomaki Concombre", prezzo: 6.5 }
      ],
      "🥤 Boissons": [
        { nome: "Eau", prezzo: 1 },
        { nome: "Cola", prezzo: 2 },
        { nome: "Soda à l'orange", prezzo: 2 },
        { nome: "Thé glacé", prezzo: 2.5 },
        { nome: "Bière", prezzo: 3 }
      ],
      "🍰 Desserts": [
        { nome: "Tiramisu", prezzo: 4 },
        { nome: "Cheesecake", prezzo: 4.5 },
        { nome: "Panna Cotta", prezzo: 4 },
        { nome: "Glace à la vanille", prezzo: 3.5 }
      ]
    },
    carrelloVuoto: "Votre panier est vide.",
    totale: "Total",
    annulla: "Annuler la commande",
    ordineConfermato: "Commande confirmée! Merci!"
  }
};

// Inserisci qui le traduzioni come prima

// Inserisci qui le traduzioni come prima

let lingua = null;
let carrello = {};
let categoriaSelezionata = null;
let ordiniConfermati = JSON.parse(localStorage.getItem("ordiniConfermati")) || [];

const homeEl = document.getElementById("home");
const appEl = document.getElementById("app");
const categoriesTitleEl = document.getElementById("categories-title");
const categoriesListEl = document.getElementById("categories-list");
const productsSectionEl = document.getElementById("products-section");
const productsTitleEl = document.getElementById("products-title");
const productsListEl = document.getElementById("products-list");
const btnBackToCategories = document.getElementById("btnBackToCategories");

const cartSectionEl = document.getElementById("cart-section");
const cartListEl = document.getElementById("cart-list");
const cartTotalEl = document.getElementById("cart-total");
const btnConfirmOrder = document.getElementById("btnConfirmOrder");
const btnCancelOrder = document.getElementById("btnCancelOrder");
const btnViewCart = document.getElementById("btnViewCart");
const btnContinueOrdering = document.getElementById("btnContinueOrdering");
const btnChangeLanguage = document.getElementById("btnChangeLanguage");
const btnShowOrders = document.getElementById("btnShowOrders");
const ordersSectionEl = document.getElementById("orders-section");
const ordersListEl = document.getElementById("orders-list");

btnViewCart.onclick = () => showCart();
btnContinueOrdering.onclick = () => showCategories();
btnChangeLanguage.onclick = () => resetApp();
btnShowOrders.onclick = () => showOrders();
btnBackToCategories.onclick = () => showCategories();

btnConfirmOrder.onclick = () => {
  const now = new Date();
  const totale = Object.keys(carrello).reduce((acc, key) => acc + carrello[key].prodotto.prezzo * carrello[key].qty, 0);
  const nuovoOrdine = {
    id: ordiniConfermati.length + 1,
    data: now.toLocaleDateString(),
    ora: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    prodotti: Object.values(carrello),
    totale: totale.toFixed(2)
  };
  ordiniConfermati.push(nuovoOrdine);
  localStorage.setItem("ordiniConfermati", JSON.stringify(ordiniConfermati));
  alert(traduzioni[lingua].ordineConfermato);
  carrello = {};
  showCategories();
};

btnCancelOrder.onclick = () => {
  if (confirm(traduzioni[lingua].annulla + "?")) {
    carrello = {};
    showCategories();
  }
};

document.querySelectorAll(".flags img").forEach((img) => {
  img.onclick = () => {
    const lang = img.getAttribute("alt").toLowerCase().slice(0, 2);
    setLanguage(lang);
  };
});

function setLanguage(lang) {
  lingua = lang;
  localStorage.setItem("lingua", lang);
  homeEl.classList.add("hidden");
  appEl.classList.remove("hidden");
  showCategories();
}

function resetApp() {
  lingua = null;
  carrello = {};
  categoriaSelezionata = null;
  homeEl.classList.remove("hidden");
  appEl.classList.add("hidden");
  productsSectionEl.classList.add("hidden");
  cartSectionEl.classList.add("hidden");
  ordersSectionEl.classList.add("hidden");
}

function showCategories() {
  categoriaSelezionata = null;
  productsSectionEl.classList.add("hidden");
  cartSectionEl.classList.add("hidden");
  ordersSectionEl.classList.add("hidden");
  btnViewCart.classList.remove("hidden");
  btnContinueOrdering.classList.add("hidden");

  categoriesListEl.innerHTML = "";
  categoriesTitleEl.textContent = traduzioni[lingua].benvenuto;

  traduzioni[lingua].categorie.forEach((cat) => {
    const div = document.createElement("div");
    div.className = "category-item";
    div.textContent = cat;
    div.onclick = () => {
      categoriaSelezionata = cat;
      showProducts(cat);
    };
    categoriesListEl.appendChild(div);
  });

  document.getElementById("categories-section").classList.remove("hidden");
}

function showProducts(cat) {
  productsSectionEl.classList.remove("hidden");
  document.getElementById("categories-section").classList.add("hidden");
  cartSectionEl.classList.add("hidden");
  ordersSectionEl.classList.add("hidden");
  btnViewCart.classList.remove("hidden");
  btnContinueOrdering.classList.add("hidden");

  productsTitleEl.textContent = cat;
  productsListEl.innerHTML = "";

  const prodotti = traduzioni[lingua].menu[cat];
  prodotti.forEach((prodotto) => {
    const div = document.createElement("div");
    div.className = "product-item";

    const nameSpan = document.createElement("span");
    nameSpan.className = "product-name";
    nameSpan.textContent = `${prodotto.nome} - €${prodotto.prezzo.toFixed(2)}`;

    const qtyControls = document.createElement("div");
    qtyControls.className = "qty-controls";

    const btnMinus = document.createElement("button");
    btnMinus.className = "qty-btn";
    btnMinus.textContent = "−";

    const qtyDisplay = document.createElement("span");
    qtyDisplay.className = "qty-display";
    const key = prodotto.nome;
    qtyDisplay.textContent = carrello[key]?.qty || 0;

    const btnPlus = document.createElement("button");
    btnPlus.className = "qty-btn";
    btnPlus.textContent = "+";

    btnMinus.onclick = () => {
      if (carrello[key]?.qty > 0) {
        carrello[key].qty--;
        if (carrello[key].qty === 0) delete carrello[key];
        qtyDisplay.textContent = carrello[key]?.qty || 0;
      }
    };
    btnPlus.onclick = () => {
      if (!carrello[key]) {
        carrello[key] = { prodotto: prodotto, qty: 1 };
      } else {
        carrello[key].qty++;
      }
      qtyDisplay.textContent = carrello[key].qty;
    };

    qtyControls.appendChild(btnMinus);
    qtyControls.appendChild(qtyDisplay);
    qtyControls.appendChild(btnPlus);

    div.appendChild(nameSpan);
    div.appendChild(qtyControls);

    productsListEl.appendChild(div);
  });
}

function showCart() {
  productsSectionEl.classList.add("hidden");
  document.getElementById("categories-section").classList.add("hidden");
  cartSectionEl.classList.remove("hidden");
  ordersSectionEl.classList.add("hidden");
  btnViewCart.classList.add("hidden");
  btnContinueOrdering.classList.remove("hidden");

  cartListEl.innerHTML = "";
  const keys = Object.keys(carrello);
  if (keys.length === 0) {
    cartListEl.textContent = traduzioni[lingua].carrelloVuoto;
    cartTotalEl.textContent = "";
    return;
  }

  keys.forEach((key) => {
    const item = carrello[key];
    const div = document.createElement("div");
    div.className = "cart-item";

    const nameQty = document.createElement("span");
    nameQty.textContent = `${item.prodotto.nome} × ${item.qty}`;

    const btnMinus = document.createElement("button");
    btnMinus.className = "qty-btn";
    btnMinus.textContent = "−";
    btnMinus.onclick = () => {
      if (item.qty > 1) {
        item.qty--;
      } else {
        delete carrello[key];
      }
      showCart();
    };

    const qtyDisplay = document.createElement("span");
    qtyDisplay.className = "qty-display";
    qtyDisplay.textContent = item.qty;

    const btnPlus = document.createElement("button");
    btnPlus.className = "qty-btn";
    btnPlus.textContent = "+";
    btnPlus.onclick = () => {
      item.qty++;
      showCart();
    };

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✖";
    removeBtn.onclick = () => {
      delete carrello[key];
      showCart();
    };

    div.appendChild(nameQty);
    div.appendChild(btnMinus);
    div.appendChild(qtyDisplay);
    div.appendChild(btnPlus);
    div.appendChild(removeBtn);

    cartListEl.appendChild(div);
  });

  const totale = keys.reduce(
    (acc, key) => acc + carrello[key].prodotto.prezzo * carrello[key].qty,
    0
  );
  cartTotalEl.textContent = `${traduzioni[lingua].totale}: €${totale.toFixed(2)}`;
}

function showOrders() {
  categoriesListEl.innerHTML = "";
  cartSectionEl.classList.add("hidden");
  productsSectionEl.classList.add("hidden");
  ordersSectionEl.classList.remove("hidden");

  ordersListEl.innerHTML = "";

  ordiniConfermati.slice().reverse().forEach((ordine, index) => {
    const card = document.createElement("div");
    card.className = "order-card";

    const header = document.createElement("h3");
    header.style.textAlign = "center";
    header.innerHTML = `Ordine #${ordine.id} - ${ordine.data} ${ordine.ora}`;
    card.appendChild(header);

    ordine.prodotti.forEach((p) => {
      const riga = document.createElement("div");
      riga.textContent = `🧾 ${p.prodotto.nome} × ${p.qty} - €${(p.prodotto.prezzo * p.qty).toFixed(2)}`;
      card.appendChild(riga);
    });

    const totaleEl = document.createElement("div");
    totaleEl.style.marginTop = "10px";
    totaleEl.style.fontWeight = "bold";
    totaleEl.style.textAlign = "right";
    totaleEl.textContent = `Totale ordine: €${ordine.totale}`;
    card.appendChild(totaleEl);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑 Elimina ordine";
    deleteBtn.className = "remove-btn";
    deleteBtn.style.marginTop = "10px";
    deleteBtn.onclick = () => {
      ordiniConfermati.splice(ordiniConfermati.length - 1 - index, 1);
      localStorage.setItem("ordiniConfermati", JSON.stringify(ordiniConfermati));
      showOrders();
    };
    card.appendChild(deleteBtn);

    ordersListEl.appendChild(card);
  });
}
