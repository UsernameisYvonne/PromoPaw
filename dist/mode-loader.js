(() => {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") === "data" ? "data" : "reference";
  const copy = {
    reference: {
      title: "Reference Prototype · Iteration 1",
      banner: "Illustrative catalogue and forecast scenarios for demonstrating the product experience.",
      detail: "This preserved reference uses eight demonstration products, illustrative prices, scripted recommendations and an illustrative trip-planning scenario. It exists to show the intended end-to-end experience.",
      script: "./app.js?v=maple-personality-2",
    },
    data: {
      title: "Data-backed Beta · Iteration 2",
      banner: "Uses collected observations where available. Missing, unresolved and stale data remain visible.",
      detail: "This developing iteration uses the canonical 33-product scope and a dated store-specific collection. It is not a live retailer feed, and no forecast is shown until enough validated history exists.",
      script: "./observed-app.js?v=data-beta-1",
    },
  };

  document.documentElement.dataset.mode = mode;
  document.querySelectorAll("[data-mode-option]").forEach((button) => {
    const active = button.dataset.modeOption === mode;
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", () => {
      if (active) return;
      const next = new URL(location.href);
      if (button.dataset.modeOption === "data") next.searchParams.set("mode", "data");
      else next.searchParams.delete("mode");
      next.searchParams.delete("product");
      next.searchParams.delete("view");
      location.assign(next);
    });
  });

  document.querySelector("#version-banner-title").textContent = copy[mode].title;
  document.querySelector("#version-banner-copy").textContent = copy[mode].banner;
  document.querySelector("#version-details-copy").textContent = copy[mode].detail;
  const info = document.querySelector("#version-info-button");
  const details = document.querySelector("#version-details");
  info.addEventListener("click", () => {
    const open = details.hidden;
    details.hidden = !open;
    info.setAttribute("aria-expanded", String(open));
  });

  const script = document.createElement("script");
  script.src = copy[mode].script;
  script.defer = true;
  document.body.append(script);
})();
