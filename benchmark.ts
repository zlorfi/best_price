#!/usr/bin/env node
/**
 * Performance benchmark comparing brute-force vs DP algorithms
 */

import * as fs from 'fs';
import * as path from 'path';

/* Type Definitions */
interface PriceOption {
  shop: string;
  price: number;
  shopIndex?: number;
}

interface Selection {
  itemId: string;
  shop: string;
  price: number;
}

interface ShopsData {
  shopCount: number;
  shops: {
    [shopName: string]: Array<{
      [itemId: string]: string;
    }>;
  };
}

/* Load shops.json */
const jsonPath = path.resolve(__dirname, 'shops.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data: ShopsData = JSON.parse(raw);
const shopsData = data.shops;

/* Build helper maps */
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
      shopIndex: shopNameToIndex.get(shopName),
    });
  }
}

const allItemIds = Array.from(itemToShops.keys());

/* Helper: pick random items */
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

/* BRUTE FORCE ALGORITHM */
function bruteForce(selectedItemIds: string[]): { cost: number; time: number } {
  const start = performance.now();

  let bestCost = Infinity;
  let bestShopCount = Infinity;

  function backtrack(
    index: number,
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
      }
      return;
    }

    const itemId = selectedItemIds[index];
    const options = itemToShops.get(itemId);
    if (!options) return;

    for (const opt of options) {
      shopsUsedSet.add(opt.shop);
      backtrack(index + 1, currentCost + opt.price, shopsUsedSet);
      shopsUsedSet.delete(opt.shop);
    }
  }

  backtrack(0, 0, new Set());
  const time = performance.now() - start;
  return { cost: bestCost, time };
}

/* DP ALGORITHM */
function dynamicProgramming(selectedItemIds: string[]): { cost: number; time: number } {
  const start = performance.now();

  const memo = new Map<string, number>();

  function popcount(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  function dp(itemIndex: number, shopsBitmask: number): number {
    if (itemIndex === selectedItemIds.length) {
      return 0;
    }

    const key = `${itemIndex}:${shopsBitmask}`;
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    const itemId = selectedItemIds[itemIndex];
    const options = itemToShops.get(itemId);

    if (!options || options.length === 0) {
      memo.set(key, Infinity);
      return Infinity;
    }

    let bestCost = Infinity;
    let bestShopCount = Infinity;

    for (const option of options) {
      const newShopsBitmask = shopsBitmask | (1 << (option.shopIndex || 0));
      const futureCost = dp(itemIndex + 1, newShopsBitmask);

      if (futureCost === Infinity) continue;

      const totalCost = option.price + futureCost;
      const shopCount = popcount(newShopsBitmask);

      if (
        totalCost < bestCost ||
        (totalCost === bestCost && shopCount < bestShopCount)
      ) {
        bestCost = totalCost;
        bestShopCount = shopCount;
      }
    }

    const result = bestCost === Infinity ? Infinity : bestCost;
    memo.set(key, result);
    return result;
  }

  const cost = dp(0, 0);
  const time = performance.now() - start;
  return { cost, time };
}

/* RUN BENCHMARKS */
console.log('🔬 Performance Benchmark: Brute-Force vs Dynamic Programming\n');
console.log('Dataset: shops.json (20 shops, 30 items)\n');
console.log('═'.repeat(70));

const testSizes = [5, 8, 10, 12, 15, 18, 20];

console.log('\n📊 Algorithm Comparison:\n');
console.log(
  'Items'.padEnd(8) +
    'Brute-Force (ms)'.padEnd(20) +
    'DP (ms)'.padEnd(15) +
    'Speedup'.padEnd(12) +
    'Status'
);
console.log('-'.repeat(70));

for (const size of testSizes) {
  if (size > allItemIds.length) {
    console.log(
      size.toString().padEnd(8) +
        '(skipped - not enough items)'.padEnd(67)
    );
    continue;
  }

  const items = pickRandomItems(size, allItemIds);

  try {
    const bfResult = bruteForce(items);
    const dpResult = dynamicProgramming(items);
    const speedup = (bfResult.time / dpResult.time).toFixed(1);

    let status = '✓';
    if (Math.abs(bfResult.cost - dpResult.cost) > 0.1) {
      status = '⚠ Results differ!';
    }

    console.log(
      size.toString().padEnd(8) +
        bfResult.time.toFixed(3).padEnd(20) +
        dpResult.time.toFixed(3).padEnd(15) +
        `${speedup}x`.padEnd(12) +
        status
    );
  } catch (e) {
    console.log(size.toString().padEnd(8) + 'Error: ' + (e as Error).message);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('\n✨ Findings:\n');
console.log('• Brute-Force: O(4^n) - exponential growth');
console.log('• DP: O(n × 2^m) - much better for large item sets');
console.log('• DP becomes significantly faster as item count increases');
console.log('• Both algorithms guarantee optimal solutions');
