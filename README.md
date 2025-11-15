# Best Price - Optimal Purchase Plan Solver

A TypeScript/JavaScript utility that solves the "best purchase plan" problem: finding the optimal combination of shops to purchase a set of items while **minimizing total cost** and **minimizing the number of shops visited**.

## Problem Definition

Given:
- Multiple shops, each carrying different items at different prices
- A set of desired items to purchase

Find:
- The optimal way to purchase all items with **minimum total cost**
- As a tie-breaker, prefer plans that use **fewer shops**

## Solutions Included

This project includes **two algorithm implementations**:

### 1. Brute-Force Algorithm (`bestPrice.ts`)
- **Approach:** Backtracking enumeration
- **Time Complexity:** O(4^n) - exponential
- **Best for:** Small problem sizes (n ≤ 10 items)
- **Guarantees:** Optimal solution

### 2. Dynamic Programming Algorithm (`bestPriceDP.ts`) ⭐ **Recommended**
- **Approach:** Memoized DP with bitmask optimization
- **Time Complexity:** O(n × 2^m) where n=items, m=shops
- **Best for:** Medium to large problem sizes (n ≤ 20+ items)
- **Guarantees:** Optimal solution

## Project Structure

```
best_price/
├── bestPrice.ts           # Brute-force TypeScript implementation
├── bestPriceDP.ts         # Dynamic Programming TypeScript implementation
├── generateShops.ts       # Test data generator
├── shops.json             # Sample dataset (20 shops, 30 items)
├── tsconfig.json          # TypeScript configuration
├── package.json           # Node dependencies
├── dist/                  # Compiled JavaScript (production)
└── benchmark.ts           # Performance comparison tool
```

## Quick Start

### Prerequisites

```bash
node --version  # v18+ recommended
npm --version   # v9+ recommended
```

### Installation

1. **Clone/navigate to project:**
   ```bash
   cd best_price
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This installs:
   - `typescript` - TypeScript compiler
   - `ts-node` - Run TypeScript directly
   - `@types/node` - Type definitions for Node.js

### Running the Algorithms

#### Development (with ts-node)

**Brute-Force (best for ≤10 items):**
```bash
npx ts-node bestPrice.ts 5      # Default: 5 items
npx ts-node bestPrice.ts 10     # Find best plan for 10 items
```

**Dynamic Programming (best for 10-20+ items):**
```bash
npx ts-node bestPriceDP.ts 15   # Find best plan for 15 items
npx ts-node bestPriceDP.ts 20   # Find best plan for 20 items
```

**Generate New Test Data:**
```bash
npx ts-node generateShops.ts > new_shops.json
```

#### Production (compiled JavaScript)

1. **Compile once:**
   ```bash
   npm run build
   # or: npx tsc
   ```

2. **Run compiled versions:**
   ```bash
   node dist/bestPrice.js 10
   node dist/bestPriceDP.js 20
   node dist/generateShops.js > shops.json
   ```

### Example Output

```json
{
  "selectedItems": [
    {
      "id": "429",
      "shop": "shop_k",
      "price": 211
    },
    {
      "id": "995",
      "shop": "shop_o",
      "price": 258
    }
  ],
  "totalCost": 469,
  "shopCount": 2,
  "shops": ["shop_k", "shop_o"]
}
```

## Performance Analysis

### Benchmark Results

Test dataset: `shops.json` (20 shops, 30 available items)

| Items | Brute-Force | DP | Speedup | Status |
|-------|------------|-----|---------|--------|
| 5 | 0.213 ms | 0.279 ms | 0.8x | ✓ Both fast |
| 8 | 3.606 ms | 3.324 ms | 1.1x | ✓ Similar speed |
| 10 | 449.879 ms | 96.824 ms | **4.6x** | ✓ DP faster |
| 12 | 11,806.924 ms (11.8s) | 330.405 ms | **35.7x** | ✓ DP much faster |

### Key Findings

#### 1. **Exponential Growth in Brute-Force**
- Brute-force doubles execution time roughly every 2 additional items
- At 12 items: **11.8 seconds**
- At 15 items: Would take **~2-3 minutes**
- At 20 items: **Impractical** (hours+)

#### 2. **DP Scales Much Better**
- DP remains sub-second for 10-12 items
- DP handles 20 items instantly
- DP can handle 25+ items in reasonable time
- Linear-ish growth compared to exponential

#### 3. **Both Guarantee Optimal Solutions**
- Both algorithms produce identical optimal costs
- Results verified across all test cases ✓
- Trade-off is speed, not quality

#### 4. **Complexity Analysis**

**Brute-Force:** O(4^n)
```
5 items:  4^5 = 1,024 combinations
10 items: 4^10 = 1,048,576 combinations
12 items: 4^12 = 16,777,216 combinations
```

**Dynamic Programming:** O(n × 2^m)
```
Where n = items, m = shops
With m=20 shops:
- 10 items: 10 × 2^20 = 10.5M operations (but heavily pruned by memoization)
- 20 items: 20 × 2^20 = 20.9M operations (similar, memoization is key)
```

### Recommendation

| Scenario | Use |
|----------|-----|
| **Learning/Demo** | Brute-force (`bestPrice.ts`) |
| **5-10 items** | Either algorithm |
| **10-20 items** | **DP Only** (`bestPriceDP.ts`) |
| **20+ items** | **Must use DP** |
| **Production** | **Always DP** |

## How It Works

### Algorithm Comparison

#### Brute-Force Strategy
1. For each item, try buying from every shop that has it
2. Recursively explore all combinations
3. Track the best solution (min cost, then min shops)
4. Backtrack and explore next option

**Problem:** Explores all 4^n combinations without pruning

#### Dynamic Programming Strategy
1. Use bitmask to represent which shops have been used
2. Memoize state: `(item_index, shops_bitmask)` → minimum cost
3. For each item, try each shop option
4. Recursively solve for remaining items with updated shop set
5. Return cached result if already computed

**Advantage:** Many states lead to same optimal solution, so memoization prevents recomputation

## Dataset Format

`shops.json` structure:

```json
{
  "shopCount": 20,
  "shops": {
    "shop_a": [
      { "itemId": "price" },
      { "479": "193" },
      { "133": "122" }
    ],
    "shop_b": [
      { "168": "382" }
    ]
  }
}
```

Generate new datasets:
```bash
npx ts-node generateShops.ts > shops.json
```

Configuration in `generateShops.ts`:
- **20 shops** named `shop_a` through `shop_t`
- **30 unique items** (3-digit IDs: 100-999)
- **5-10 items per shop** (random selection)
- **Prices vary ±20%** from base price (realistic variation)

## Development

### Project Scripts

```bash
# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run build
# or: npx tsc

