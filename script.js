const WHATSAPP_NUMBER = "918869846824";
const STORAGE_KEY = "rider-rental-cart";

const bikes = [
  {
    id: "activa",
    name: "Honda Activa Grey",
    category: "scooter",
    price: 750,
    image: "assets/bikes/honda-activa-grey.jpg",
    alt: "Grey Honda Activa scooter available for rent",
    tag: "Scooter",
    route: "Haridwar local, ghats, railway pickup",
    specs: ["Easy ride", "City friendly"]
  },
  {
    id: "ntorq",
    name: "TVS Ntorq Blue",
    category: "scooter",
    price: 850,
    image: "assets/bikes/tvs-ntorq-blue.jpg",
    alt: "Blue TVS Ntorq scooter available for rent",
    tag: "Sport scooter",
    route: "Rishikesh runs, local touring and quick city rides",
    specs: ["Sporty", "Helmet ready"]
  },
  {
    id: "burgman",
    name: "Suzuki Burgman Black",
    category: "scooter",
    price: 799,
    image: "assets/bikes/suzuki-burgman-black.jpg",
    alt: "Black Suzuki Burgman scooter available for rent",
    tag: "Comfort scooter",
    route: "Rishikesh day rides and relaxed touring",
    specs: ["Comfort seat", "Storage"]
  },
  {
    id: "street-bike",
    name: "Street Bike",
    category: "bike",
    price: 899,
    image: "assets/bikes/street-bike.jpg",
    alt: "Street motorcycle available for rent",
    tag: "Bike",
    route: "City-to-city rides with more control",
    specs: ["Manual", "Hill approach"]
  },
  {
    id: "royal-enfield",
    name: "Royal Enfield Classic",
    category: "premium",
    price: 1200,
    image: "assets/bikes/classic-bullet.jpg",
    alt: "Royal Enfield Classic motorcycle available for rent",
    tag: "Premium",
    route: "Mussoorie, Tehri and longer hill rides",
    specs: ["Classic", "Manual"]
  },
  {
    id: "xpulse",
    name: "Hero Xpulse 200",
    category: "premium",
    price: 1199,
    image: "assets/bikes/hero-xpulse-200.jpg",
    alt: "Hero Xpulse 200 motorcycle available for rent",
    tag: "Adventure",
    route: "Rougher routes and mountain roads",
    specs: ["Adventure", "High stance"]
  },
  {
    id: "hunter",
    name: "Royal Enfield Hunter 350",
    category: "premium",
    price: 1500,
    image: "assets/bikes/hunter-350-red.jpg",
    alt: "Red Royal Enfield Hunter 350 motorcycle available for rent",
    tag: "Hunter",
    route: "Premium comfort for longer self-ride plans",
    specs: ["Premium", "Touring"]
  },
  {
    id: "group-ride",
    name: "Group Ride Pack",
    category: "bike",
    price: 750,
    image: "assets/bikes/group-riders-street.jpg",
    alt: "Group of riders with rental bikes",
    tag: "Group",
    route: "Multiple scooters or bikes for friends",
    specs: ["Bulk quote", "Flexible"]
  }
];

const validFilters = new Set(["all", "scooter", "bike", "premium"]);

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const state = {
  cart: loadCart(),
  filter: getInitialFilter(),
  lastCartTrigger: null,
  lastDurationPress: {
    at: 0,
    control: ""
  }
};

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const bikesGrid = document.querySelector("#bikes-grid");
const filterButtons = document.querySelectorAll("[data-filter]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const openCartButtons = document.querySelectorAll("[data-open-cart]");
const closeCartButtons = document.querySelectorAll("[data-close-cart]");
const closeCartLinks = document.querySelectorAll("[data-close-cart-link]");
const clearCartButton = document.querySelector("[data-clear-cart]");
const countTargets = document.querySelectorAll("[data-cart-count]");
const totalTargets = document.querySelectorAll("[data-cart-total]");
const bookingForm = document.querySelector("#booking-form");
const formStatus = document.querySelector("#form-status");
const durationInput = document.querySelector("#duration-days");
const pickupDateInput = document.querySelector("#pickup-date");
const pickupTimeInput = document.querySelector("#pickup-time");
const returnTimeInput = document.querySelector("#return-time");
const tiltTarget = document.querySelector("[data-tilt]");

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => bikes.some((bike) => bike.id === item.id));
  } catch {
    return [];
  }
}

