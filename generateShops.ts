#!/usr/bin/env node
/**
 * generateShops.ts – TypeScript variant
 *
 * Generates 20 shops with a random assortment of items and prices.
 * Prices are strings and deviate no more than 20% from a common base.
 *
 * Usage:   npx ts-node generateShops.ts
 *          or: node dist/generateShops.js
 * Output:  prints the resulting JSON to stdout
 */

const MIN_SHOP_COUNT = 20;
const MIN_ITEMS_PER_SHOP = 5;
const MAX_ITEMS_PER_SHOP = 10;

/* ---------- Type Definitions ---------- */
interface BasePrices {
  [id: number]: number;
}

interface ShopItem {
  [id: number]: string;
}

interface Shops {
  [shopName: string]: ShopItem[];
}

interface Output {
  shopCount: number;
  shops: Shops;
}

/* ---------- Helpers ---------- */
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks `count` unique elements from `array`.
 */
function sampleUnique<T>(array: T[], count: number): T[] {
  const copy = [...array];
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = randInt(0, copy.length - 1);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * Returns a price string that is base ± up to 20% random deviation.
 */
function priceWithDeviation(base: number): string {
  const maxDev = Math.floor(base * 0.2);
  const dev = randInt(-maxDev, maxDev);
  const price = Math.max(1, base + dev);
  return price.toString();
}

/* ---------- 1️⃣ Build a pool of item IDs and base prices ---------- */
const ITEM_POOL_SIZE = 30;
const itemIds: number[] = [];
const basePrices: BasePrices = {};

while (itemIds.length < ITEM_POOL_SIZE) {
  const id = randInt(100, 999);
  if (!itemIds.includes(id)) {
    itemIds.push(id);
    basePrices[id] = randInt(10, 500);
  }
}

/* ---------- 2️⃣ Generate the shops ---------- */
const shops: Shops = {};

for (let i = 0; i < MIN_SHOP_COUNT; i++) {
  const shopName = `shop_${String.fromCharCode('a'.charCodeAt(0) + i)}`;

  const itemCount = randInt(MIN_ITEMS_PER_SHOP, MAX_ITEMS_PER_SHOP);
  const chosenIds = sampleUnique(itemIds, itemCount);

  const items: ShopItem[] = chosenIds.map((id) => ({
    [id]: priceWithDeviation(basePrices[id]),
  }));

  shops[shopName] = items;
}

/* ---------- 3️⃣ Output ---------- */
const output: Output = {
  shopCount: MIN_SHOP_COUNT,
  shops,
};

console.log(JSON.stringify(output, null, 2));
