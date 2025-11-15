#!/usr/bin/env node
/**
 * bestPrice.ts – TypeScript variant of the brute-force solution
 *
 * Usage:
 *   npx ts-node bestPrice.ts [number_of_items]
 *   or compile then: node dist/bestPrice.js [number_of_items]
 *
 * If no argument is supplied, the script defaults to 5 items.
 *
 * The algorithm is a brute-force enumeration (≈ 4ⁿ possibilities in the
 * worst case) – perfectly fine for n ≤ 10.
 */

import * as fs from 'fs';
import * as path from 'path';

/* ---------- Type Definitions ---------- */
interface PriceOption {
  shop: string;
  price: number;
}

interface Selection {
  itemId: string;
  shop: string;
  price: number;
}

interface Result {
  selectedItems: Array<{
    id: string;
    shop: string;
    price: number;
  }>;
  totalCost: number;
  shopCount: number;
  shops: string[];
}

interface ShopsData {
  shopCount: number;
  shops: {
    [shopName: string]: Array<{
      [itemId: string]: string;
    }>;
  };
}

/* ---------- 1️⃣ Load and parse shops.json ---------- */
const jsonPath = path.resolve(__dirname, 'shops.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data: ShopsData = JSON.parse(raw);
const shopsData = data.shops;

/* ---------- 2️⃣ Build helper maps ---------- */
// Map: itemId -> array of {shop, price}
const itemToShops = new Map<string, PriceOption[]>();
for (const [shopName, items] of Object.entries(shopsData)) {
  for (const itemObj of items) {
    const [id, priceStr] = Object.entries(itemObj)[0];
    const price = Number(priceStr);
    if (!itemToShops.has(id)) itemToShops.set(id, []);
    itemToShops.get(id)!.push({ shop: shopName, price });
  }
}
const allItemIds = Array.from(itemToShops.keys());

/* ---------- 3️⃣ Read desired number of items ---------- */
const arg = process.argv[2];
let itemCount = 5;
if (arg !== undefined) {
  const parsed = Number(arg);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.error(`❌ Invalid item count: "${arg}". Must be a positive integer.`);
    process.exit(1);
  }
  itemCount = parsed;
}
if (itemCount > allItemIds.length) {
  console.error(
    `❌ Requested ${itemCount} items but only ${allItemIds.length} distinct items exist.`
  );
  process.exit(1);
}

/* ---------- 4️⃣ Pick random distinct item IDs ---------- */
function pickRandomItems(n: number, sourceArray: string[]): string[] {
  const result: string[] = [];
  const used = new Set<string>();
  while (result.length < n && used.size < sourceArray.length) {
    const idx = Math.floor(Math.random() * sourceArray.length);
    const id = sourceArray[idx];
    if (!used.has(id)) {
      used.add(id);
      result.push(id);
    }
  }
  return result;
}
const selectedItemIds = pickRandomItems(itemCount, allItemIds);
console.log('Selected items (random):', selectedItemIds);

/* ---------- 5️⃣ Enumerate all purchase combinations ---------- */
let bestCost = Infinity;
let bestShopCount = Infinity;
let bestSelection: Selection[] = [];

function backtrack(
  index: number,
  currentSelection: Selection[],
  currentCost: number,
  shopsUsedSet: Set<string>
): void {
  if (index === selectedItemIds.length) {
    const shopCount = shopsUsedSet.size;
    if (
      currentCost < bestCost ||
      (currentCost === bestCost && shopCount < bestShopCount)
    ) {
      bestCost = currentCost;
      bestShopCount = shopCount;
      bestSelection = [...currentSelection];
    }
    return;
  }

  const itemId = selectedItemIds[index];
  const options = itemToShops.get(itemId);
  if (!options) return;

  for (const opt of options) {
    currentSelection.push({ itemId, shop: opt.shop, price: opt.price });
    shopsUsedSet.add(opt.shop);
    backtrack(index + 1, currentSelection, currentCost + opt.price, shopsUsedSet);
    // backtrack
    currentSelection.pop();
    shopsUsedSet.delete(opt.shop);
  }
}
backtrack(0, [], 0, new Set());

if (bestSelection.length === 0) {
  console.error('Could not find a solution (unexpected).');
  process.exit(1);
}

/* ---------- 6️⃣ Output the result ---------- */
const shopsSet = new Set<string>();
for (const s of bestSelection) {
  shopsSet.add(s.shop);
}

const result: Result = {
  selectedItems: bestSelection.map((s) => ({
    id: s.itemId,
    shop: s.shop,
    price: s.price,
  })),
  totalCost: bestCost,
  shopCount: bestShopCount,
  shops: Array.from(shopsSet),
};

console.log('\n=== Best Purchase Plan ===');
console.log(JSON.stringify(result, null, 2));