function getInitialFilter() {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get("filter") || "all";
  return validFilters.has(filter) ? filter : "all";
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function getBike(id) {
  return bikes.find((bike) => bike.id === id);
}

function getDuration() {
  const value = Number.parseInt(durationInput?.value || "1", 10);
  if (Number.isNaN(value)) return 1;
  return Math.min(Math.max(value, 1), 30);
}

function setDurationDays(value) {
  if (!(durationInput instanceof HTMLInputElement)) return;
  const numericValue = Number.isFinite(value) ? value : 1;
  const clamped = Math.min(Math.max(numericValue, 1), 30);
  durationInput.value = String(clamped);
  renderCart();
}

function getDurationStepControl(target) {
  const control = target instanceof HTMLElement
    ? target.closest("[data-days-decrease], [data-days-increase]")
    : null;

  if (!(control instanceof HTMLElement)) return null;

  return control.hasAttribute("data-days-increase") ? "increase" : "decrease";
}

function applyDurationStep(control) {
  const step = control === "increase" ? 1 : -1;
  setDurationDays(getDuration() + step);
}

function handleDurationClick(event) {
  const control = getDurationStepControl(event.target);
  if (!control) return;

  event.preventDefault();
  applyDurationStep(control);
}

function cartCount() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function cartDailyTotal() {
  return state.cart.reduce((total, item) => {
    const bike = getBike(item.id);
    return total + (bike ? bike.price * item.quantity : 0);
  }, 0);
}

function cartTripTotal() {
  return cartDailyTotal() * getDuration();
}

function setStatus(message, type = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("error", type === "error");
  formStatus.classList.toggle("success", type === "success");
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  header?.classList.remove("menu-open");
  navLinks?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open menu");
}

function toggleMenu() {
  const isOpen = navLinks?.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", Boolean(isOpen));
  header?.classList.toggle("menu-open", Boolean(isOpen));
  menuToggle?.setAttribute("aria-expanded", String(Boolean(isOpen)));
  menuToggle?.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

function renderBikes() {
  if (!bikesGrid) return;

  const visibleBikes = state.filter === "all" ? bikes : bikes.filter((bike) => bike.category === state.filter);
  const fragment = document.createDocumentFragment();

  visibleBikes.forEach((bike, index) => {
    const card = document.createElement("article");
    card.className = "bike-card reveal";
    card.style.transitionDelay = `${Math.min(index, 5) * 35}ms`;

    const media = document.createElement("div");
    media.className = "bike-card-media";

    const image = document.createElement("img");
    image.src = bike.image;
    image.alt = bike.alt;
    image.width = 800;
    image.height = 750;
    image.loading = index < 2 ? "eager" : "lazy";

    const badge = document.createElement("span");
    badge.className = "bike-badge";
    badge.textContent = bike.tag;
    media.append(image, badge);

    const body = document.createElement("div");
    body.className = "bike-card-body";

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = bike.name;
    const description = document.createElement("p");
    description.textContent = bike.route;
    copy.append(title, description);

    const meta = document.createElement("div");
    meta.className = "bike-meta";
    bike.specs.forEach((spec) => {
      const chip = document.createElement("span");
      chip.textContent = spec;
      meta.append(chip);
    });

    const footer = document.createElement("div");
    footer.className = "bike-card-footer";

    const price = document.createElement("strong");
    price.className = "bike-price number";
    price.innerHTML = `${currency.format(bike.price)} <span>/day</span>`;

    const addButton = document.createElement("button");
    addButton.className = "button button-primary add-button";
    addButton.type = "button";
    addButton.dataset.addBike = bike.id;
    addButton.textContent = cartHasBike(bike.id) ? "Added" : "Add";

    footer.append(price, addButton);
    body.append(copy, meta, footer);
    card.append(media, body);
    fragment.append(card);
  });

  bikesGrid.replaceChildren(fragment);
  observeRevealItems();
}

function cartHasBike(id) {
  return state.cart.some((item) => item.id === id);
}

function addToCart(id, quantity = 1) {
  const bike = getBike(id);
  if (!bike) return;

  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    setStatus(`${bike.name} is already in your booking cart.`, "success");
    return;
  }

  state.cart.push({ id, quantity: 1 });

  saveCart();
  renderCart();
  renderBikes();
  setStatus(`${bike.name} added to booking cart.`, "success");
}

function setQuantity(id, quantity) {
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }

  state.cart = state.cart.map((item) => (item.id === id ? { ...item, quantity } : item));
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
  renderBikes();
}

