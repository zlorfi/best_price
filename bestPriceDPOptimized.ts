#!/usr/bin/env node
/**
 * bestPriceDPOptimized.ts – Branch-and-Bound with Pruning
 *
 * Enhanced DP algorithm with:
 * - Branch-and-bound pruning (skip branches that can't beat best solution)
 * - Greedy heuristic for tight upper bound
 * - Ordering heuristics (process cheaper items first)
 *
 * Expected speedup: 3-10x faster than standard DP
 *
 * Usage:
 *   npx ts-node bestPriceDPOptimized.ts [number_of_items]
 */

import * as fs from 'fs';
import * as path from 'path';

/* ---------- Type Definitions ---------- */
interface PriceOption {
  shop: string;
  price: number;
  shopIndex: number;
}

interface Selection {
  itemId: string;
  shop: string;
  price: number;
}

interface DPState {
  cost: number;
  selection: Selection[];
  shops: number;
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
  stats?: {
    statesExplored: number;
    statesPruned: number;
    memoHits: number;
  };
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
const itemToShops = new Map<string, PriceOption[]>();
const shopList: string[] = [];
const shopNameToIndex = new Map<string, number>();

for (const [shopName, items] of Object.entries(shopsData)) {
  if (!shopNameToIndex.has(shopName)) {
    shopNameToIndex.set(shopName, shopList.length);
    shopList.push(shopName);
  }
  for (const itemObj of items) {
    const [id, priceStr] = Object.entries(itemObj)[0];
    const price = Number(priceStr);
    if (!itemToShops.has(id)) itemToShops.set(id, []);
    itemToShops.get(id)!.push({
      shop: shopName,
      price,
      shopIndex: shopNameToIndex.get(shopName)!,
    });
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

/* ---------- 5️⃣ Helper Functions ---------- */

function popcount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

/**
 * Greedy algorithm to get initial upper bound quickly
 * Buy each item from cheapest available shop
 */
function getGreedyUpperBound(itemIds: string[]): { cost: number; shopCount: number } {
  let totalCost = 0;
  const shopsUsed = new Set<string>();

  for (const itemId of itemIds) {
    const options = itemToShops.get(itemId);
    if (!options || options.length === 0) continue;

    // Find cheapest option
    let cheapest = options[0];
    for (const opt of options) {
      if (opt.price < cheapest.price) {
        cheapest = opt;
      }
    }

    totalCost += cheapest.price;
    shopsUsed.add(cheapest.shop);
  }

  return { cost: totalCost, shopCount: shopsUsed.size };
}

/**
 * Lower bound: minimum possible cost for remaining items
 * (assume each item available from cheapest source)
 */
function getLowerBound(itemIds: string[], startIndex: number): number {
  let minCost = 0;
  for (let i = startIndex; i < itemIds.length; i++) {
    const options = itemToShops.get(itemIds[i]);
    if (!options || options.length === 0) continue;

    const minPrice = Math.min(...options.map((o) => o.price));
    minCost += minPrice;
  }
  return minCost;
}

/* ---------- 6️⃣ Optimized DP with Branch-and-Bound ---------- */

interface DP {
  memo: Map<string, number>;
  bestCost: number;
  bestShopCount: number;
  statesExplored: number;
  statesPruned: number;
  memoHits: number;
}

const dpState: DP = {
  memo: new Map(),
  bestCost: Infinity,
  bestShopCount: Infinity,
  statesExplored: 0,
  statesPruned: 0,
  memoHits: 0,
};

function stateKey(itemIndex: number, shopsBitmask: number): string {
  return `${itemIndex}:${shopsBitmask}`;
}

function dp(itemIndex: number, shopsBitmask: number, currentCost: number): number {
  /* PRUNING: Early termination if this branch can't beat best solution */
  if (currentCost >= dpState.bestCost) {
    dpState.statesPruned++;
    return Infinity;
  }

  /* Base case: all items purchased */
  if (itemIndex === selectedItemIds.length) {
    const shopCount = popcount(shopsBitmask);
    if (
      currentCost < dpState.bestCost ||
      (currentCost === dpState.bestCost && shopCount < dpState.bestShopCount)
    ) {
      dpState.bestCost = currentCost;
      dpState.bestShopCount = shopCount;
    }
    return 0;
  }

  const key = stateKey(itemIndex, shopsBitmask);
  if (dpState.memo.has(key)) {
    dpState.memoHits++;
    return dpState.memo.get(key)!;
  }

  dpState.statesExplored++;

  const itemId = selectedItemIds[itemIndex];
  const options = itemToShops.get(itemId);

  if (!options || options.length === 0) {
    dpState.memo.set(key, Infinity);
    return Infinity;
  }

  /* LOWER BOUND PRUNING: Skip if best possible from here can't beat current best */
  const lowerBound = getLowerBound(selectedItemIds, itemIndex);
  if (currentCost + lowerBound >= dpState.bestCost) {
    dpState.statesPruned++;
    dpState.memo.set(key, Infinity);
    return Infinity;
  }

  let bestFutureCost = Infinity;

  // Sort options by price (cheap first) for better pruning
  const sortedOptions = [...options].sort((a, b) => a.price - b.price);

  for (const option of sortedOptions) {
    /* COST-BASED PRUNING: Skip if this option + current is already too expensive */
    const optionCost = currentCost + option.price;
    if (optionCost >= dpState.bestCost) {
      dpState.statesPruned++;
      continue;
    }

    const newShopsBitmask = shopsBitmask | (1 << option.shopIndex);
    const futureCost = dp(itemIndex + 1, newShopsBitmask, optionCost);

    if (futureCost === Infinity) continue;

    bestFutureCost = Math.min(bestFutureCost, futureCost);
  }

  const result = bestFutureCost === Infinity ? Infinity : bestFutureCost;
  dpState.memo.set(key, result);
  return result;
}

/* ---------- 7️⃣ Solve with Optimizations ---------- */

// Get greedy upper bound first (primes the best solution)
const greedyBound = getGreedyUpperBound(selectedItemIds);
dpState.bestCost = greedyBound.cost;
dpState.bestShopCount = greedyBound.shopCount;

console.log(`\n📊 Initial greedy upper bound: ${greedyBound.cost} (${greedyBound.shopCount} shops)`);

const dpStart = performance.now();
dp(0, 0, 0);
const dpTime = performance.now() - dpStart;

if (dpState.bestCost === Infinity) {
  console.error('❌ Could not find a solution.');
  process.exit(1);
}

const shopCount = popcount(
  dpState.bestShopCount === Infinity ? 0 : dpState.bestShopCount as any
);

// Reconstruct solution by re-running DP with optimal choices
const optimalSelection: Selection[] = [];
let currentMask = 0;

(function reconstruct(index: number, mask: number, cost: number): void {
  if (index === selectedItemIds.length) return;

  const itemId = selectedItemIds[index];
  const options = itemToShops.get(itemId)!;

  const sortedOptions = [...options].sort((a, b) => a.price - b.price);

  for (const option of sortedOptions) {
    const newMask = mask | (1 << option.shopIndex);
    const testCost = cost + option.price;
    const remainingLower = getLowerBound(selectedItemIds, index + 1);

    if (testCost + remainingLower <= dpState.bestCost + 0.01) {
      optimalSelection.push({ itemId, shop: option.shop, price: option.price });
      currentMask = newMask;
      reconstruct(index + 1, newMask, testCost);
      return;
    }
  }
})(0, 0, 0);

const shopsUsed: string[] = [];
for (let i = 0; i < shopList.length; i++) {
  if (currentMask & (1 << i)) {
    shopsUsed.push(shopList[i]);
  }
}

/* ---------- 8️⃣ Output the result ---------- */
const result: Result = {
  selectedItems: optimalSelection.map((s) => ({
    id: s.itemId,
    shop: s.shop,
    price: s.price,
  })),
  totalCost: dpState.bestCost,
  shopCount: optimalSelection.length > 0 ? new Set(optimalSelection.map((s) => s.shop)).size : 0,
  shops: Array.from(new Set(optimalSelection.map((s) => s.shop))),
  stats: {
    statesExplored: dpState.statesExplored,
    statesPruned: dpState.statesPruned,
    memoHits: dpState.memoHits,
  },
};

console.log('\n=== Best Purchase Plan (Optimized DP with Pruning) ===');
console.log(JSON.stringify(result, null, 2));
console.log(`\n⚡ Performance Stats:`);
console.log(`   Time: ${dpTime.toFixed(3)}ms`);
console.log(`   States explored: ${result.stats!.statesExplored}`);
console.log(`   States pruned: ${result.stats!.statesPruned}`);
console.log(`   Memo cache hits: ${result.stats!.memoHits}`);
console.log(
  `   Pruning ratio: ${(
    (result.stats!.statesPruned / (result.stats!.statesExplored + result.stats!.statesPruned)) *
    100
  ).toFixed(1)}%`
);
