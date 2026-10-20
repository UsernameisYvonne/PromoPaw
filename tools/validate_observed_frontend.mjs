import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalogue = JSON.parse(await fs.readFile(path.join(root, "dist/data/observed-catalogue.json"), "utf8"));
const html = await fs.readFile(path.join(root, "dist/index.html"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(catalogue.schemaVersion === 1, "Unexpected observed catalogue schema version");
check(catalogue.products.length === 33, `Expected 33 products, found ${catalogue.products.length}`);
check(catalogue.sourceSnapshot.validStoreSpecificObservations === 82, "Expected 82 valid store-specific observations");
check(catalogue.products.flatMap((product) => product.observations).length === 82, "Product observation total does not reconcile to 82");
check(catalogue.products.filter((product) => product.imageUrl).length === 31, "Expected 31 verified product images");
check(catalogue.products.filter((product) => !product.imageUrl).length === 2, "Expected exactly two unresolved product images");
check(catalogue.products.filter((product) => product.imageUrl).every((product) => product.imageSource?.officialPage), "A verified image is missing its recorded official source page");
check(new Set(catalogue.products.map((product) => product.slug)).size === 33, "Product IDs are not unique");
check(catalogue.products.every((product) => product.rec === "Insufficient Evidence"), "A data-backed product has an unsupported forecast recommendation");
check(catalogue.products.every((product) => [product.coles, product.woolworths].every((value) => value === null || (Number.isFinite(value) && value > 0))), "Invalid observed price value");
check(html.includes('data-mode-option="reference"') && html.includes('data-mode-option="data"'), "Iteration switch is missing from index.html");
check(html.includes("mode-loader.js"), "Mode loader is missing from index.html");

for (const product of catalogue.products.filter((item) => item.imageUrl)) {
  const imagePath = path.join(root, "dist", product.imageUrl.replace(/^\.\//, ""));
  try {
    const image = await fs.readFile(imagePath);
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    const colourType = image[25];
    if (width !== 640 || height !== 640) failures.push(`Unexpected web image dimensions for ${product.slug}: ${width}x${height}`);
    if (![4, 6].includes(colourType)) failures.push(`Web image does not preserve PNG alpha for ${product.slug}`);
  } catch {
    failures.push(`Missing or unreadable image asset for ${product.slug}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Observed frontend validation passed: 33 products, 82 observations, 31 verified images, 2 explicit image gaps.");