function clearCart() {
  state.cart = [];
  saveCart();
  renderCart();
  renderBikes();
  setStatus("Add at least one ride to the booking cart.");
}

function renderCart() {
  const count = cartCount();
  const total = cartTripTotal();
  const duration = getDuration();

  countTargets.forEach((target) => {
    target.textContent = String(count);
  });

  totalTargets.forEach((target) => {
    target.textContent = currency.format(total);
  });

  if (!cartItems || !cartEmpty) return;

  cartEmpty.classList.toggle("is-hidden", count > 0);
  const fragment = document.createDocumentFragment();

  state.cart.forEach((item) => {
    const bike = getBike(item.id);
    if (!bike) return;

    const line = document.createElement("article");
    line.className = "cart-line";

    const image = document.createElement("img");
    image.src = bike.image;
    image.alt = "";
    image.width = 72;
    image.height = 72;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = bike.name;
    const price = document.createElement("p");
    price.className = "number";
    price.textContent = `${currency.format(bike.price)} per day x ${duration} day${duration > 1 ? "s" : ""}`;

    const actions = document.createElement("div");
    actions.className = "cart-line-actions";

    const quantity = document.createElement("div");
    quantity.className = "quantity";
    quantity.setAttribute("aria-label", "Rental duration in days");

    const minus = document.createElement("button");
    minus.className = "quantity-button";
    minus.type = "button";
    minus.dataset.decrease = item.id;
    minus.setAttribute("aria-label", "Decrease rental duration by one day");
    minus.textContent = "-";

    const amount = document.createElement("span");
    amount.className = "number";
    amount.textContent = String(duration);

    const plus = document.createElement("button");
    plus.className = "quantity-button";
    plus.type = "button";
    plus.dataset.increase = item.id;
    plus.setAttribute("aria-label", "Increase rental duration by one day");
    plus.textContent = "+";

    const remove = document.createElement("button");
    remove.className = "remove-line";
    remove.type = "button";
    remove.dataset.removeBike = item.id;
    remove.textContent = "Remove";

    quantity.append(minus, amount, plus);
    actions.append(quantity, remove);
    content.append(title, price, actions);
    line.append(image, content);
    fragment.append(line);
  });

  cartItems.replaceChildren(fragment);
}

function openCart(trigger = null) {
  state.lastCartTrigger = trigger;
  document.body.classList.add("cart-open");
  cartDrawer?.classList.add("is-open");
  cartDrawer?.setAttribute("aria-hidden", "false");
  cartDrawer?.querySelector("[data-close-cart]")?.focus();
}

function closeCart() {
  document.body.classList.remove("cart-open");
  cartDrawer?.classList.remove("is-open");
  cartDrawer?.setAttribute("aria-hidden", "true");
  if (state.lastCartTrigger instanceof HTMLElement) {
    state.lastCartTrigger.focus();
  }
}

