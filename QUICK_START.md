# Quick Start Guide

## Installation (1 minute)

```bash
cd best_price
npm install
```

## Run Examples

### Brute-Force Algorithm (≤10 items)
```bash
npx ts-node bestPrice.ts 5      # 5 items
npx ts-node bestPrice.ts 10     # 10 items (starts getting slow)
```

### Dynamic Programming (10-20+ items) ⭐ RECOMMENDED
```bash
npx ts-node bestPriceDP.ts 15   # Fast even with 15 items
npx ts-node bestPriceDP.ts 20   # Handles 20 items instantly
```

### Generate New Data
```bash
npx ts-node generateShops.ts > shops.json
```

### Production (Compiled)
```bash
npm run build              # Compile TypeScript
node dist/bestPriceDP.js 20
```

## Performance Summary

| Items | Brute-Force | DP | Speedup |
|-------|------------|-----|---------|
| 5 | 0.2 ms | 0.3 ms | 0.8x |
| 8 | 3.6 ms | 3.3 ms | 1.1x |
| 10 | 450 ms | 97 ms | **4.6x** |
| 12 | 11.8 s | 330 ms | **35.7x** |

**Key Finding:** Use DP for anything over 10 items!

## Example Output

```json
{
  "selectedItems": [
    {"id": "429", "shop": "shop_k", "price": 211},
    {"id": "995", "shop": "shop_o", "price": 258}
  ],
  "totalCost": 469,
  "shopCount": 2,
  "shops": ["shop_k", "shop_o"]
}
```

See [README.md](README.md) for full documentation.