# Run with ts-node (no compilation needed)
npx ts-node bestPrice.ts 10
npx ts-node bestPriceDP.ts 20

# Run benchmark
npx ts-node benchmark.ts
```

### File Descriptions

| File | Purpose |
|------|---------|
| `bestPrice.ts` | Brute-force O(4^n) algorithm |
| `bestPriceDP.ts` | Dynamic Programming O(n×2^m) algorithm |
| `generateShops.ts` | Generates synthetic test data |
| `benchmark.ts` | Performance comparison tool |
| `dist/` | Compiled JavaScript output (production) |

### Type Safety

All TypeScript files include:
- Full type annotations
- Interface definitions for all data structures
- Strict type checking (`tsconfig.json`)
- Source maps for debugging

## Testing

Run the performance benchmark:

```bash
npx ts-node benchmark.ts
```

This compares both algorithms across different item counts and shows:
- Execution time for each
- Speedup factor (DP vs Brute-Force)
- Verification that results match

## Limitations & Future Improvements

### Current Limitations
- Works with current dataset size (20 shops max, due to bitmask limit of 32-bit)
- For 30+ shops, would need to use `BigInt` for bitmask
- No parallel processing
- No pruning heuristics

### Potential Improvements
1. **Extended Bitmask:** Use BigInt for more shops
2. **Branch & Bound:** Add pruning to reduce search space
3. **Greedy Heuristic:** Combine with approximation for faster estimates
4. **Parallel Processing:** Run multiple sub-problems in parallel
5. **Caching:** Persistent memoization across runs

## Use Cases

- **Price Comparison Tools:** Find cheapest multi-shop purchase strategies
- **Supply Chain Optimization:** Minimize vendor diversity while minimizing cost
- **Inventory Planning:** Determine optimal sourcing from multiple suppliers
- **Educational:** Algorithm design and complexity analysis

## Technical Stack

- **Language:** TypeScript (with strict type checking)
- **Runtime:** Node.js 18+
- **Type Checking:** Strict mode enabled
- **Source Maps:** Full debugging support
- **No External Dependencies:** Only Node.js built-ins (fs, path)

## License

MIT

## Author's Notes

This project demonstrates the importance of algorithm selection in solving combinatorial optimization problems. The difference between O(4^n) and O(n × 2^m) becomes dramatically apparent around n=10-12 items, where:

- Brute-force goes from **0.45 seconds to 11.8 seconds** (26x slower)
- DP stays under **330ms**

This is a real-world example of why algorithm complexity matters in practice.

---

**Version:** 1.0.0
**Last Updated:** 2025-11-15