function setFilter(filter) {
  state.filter = validFilters.has(filter) ? filter : "all";
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const params = new URLSearchParams(window.location.search);
  if (state.filter === "all") {
    params.delete("filter");
  } else {
    params.set("filter", state.filter);
  }
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
  renderBikes();
}

function setMinimumDate() {
  if (!(pickupDateInput instanceof HTMLInputElement)) return;
  const today = new Date();
  const offset = today.getTimezoneOffset() * 75000;
  const localDate = new Date(today.getTime() - offset).toISOString().split("T")[0];
  pickupDateInput.min = localDate;
}

function clearInvalidFields() {
  bookingForm?.querySelectorAll(".is-invalid").forEach((field) => {
    field.classList.remove("is-invalid");
    const errorSpan = document.getElementById(`error-${field.id}`);
    if (errorSpan) errorSpan.textContent = "";
  });
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById(`error-${fieldId}`);
  if (field) field.classList.toggle("is-invalid", !!message);
  if (errorSpan) errorSpan.textContent = message || "";
}

function validateField(field) {
  if (!field) return true;
  const name = field.name;
  const value = field.value.trim();
  let error = "";

  if (field.hasAttribute("required") && !value) {
    error = "This field is required.";
  } else if (name === "phone") {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 10) {
      error = "Please enter a valid 10-digit mobile number.";
    }
  } else if (name === "name" && value.length < 2) {
    error = "Please enter your full name.";
  }

  setFieldError(field.id, error);
  return !error;
}

function buildWhatsappMessage(formData) {
  const duration = getDuration();
  const rideLines = state.cart
    .map((item) => {
      const bike = getBike(item.id);
      if (!bike) return "";
      const lineTotal = bike.price * item.quantity * duration;
      return `- ${bike.name}: ${currency.format(bike.price)}/day x ${duration} day${duration > 1 ? "s" : ""} (Estimate: ${currency.format(lineTotal)})`;
    })
    .filter(Boolean);

  return [
    "Hi Rider Rental, I want to book a ride.",
    "",
    `Name: ${formData.get("name")}`,
    `Mobile: ${formData.get("phone")}`,
    `Pickup date: ${formData.get("pickupDate")}`,
    `Pickup time: ${formData.get("pickupTime")}`,
    `Give-back time: ${formData.get("returnTime")}`,
    `Duration: ${duration} day${duration > 1 ? "s" : ""}`,
    `Pickup point: ${formData.get("pickup")}`,
    "",
    "Selected rides:",
    ...rideLines,
    "",
    `Estimated total: ${currency.format(cartTripTotal())}`,
    `Route / request: ${formData.get("route") || "Please confirm route, documents, deposit and availability."}`
  ].join("\n");
}

function submitBooking(event) {
  event.preventDefault();
  if (!bookingForm) return;

  const inputs = Array.from(bookingForm.querySelectorAll("input[required], select[required]"));
  let isFormValid = true;
  let firstInvalid = null;

  for (const input of inputs) {
    if (!validateField(input)) {
      isFormValid = false;
      if (!firstInvalid) firstInvalid = input;
    }
  }

  if (!cartCount()) {
    setStatus("Please add at least one ride before sending the booking.", "error");
    openCart(event.submitter instanceof HTMLElement ? event.submitter : null);
    return;
  }

  if (!isFormValid) {
    setStatus("Please fix the errors in the form.", "error");
    firstInvalid?.focus();
    return;
  }

  const message = buildWhatsappMessage(new FormData(bookingForm));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");

  // Reset form, cart, and duration after sending
  bookingForm.reset();
  setMinimumDate();
  clearCart();
  setDurationDays(1);
  setStatus("Booking sent! Your cart and form have been cleared.", "success");
}

let revealObserver;

function observeRevealItems() {
  const items = document.querySelectorAll(".reveal:not(.is-visible)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
  }

  items.forEach((item) => revealObserver.observe(item));
}

