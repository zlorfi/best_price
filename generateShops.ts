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

const MIN_SHOP_COUNT = 26;
const MIN_ITEMS_PER_SHOP = 50;
const MAX_ITEMS_PER_SHOP = 150;

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
 * Fisher-Yates shuffle: O(n) time, O(1) extra space (in-place)
 * Picks `count` unique elements from `array` without replacement.
 */
function sampleUnique<T>(array: T[], count: number): T[] {
  const copy = [...array];
  const result: T[] = [];

  for (let i = 0; i < count && i < copy.length; i++) {
    // Swap element at position i with random element from i to end
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
    result.push(copy[i]);
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
const ITEM_POOL_SIZE = 1300;
const itemIds: number[] = [];
const basePrices: BasePrices = {};
const usedIds = new Set<number>();

// Generate sequential IDs to ensure we have enough unique IDs
// Start from 100 and go high enough to support ITEM_POOL_SIZE (need range of at least 1300)
// Using range 100-2000 gives us 1901 possible IDs (more than enough for 1300)
const ID_RANGE_START = 100;
const ID_RANGE_END = ID_RANGE_START + ITEM_POOL_SIZE + 100; // Buffer for safety

for (let i = 0; i < ITEM_POOL_SIZE; i++) {
  let id = randInt(ID_RANGE_START, ID_RANGE_END);

  // Simple retry loop (very fast since we have plenty of ID space)
  let attempts = 0;
  while (usedIds.has(id) && attempts < 10) {
    id = randInt(ID_RANGE_START, ID_RANGE_END);
    attempts++;
  }

  // If we've tried 10 times, just find the next available
  if (usedIds.has(id)) {
    for (let candidate = ID_RANGE_START; candidate <= ID_RANGE_END; candidate++) {
      if (!usedIds.has(candidate)) {
        id = candidate;
        break;
      }
    }
  }

  usedIds.add(id);
  itemIds.push(id);
  basePrices[id] = randInt(10, 500);
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
