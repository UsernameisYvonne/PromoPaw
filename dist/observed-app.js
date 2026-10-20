(() => {
  const main = document.querySelector("main");
  const headerSearch = document.querySelector("#product-search");
  const footer = document.querySelector("footer");
  const navLinks = [...document.querySelectorAll(".nav-links a,.nav-links button")];
  const STORAGE_KEY = "promopaw-data-state-v1";
  const money = (value) => Number.isFinite(value) ? `$${value.toFixed(2)}` : "Not collected";
  const esc = (value) => String(value ?? "").replace(/[<>&'"]/g, (char) => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&#39;", '"':"&quot;"})[char]);
  const dateTime = (value) => value ? new Date(value).toLocaleString("en-AU", {dateStyle:"medium", timeStyle:"short"}) : "Not collected";
  let catalogue;
  let selectedCategory = "All";
  let query = "";
  let view = "shop";
  let state = loadState();

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {watchlist: Array.isArray(raw.watchlist) ? [...new Set(raw.watchlist.filter((value) => typeof value === "string"))] : []};
    } catch {
      return {watchlist: []};
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateCounters();
  }

  function updateCounters() {
    document.querySelectorAll('.icon-counter[data-view="watchlist"] b').forEach((node) => { node.textContent = state.watchlist.length; });
    document.querySelectorAll('.icon-counter[data-view="watchlist"]').forEach((node) => node.setAttribute("aria-label", `Data watchlist, ${state.watchlist.length} items`));
    document.querySelectorAll('.icon-counter[data-view="basket"] b').forEach((node) => { node.textContent = "0"; });
    document.querySelectorAll(".counter.coins").forEach((node) => { node.hidden = true; });
  }

  function setActive(name) {
    navLinks.forEach((node) => {
      const active = name === "shop" ? node.textContent.trim() === "Shop" : node.dataset.view === name;
      node.classList.toggle("active", active);
      if (active) node.setAttribute("aria-current", "page");
      else node.removeAttribute("aria-current");
    });
  }

  function productImage(product, className = "") {
    if (product.imageUrl) return `<img class="observed-product-image ${className}" src="${esc(product.imageUrl)}" alt="${esc(product.name)} ${esc(product.size)}"/>`;
    return `<div class="observed-image-placeholder ${className}" role="img" aria-label="Image pending verification for ${esc(product.name)}"><span aria-hidden="true">?</span><small>Image pending<br/>verification</small></div>`;
  }

  function priceRow(product, retailer) {
    const label = retailer === "coles" ? "Coles" : "Woolworths";
    const value = product[retailer];
    const best = product.cheaper?.toLowerCase() === retailer;
    return `<div class="observed-price-row ${retailer} ${best ? "best" : ""}">
      <span><i aria-hidden="true">${retailer === "coles" ? "C" : "W"}</i>${label}</span>
      <strong>${money(value)}</strong>
    </div>`;
  }

  function card(product) {
    const collected = [product.coles, product.woolworths].filter(Number.isFinite).length;
    const status = collected === 2 ? "Two retailer prices" : collected === 1 ? "One retailer price" : "No verified price";
    return `<article class="observed-product-card">
      <a href="?mode=data&product=${encodeURIComponent(product.slug)}" data-observed-product="${esc(product.slug)}">
        <div class="observed-card-image">${productImage(product)}${product.special ? '<span class="special-badge">Observed promotion</span>' : ""}</div>
        <div class="observed-card-body">
          <p class="brand">${esc(product.brand)}</p>
          <h2>${esc(product.name)}</h2>
          <p class="package-size">${esc(product.size)}</p>
          <div class="observed-prices">${priceRow(product, "coles")}${priceRow(product, "woolworths")}</div>
          <p class="observed-coverage ${collected ? "has-data" : "missing-data"}">${status} · Point Cook snapshot</p>
          <span class="view-details">Inspect evidence <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>`;
  }

  function categoryMarkup() {
    const categories = ["All", ...new Set(catalogue.products.map((product) => product.category))];
    return categories.map((category) => `<button type="button" class="${category === selectedCategory ? "active" : ""}" data-observed-category="${esc(category)}" aria-pressed="${category === selectedCategory}">${esc(category)}</button>`).join("");
  }

  function renderShop() {
    view = "shop";
    setActive("shop");
    const list = catalogue.products.filter((product) =>
      (selectedCategory === "All" || product.category === selectedCategory) &&
      `${product.brand} ${product.name} ${product.size} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    );
    main.innerHTML = `<div class="observed-shell">
      <section class="observed-hero">
        <div>
          <p class="eyebrow">Iteration 2 · collected evidence</p>
          <h1>Data-backed product catalogue</h1>
          <p>This build starts from the canonical 33-product scope and shows the September 2026 store-specific snapshot exactly as collected.</p>
        </div>
        <dl class="observed-summary">
          <div><dt>Products</dt><dd>${catalogue.sourceSnapshot.canonicalProducts}</dd></div>
          <div><dt>Valid observations</dt><dd>${catalogue.sourceSnapshot.validStoreSpecificObservations}</dd></div>
          <div><dt>Verified images</dt><dd>${catalogue.products.filter((product) => product.imageUrl).length}</dd></div>
        </dl>
      </section>
      <section class="observed-boundary" role="note">
        <strong>Dated snapshot, not a live feed</strong>
        <span>Collected 27–28 September 2026 (Melbourne time). Missing prices stay missing, and forecasts remain unavailable until validated history exists.</span>
      </section>
      <section class="observed-controls" aria-label="Filter data-backed catalogue">
        <div class="observed-categories" role="group" aria-label="Product categories">${categoryMarkup()}</div>
        <label>Search this iteration<input type="search" id="observed-search" value="${esc(query)}" placeholder="Search 33 tracked products"/></label>
      </section>
      <section aria-labelledby="observed-catalogue-title">
        <div class="observed-heading"><div><p class="eyebrow">Point Cook comparison view</p><h2 id="observed-catalogue-title">Tracked products</h2></div><p>${list.length} of ${catalogue.products.length} products</p></div>
        ${list.length ? `<div class="observed-grid">${list.map(card).join("")}</div>` : '<div class="observed-empty"><h2>No matching products</h2><p>Change the category or search term.</p></div>'}
      </section>
    </div>`;
    bindShop();
    document.title = "Data-backed catalogue | PromoPaw";
    history.replaceState({view:"shop"}, "", dataUrl());
  }

  function bindShop() {
    document.querySelectorAll("[data-observed-category]").forEach((button) => button.addEventListener("click", () => {
      selectedCategory = button.dataset.observedCategory;
      renderShop();
    }));
    const search = document.querySelector("#observed-search");
    search.addEventListener("input", () => {
      query = search.value;
      if (headerSearch.value !== query) headerSearch.value = query;
      renderShop();
      document.querySelector("#observed-search")?.focus();
    });
    document.querySelectorAll("[data-observed-product]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      openProduct(link.dataset.observedProduct, true);
    }));
  }

  function observationCard(observation) {
    return `<article class="evidence-card ${esc(observation.retailer)}">
      <header><span>${observation.retailer === "coles" ? "C" : "W"}</span><div><h3>${esc(observation.storeName)}</h3><p>${esc(observation.stockStatus.replaceAll("_", " "))}</p></div></header>
      <strong>${money(observation.price)}</strong>
      <dl>
        <div><dt>Observed</dt><dd>${esc(dateTime(observation.observedAt))}</dd></div>
        <div><dt>Promotion</dt><dd>${observation.promotion ? "Yes" : "No"}</dd></div>
        <div><dt>Quality</dt><dd>${esc(observation.qualityStatus.replaceAll("_", " "))}</dd></div>
      </dl>
      <a href="${esc(observation.sourceUrl)}" target="_blank" rel="noreferrer">Open source product page</a>
    </article>`;
  }

  function openProduct(slug, push = false) {
    const product = catalogue.products.find((candidate) => candidate.slug === slug);
    if (!product) { renderShop(); return; }
    view = "product";
    setActive("shop");
    const saved = state.watchlist.includes(product.slug);
    const comparisonCount = [product.coles, product.woolworths].filter(Number.isFinite).length;
    main.innerHTML = `<div class="observed-shell observed-detail">
      <nav class="observed-breadcrumb" aria-label="Breadcrumb"><button type="button" data-back-data>Data catalogue</button><span aria-hidden="true">›</span><span>${esc(product.category)}</span><span aria-hidden="true">›</span><strong>${esc(product.name)}</strong></nav>
      <section class="observed-detail-hero">
        <div class="observed-detail-image">${productImage(product, "large")}${product.special ? '<span class="special-badge">Observed promotion</span>' : ""}</div>
        <div class="observed-detail-copy">
          <p class="brand">${esc(product.brand)}</p>
          <h1>${esc(product.name)}</h1>
          <p class="observed-detail-size">${esc(product.size)} · ${esc(product.stability)}</p>
          <div class="observed-detail-tags"><span>${esc(product.category)}</span><span>${esc(product.imageStatus)}</span></div>
          ${product.imageSource.officialPage ? `<a class="image-source-link" href="${esc(product.imageSource.officialPage)}" target="_blank" rel="noreferrer">View recorded image source</a>` : `<p class="image-source-gap">Image identity status: ${esc(product.imageSource.status.replaceAll("_", " "))}</p>`}
          <button type="button" class="observed-watch-button ${saved ? "saved" : ""}" data-toggle-data-watch>${saved ? "Saved to Data Watchlist" : "Save to Data Watchlist"}</button>
        </div>
        <div class="observed-point-cook">
          <p class="eyebrow">Comparable area · Point Cook 3030</p>
          ${priceRow(product, "coles")}${priceRow(product, "woolworths")}
          <small>${comparisonCount === 2 ? `Observed comparison: ${esc(product.cheaper)} had the lower price.` : comparisonCount === 1 ? "Only one retailer price was verified for this snapshot." : "No verified price was collected for this product."}</small>
        </div>
      </section>
      <section class="evidence-status">
        <div><p class="eyebrow">Current decision status</p><h2>Insufficient Evidence</h2><p>A single dated collection cannot support a reliable Buy Now or Wait forecast. PromoPaw shows the observations without inventing a trend.</p></div>
        <dl><div><dt>Validated forecast</dt><dd>Not available</dd></div><div><dt>Catalogue identity</dt><dd>${esc(product.catalogueVerificationStatus.replaceAll("_", " "))}</dd></div><div><dt>Collected store records</dt><dd>${product.observations.length}</dd></div></dl>
      </section>
      <section class="evidence-section" aria-labelledby="store-observations-title">
        <div class="observed-heading"><div><p class="eyebrow">Auditable source records</p><h2 id="store-observations-title">Store observations</h2></div><p>Nothing interpolated</p></div>
        ${product.observations.length ? `<div class="evidence-grid">${product.observations.map(observationCard).join("")}</div>` : '<div class="observed-empty"><h2>No verified store price</h2><p>This remains an explicit data gap rather than being filled with the Iteration 1 demonstration price.</p></div>'}
      </section>
    </div>`;
    document.querySelector("[data-back-data]").addEventListener("click", renderShop);
    document.querySelector("[data-toggle-data-watch]").addEventListener("click", () => {
      if (state.watchlist.includes(product.slug)) state.watchlist = state.watchlist.filter((id) => id !== product.slug);
      else state.watchlist.push(product.slug);
      saveState();
      openProduct(product.slug, false);
    });
    const url = dataUrl({product:product.slug});
    if (push) history.pushState({product:product.slug}, "", url);
    else history.replaceState({product:product.slug}, "", url);
    document.title = `${product.name} | PromoPaw Data Beta`;
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function renderWatchlist(updateHistory = true) {
    view = "watchlist";
    setActive("watchlist");
    const products = state.watchlist.map((id) => catalogue.products.find((product) => product.slug === id)).filter(Boolean);
    main.innerHTML = `<div class="observed-shell"><section class="observed-page-intro"><p class="eyebrow">Iteration 2</p><h1>Data Watchlist</h1><p>Saved separately from the Reference Prototype. A saved item is not monitored automatically yet.</p></section>${products.length ? `<div class="observed-grid">${products.map(card).join("")}</div>` : '<div class="observed-empty"><h2>No saved data-backed products</h2><p>Open a product and save it to this iteration’s independent watchlist.</p><button type="button" data-back-data>Browse collected products</button></div>'}</div>`;
    document.querySelector("[data-back-data]")?.addEventListener("click", renderShop);
    document.querySelectorAll("[data-observed-product]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); openProduct(link.dataset.observedProduct, true); }));
    if (updateHistory) history.pushState({view:"watchlist"}, "", dataUrl({view:"watchlist"}));
  }

  function renderProgress(feature, updateHistory = true) {
    view = feature.toLowerCase();
    setActive(view);
    main.innerHTML = `<div class="observed-shell"><section class="observed-progress"><span>Iteration 2 · deliberately staged</span><h1>${esc(feature)} is not data-backed yet</h1><p>The reference version still demonstrates this workflow. This iteration will only enable it after the underlying prices, route inputs and calculations can be supported without illustrative substitutions.</p><div><button type="button" data-back-data>Return to collected catalogue</button><a href="${location.pathname}">Open Reference Prototype</a></div></section></div>`;
    document.querySelector("[data-back-data]").addEventListener("click", renderShop);
    if (updateHistory) history.pushState({view}, "", dataUrl({view}));
  }

  function dataUrl(extra = {}) {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("mode", "data");
    Object.entries(extra).forEach(([key, value]) => value && url.searchParams.set(key, value));
    return `${url.pathname}${url.search}`;
  }

  function bindNavigation() {
    navLinks.forEach((node) => node.addEventListener("click", (event) => {
      event.preventDefault();
      const target = node.dataset.view || "shop";
      if (target === "shop") renderShop();
      else if (target === "watchlist") renderWatchlist();
      else renderProgress(target === "basket" ? "Basket" : "Trip Planner");
    }));
    document.querySelectorAll('.icon-counter[data-view="watchlist"]').forEach((node) => node.addEventListener("click", renderWatchlist));
    document.querySelectorAll('.icon-counter[data-view="basket"]').forEach((node) => node.addEventListener("click", () => renderProgress("Basket")));
    document.querySelector(".wordmark").addEventListener("click", (event) => { event.preventDefault(); renderShop(); });
    headerSearch.addEventListener("input", () => { query = headerSearch.value; renderShop(); });
    window.addEventListener("popstate", () => route(false));
  }

  function route() {
    const params = new URLSearchParams(location.search);
    const product = params.get("product");
    const requestedView = params.get("view");
    if (product) openProduct(product, false);
    else if (requestedView === "watchlist") renderWatchlist(false);
    else if (requestedView === "basket") renderProgress("Basket", false);
    else if (requestedView === "trip") renderProgress("Trip Planner", false);
    else renderShop();
  }

  async function init() {
    document.documentElement.classList.add("observed-mode");
    document.querySelector("#mobile-cat-button").hidden = true;
    document.querySelector("#mobile-assistant").hidden = true;
    document.querySelector("#mobile-backdrop").hidden = true;
    footer.textContent = "Independent data-backed portfolio beta. Not affiliated with Coles or Woolworths. Observations are dated and are not a live retailer feed.";
    main.innerHTML = '<div class="observed-loading"><span></span><h1>Loading collected evidence…</h1></div>';
    try {
      const response = await fetch("./data/observed-catalogue.json", {cache:"no-store"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      catalogue = await response.json();
      state.watchlist = state.watchlist.filter((id) => catalogue.products.some((product) => product.slug === id));
      saveState();
      bindNavigation();
      route();
    } catch (error) {
      console.error(error);
      main.innerHTML = '<div class="observed-error"><h1>Collected catalogue unavailable</h1><p>The data file could not be loaded. The Reference Prototype is still available from the switch above.</p></div>';
    }
  }

  init();
})();