function setupTilt() {
  if (!tiltTarget) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  tiltTarget.addEventListener("pointermove", (event) => {
    const rect = tiltTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tiltTarget.style.setProperty("--move-x", `${x * 18}px`);
    tiltTarget.style.setProperty("--move-y", `${y * 18}px`);
    tiltTarget.style.setProperty("--tilt-y", `${-14 + x * 8}deg`);
  });

  tiltTarget.addEventListener("pointerleave", () => {
    tiltTarget.style.setProperty("--move-x", "0px");
    tiltTarget.style.setProperty("--move-y", "0px");
    tiltTarget.style.setProperty("--tilt-y", "-14deg");
  });
}

function setupInstantsStack() {
  const stack = document.getElementById("instants-stack");
  if (!stack) return;

  const cards = Array.from(stack.querySelectorAll(".instant-card"));
  let activeIndex = 0;
  let intervalId = null;

  function startAutoCycle() {
    intervalId = setInterval(() => {
      cards.forEach((card) => card.classList.remove("pop-active"));
      const activeCard = cards[activeIndex];
      if (activeCard) {
        activeCard.classList.add("pop-active");
      }
      activeIndex = (activeIndex + 1) % cards.length;
    }, 1000);
  }

  function stopAutoCycle() {
    clearInterval(intervalId);
    cards.forEach((card) => card.classList.remove("pop-active"));
  }

  startAutoCycle();

  stack.addEventListener("mouseenter", stopAutoCycle);
  stack.addEventListener("mouseleave", () => {
    activeIndex = 0;
    startAutoCycle();
  });

  // Like button handling
  stack.addEventListener("click", (event) => {
    const likeBtn = event.target.closest(".like-btn");
    if (!likeBtn) return;

    event.preventDefault();
    likeBtn.classList.toggle("liked");
  });
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

menuToggle?.addEventListener("click", toggleMenu);

navLinks?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeMenu();
  }
});

filterButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  button.addEventListener("click", () => setFilter(button.dataset.filter || "all"));
});

bikesGrid?.addEventListener("click", (event) => {
  const button = event.target instanceof HTMLElement ? event.target.closest("[data-add-bike]") : null;
  if (button instanceof HTMLButtonElement && button.dataset.addBike) {
    addToCart(button.dataset.addBike);
    openCart(button);
  }
});

cartItems?.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const increase = target?.closest("[data-increase]");
  const decrease = target?.closest("[data-decrease]");
  const remove = target?.closest("[data-remove-bike]");

  if (increase instanceof HTMLElement && increase.dataset.increase) {
    setDurationDays(getDuration() + 1);
  }

  if (decrease instanceof HTMLElement && decrease.dataset.decrease) {
    setDurationDays(getDuration() - 1);
  }

  if (remove instanceof HTMLElement && remove.dataset.removeBike) {
    removeFromCart(remove.dataset.removeBike);
  }
});

openCartButtons.forEach((button) => {
  button.addEventListener("click", () => openCart(button));
});

closeCartButtons.forEach((button) => {
  button.addEventListener("click", closeCart);
});

closeCartLinks.forEach((link) => {
  link.addEventListener("click", closeCart);
});

cartDrawer?.addEventListener("click", (event) => {
  if (event.target === cartDrawer) {
    closeCart();
  }
});

clearCartButton?.addEventListener("click", clearCart);

durationInput?.addEventListener("input", renderCart);
durationInput?.addEventListener("change", () => setDurationDays(getDuration()));
bookingForm?.addEventListener("click", handleDurationClick);

// Field-wise validation listeners
bookingForm?.querySelectorAll("input, select, textarea").forEach((input) => {
  if (input.name === "phone") {
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
      validateField(input);
    });
  } else {
    input.addEventListener("input", () => validateField(input));
  }
  input.addEventListener("blur", () => validateField(input));
});

bookingForm?.addEventListener("submit", submitBooking);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeCart();
  }
});

setMinimumDate();
setFilter(state.filter);
renderCart();
observeRevealItems();
setupTilt();
setupInstantsStack();
