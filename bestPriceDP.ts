#!/usr/bin/env node
/**
 * bestPriceDP.ts – TypeScript variant of the Dynamic Programming Solution
 *
 * Solves the optimal purchase plan problem using Dynamic Programming.
 * Scales efficiently to 20+ items.
 *
 * Algorithm: DP with memoization on (item_index, shops_used_bitmask)
 * Time Complexity: O(n × 2^m) where n=items, m=shops (practical for reasonable inputs)
 * Space Complexity: O(n × 2^m)
 *
 * Usage:
 *   npx ts-node bestPriceDP.ts [number_of_items]
 *   or compile then: node dist/bestPriceDP.js [number_of_items]
 *
 * If no argument is supplied, the script defaults to 5 items.
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

/* ---------- 5️⃣ Dynamic Programming Solution ---------- */

/**
 * State: (itemIndex, shopsBitmask)
 * Returns: {cost, selection, shops}
 *   - cost: total cost for purchasing items[0...itemIndex-1]
 *   - selection: array of {itemId, shop, price}
 *   - shops: bitmask of shops used
 */
const memo = new Map<string, DPState>();

function stateKey(itemIndex: number, shopsBitmask: number): string {
  return `${itemIndex}:${shopsBitmask}`;
}

function dp(itemIndex: number, shopsBitmask: number): DPState {
  // Base case: all items purchased
  if (itemIndex === selectedItemIds.length) {
    return { cost: 0, selection: [], shops: shopsBitmask };
  }

  const key = stateKey(itemIndex, shopsBitmask);
  if (memo.has(key)) {
    return memo.get(key)!;
  }

  const itemId = selectedItemIds[itemIndex];
  const options = itemToShops.get(itemId);

  if (!options || options.length === 0) {
    const result = { cost: Infinity, selection: [], shops: shopsBitmask };
    memo.set(key, result);
    return result;
  }

  let bestOption: {
    itemId: string;
    shop: string;
    price: number;
    futureState: DPState;
    newShopsBitmask: number;
  } | null = null;
  let bestCost = Infinity;
  let bestShopCount = Infinity;

  // Try each shop where this item is available
  for (const option of options) {
    const newShopsBitmask = shopsBitmask | (1 << option.shopIndex);
    const futureState = dp(itemIndex + 1, newShopsBitmask);

    if (futureState.cost === Infinity) continue;

    const totalCost = option.price + futureState.cost;
    const shopCount = popcount(newShopsBitmask);

    if (
      totalCost < bestCost ||
      (totalCost === bestCost && shopCount < bestShopCount)
    ) {
      bestCost = totalCost;
      bestShopCount = shopCount;
      bestOption = {
        itemId,
        shop: option.shop,
        price: option.price,
        futureState,
        newShopsBitmask,
      };
    }
  }

  if (!bestOption) {
    const result = { cost: Infinity, selection: [], shops: shopsBitmask };
    memo.set(key, result);
    return result;
  }

  const result: DPState = {
    cost: bestCost,
    selection: [
      {
        itemId: bestOption.itemId,
        shop: bestOption.shop,
        price: bestOption.price,
      },
      ...bestOption.futureState.selection,
    ],
    shops: bestOption.newShopsBitmask,
  };

  memo.set(key, result);
  return result;
}

// Helper function to count set bits (popcount)
function popcount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

const dpResult = dp(0, 0);

if (dpResult.cost === Infinity) {
  console.error('❌ Could not find a solution.');
  process.exit(1);
}

const shopCount = popcount(dpResult.shops);
const shopsUsed: string[] = [];
for (let i = 0; i < shopList.length; i++) {
  if (dpResult.shops & (1 << i)) {
    shopsUsed.push(shopList[i]);
  }
}

/* ---------- 6️⃣ Output the result ---------- */
const result: Result = {
  selectedItems: dpResult.selection.map((s) => ({
    id: s.itemId,
    shop: s.shop,
    price: s.price,
  })),
  totalCost: dpResult.cost,
  shopCount: shopCount,
  shops: shopsUsed,
};

console.log('\n=== Best Purchase Plan (DP Solution) ===');
console.log(JSON.stringify(result, null, 2));
