import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const productsPath = path.join(root, "pricepaw_master_build/output/product_data/csv/products.csv");
const observationsPath = path.join(root, "artifacts/pricepaw_2026-09-27_update/price_observations.csv");
const imagesPath = path.join(root, "product-image-library/tracked-products");
const imageSourcesPath = path.join(root, "product-image-library/product_sources.json");
const outputPath = path.join(root, "dist/data/observed-catalogue.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...values] = rows.filter((candidate) => candidate.some(Boolean));
  return values.map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ""])));
}

const titleCase = (value) => value
  .split("_")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

function productSize(product) {
  const value = Number(product.size_value);
  const numeric = Number.isInteger(value) ? String(value) : String(value);
  const unit = product.size_unit === "each" ? "pack" : product.size_unit;
  if (Number(product.pack_count) > 1 && product.subcategory === "eggs") return `${product.pack_count} pack · ${numeric}${unit}`;
  if (Number(product.pack_count) > 1) return `${product.pack_count} pack`;
  return `${numeric}${unit}`;
}

function stability(value) {
  if (value === "shelf_stable") return "Shelf-stable";
  if (value === "frozen") return "Frozen";
  if (value === "fresh_short") return "Fresh";
  return "Chilled";
}

const productRows = parseCsv(await fs.readFile(productsPath, "utf8"));
const observationRows = parseCsv(await fs.readFile(observationsPath, "utf8"));
const imageSourceRows = JSON.parse(await fs.readFile(imageSourcesPath, "utf8"));
const imageSourcesByProduct = new Map(imageSourceRows.map((source) => [source.product_id, source]));
const imageFiles = (await fs.readdir(imagesPath)).filter((name) => name.endsWith(".png")).sort();
const imagesByNumber = new Map(imageFiles.map((name) => [Number(name.slice(0, 2)), name]));
const comparisonStores = {
  coles: "store_coles_point_cook_stockland",
  woolworths: "store_woolworths_point_cook_stockland",
};
const storeNames = {
  store_coles_point_cook_stockland: "Coles Point Cook Stockland",
  store_woolworths_point_cook_stockland: "Woolworths Point Cook Town Centre",
  store_woolworths_clayton_mcity: "Woolworths Clayton M-City",
};

const observationsByProduct = new Map();
for (const observation of observationRows) {
  if (!observationsByProduct.has(observation.product_id)) observationsByProduct.set(observation.product_id, []);
  observationsByProduct.get(observation.product_id).push({
    retailer: observation.retailer_id,
    storeId: observation.store_id,
    storeName: storeNames[observation.store_id] ?? observation.store_id,
    areaId: observation.area_id,
    observedAt: observation.observed_at,
    price: Number(observation.current_price_aud),
    wasPrice: observation.was_price_aud ? Number(observation.was_price_aud) : null,
    promotion: observation.promotion_flag === "1",
    promotionText: observation.promotion_text || null,
    unitPrice: observation.unit_price_value ? Number(observation.unit_price_value) : null,
    unit: observation.unit_price_unit || null,
    stockStatus: observation.stock_status,
    qualityStatus: observation.quality_status,
    sourceUrl: observation.source_url,
  });
}

const products = productRows.map((product, index) => {
  const observations = observationsByProduct.get(product.product_id) ?? [];
  const colesObservation = observations.find((item) => item.storeId === comparisonStores.coles) ?? null;
  const woolworthsObservation = observations.find((item) => item.storeId === comparisonStores.woolworths) ?? null;
  const available = [colesObservation, woolworthsObservation].filter(Boolean);
  const cheaperObservation = available.sort((a, b) => a.price - b.price)[0] ?? null;
  const imageFilename = imagesByNumber.get(index + 1) ?? null;
  const imageSource = imageSourcesByProduct.get(product.product_id) ?? null;
  const category = product.category === "produce" ? "Fresh" : product.category === "chilled" ? "Dairy" : titleCase(product.category);
  return {
    slug: product.product_id,
    name: product.canonical_name,
    size: productSize(product),
    brand: product.brand || (product.category === "produce" ? "Fresh produce" : "Product family"),
    category,
    extraCategories: product.cake_required === "true" ? ["Cake plan"] : [],
    stability: stability(product.perishability_class),
    coles: colesObservation?.price ?? null,
    woolworths: woolworthsObservation?.price ?? null,
    typicalColes: null,
    typicalWoolworths: null,
    cheaper: cheaperObservation ? titleCase(cheaperObservation.retailer) : null,
    special: available.some((item) => item.promotion),
    imageUrl: imageFilename ? `./assets/products/${imageFilename}` : null,
    imageStatus: imageFilename ? "Verified product image" : "Image pending verification",
    imageSource: {
      status: imageSource?.status ?? "not_recorded",
      officialPage: imageSource?.official_page || null,
      note: imageSource?.note || null,
    },
    unit: cheaperObservation?.unit ?? null,
    rec: "Insufficient Evidence",
    outlook7: ["Unavailable", null, "No validated forecast is available for this collected-data snapshot.", "No forecast"],
    outlook14: ["Unavailable", null, "No validated forecast is available for this collected-data snapshot.", "No forecast"],
    comparisonArea: "Point Cook 3030",
    comparisonStores: {
      coles: storeNames[comparisonStores.coles],
      woolworths: storeNames[comparisonStores.woolworths],
    },
    observations,
    catalogueVerificationStatus: product.catalogue_verification_status,
  };
});

const output = {
  schemaVersion: 1,
  mode: "data",
  label: "Data-backed Beta",
  sourceSnapshot: {
    collectionStartedOn: "2026-09-27",
    collectionCompletedOn: "2026-09-28",
    timezone: "Australia/Melbourne",
    canonicalProducts: products.length,
    validStoreSpecificObservations: observationRows.length,
    comparisonArea: "Point Cook 3030",
    note: "This is a dated, collected snapshot. It is not a live retailer feed.",
  },
  products,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${products.length} products and ${observationRows.length} observations to ${outputPath}`);
