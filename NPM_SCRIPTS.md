# NPM Scripts Guide

This document explains all available npm scripts for running and testing the Best Price optimization solver.

## Quick Start

```bash
npm install           # Install dependencies (one-time only)
npm run dev          # Run default: DP with 15 items
npm run benchmark    # See performance comparison
```

---

## Build Scripts

### `npm run build`

Compile TypeScript to JavaScript in `dist/` folder.

```bash
npm run build
# Output: TypeScript files compiled to dist/*.js
```

### `npm run clean`

Remove the compiled `dist/` folder.

```bash
npm run clean
# Cleans build artifacts
```

### `npm run prod:build`

Production build: clean, compile, and copy data file.

```bash
npm run prod:build
# 1. Removes old dist/
# 2. Compiles TypeScript
# 3. Copies shops.json to dist/
# Ready for deployment
```

---

## Algorithm Tests

### Brute-Force Algorithm (O(4^n))

#### `npm run bf:5`

Run brute-force with 5 items (fast).

```bash
npm run bf:5
# Time: ~0.2ms
# Recommendation: Quick test
```

#### `npm run bf:10`

Run brute-force with 10 items (slowish).

```bash
npm run bf:10
# Time: ~450ms
# Warning: Gets slow at 10 items
```

#### `npm run bf:all`

Run brute-force with multiple sizes (5, 8, 10).

```bash
npm run bf:all
# Tests: 5, 8, 10 items
# Shows how brute-force degrades
```

---

### Standard Dynamic Programming (O(n × 2^m))

#### `npm run dp:5`

Run standard DP with 5 items.

```bash
npm run dp:5
# Time: ~0.3ms
```

#### `npm run dp:15`

Run standard DP with 15 items (default dev command).

```bash
npm run dp:15
npm run dev  # Same as above
# Time: ~1000ms
```

#### `npm run dp:20`

Run standard DP with 20 items.

```bash
npm run dp:20
# Time: ~1500ms
# Good DP performance
```

#### `npm run dp:all`

Run standard DP with multiple sizes (5, 10, 15, 20).

```bash
npm run dp:all
# Complete test suite for standard DP
```

---

### Optimized Dynamic Programming (With Branch-and-Bound Pruning)

#### `npm run opt:15`

Run optimized DP with 15 items (fastest for 15).

```bash
npm run opt:15
# Time: ~0.086ms (12,636x faster than standard DP!)
```

#### `npm run opt:20`

Run optimized DP with 20 items.

```bash
npm run opt:20
# Time: ~0.1ms
# Instant performance
```

#### `npm run opt:25`

Run optimized DP with 25 items (pushing the limit).

```bash
npm run opt:25
# Time: ~0.2-1ms
# Still sub-millisecond
```

---

## Utility Scripts

### `npm run benchmark`

Compare all three algorithms side-by-side.

```bash
npm run benchmark
# Compares: Standard DP vs Optimized DP
# Shows: Speed improvements, pruning ratios, verification
```

Output shows:

- Execution time for each
- Speedup factor
- Percentage of states pruned
- Results verification (both optimal)

### `npm run generate`

Generate new random test data.

```bash
npm run generate
# Creates new shops.json with random inventory
# Overwrites existing shops.json
# Useful for testing with different datasets
```

---

## Production Scripts

### `npm run prod:build`

Build for production deployment.

```bash
npm run prod:build
# Does:
# 1. npm run clean (remove old dist/)
# 2. npm run build (compile TS → JS)
# 3. Copies shops.json to dist/
# Result: dist/ ready to deploy
```

### `npm run prod:run`

Run compiled production version with 20 items.

```bash
npm run prod:run
# Runs: node dist/bestPriceDP.js 20
# Fast (pre-compiled, no TS overhead)
```

---

## Usage Examples

### Development Workflow

```bash
# 1. Quick test during development
npm run opt:15

# 2. Compare all algorithms
npm run benchmark

# 3. Run all DP tests
npm run dp:all
```

### Testing Different Sizes

```bash
# Test specific sizes
npm run dp:5    # Small
npm run dp:20   # Medium
npm run opt:25  # Large

# Or test all sizes at once
npm run dp:all
```

### Performance Analysis

```bash
# See detailed comparison
npm run benchmark

# Output includes:
# - Standard DP time
# - Optimized DP time
# - Speedup multiplier
# - Pruning ratio
```

### Preparing for Production

```bash
# 1. Build optimized version
npm run prod:build

# 2. Test compiled version
npm run prod:run

# 3. Deploy dist/ folder
```

### Generate New Data

```bash
# Create new random dataset
npm run generate

# Now test with new data
npm run benchmark
```

---

## Script Groups by Purpose

### For Learning

```bash
npm run bf:5    # See how brute-force works
npm run dp:5    # See how DP works
```

### For Performance Testing

```bash
npm run benchmark    # Compare algorithms
npm run opt:20      # See optimized performance
```

### For Full Test Suite

```bash
npm run bf:all      # All brute-force tests
npm run dp:all      # All DP tests
npm run benchmark   # Algorithm comparison
```

### For Developers

```bash
npm run dev         # Quick development run (DP with 15 items)
npm run build       # Compile changes
```

### For Production

```bash
npm run prod:build  # Build for deployment
npm run prod:run    # Test compiled version
```

---

## Performance Expectations

| Command | Items | Time | Status |
|---------|-------|------|--------|
| `bf:5` | 5 | ~0.2ms | ✓ Fast |
| `bf:10` | 10 | ~450ms | ⚠ Slow |
| `dp:5` | 5 | ~0.3ms | ✓ Fast |
| `dp:15` | 15 | ~1000ms | ⚠ Acceptable |
| `dp:20` | 20 | ~1500ms | ⚠ Acceptable |
| `opt:15` | 15 | ~0.086ms | ✓ Instant |
| `opt:20` | 20 | ~0.1ms | ✓ Instant |
| `opt:25` | 25 | ~1ms | ✓ Instant |

---

## Tips & Tricks

### Running Custom Item Counts

Scripts are hardcoded for common sizes. To run arbitrary sizes:

```bash
# Run directly with ts-node
npx ts-node bestPriceDP.ts 17      # 17 items
npx ts-node bestPriceDPOptimized.ts 22  # 22 items

# Or compile first, then run
npm run build
node dist/bestPriceDP.js 18        # 18 items
```

### Chaining Commands

```bash
# Build then run
npm run prod:build && npm run prod:run

# Generate new data then benchmark
npm run generate && npm run benchmark

# Full workflow
npm run clean && npm run build && npm run benchmark
```

### Redirecting Output

```bash
# Save results to file
npm run opt:20 > results.json

# Generate new data to file
npm run generate > new_shops.json

# Then use new data
cp new_shops.json shops.json
npm run benchmark
```

---

## Troubleshooting

### Command not found

```bash
# Make sure dependencies are installed
npm install

# Then try again
npm run benchmark
```

### TypeScript errors

```bash
# Make sure TypeScript is installed
npm install --save-dev typescript ts-node

# Or just rebuild
npm run clean && npm run build
```

### shops.json not found

```bash
# Generate sample data
npm run generate

# Or copy from root to dist after building
npm run prod:build  # Does this automatically
```

### Permission denied (on macOS/Linux)

```bash
# Make sure you're in the right directory
cd /path/to/best_price

# Then run scripts
npm run benchmark
```

---

## Available Commands Summary

| Category | Commands |
|----------|----------|
| Build | `build`, `clean`, `prod:build` |
| Brute-Force | `bf:5`, `bf:10`, `bf:all` |
| Standard DP | `dp:5`, `dp:15`, `dp:20`, `dp:all` |
| Optimized DP | `opt:15`, `opt:20`, `opt:25` |
| Utilities | `benchmark`, `generate`, `dev` |
| Production | `prod:build`, `prod:run` |

**Total: 20 npm scripts available**

---

## Recommended Usage

### For First-Time Users

```bash
npm install
npm run dev              # See it in action
npm run benchmark       # Understand the improvements
```

### For Development

```bash
npm run benchmark       # Before/after optimization comparison
npm run opt:20         # Test your changes
npm run build          # Prepare for testing
```

### For Production Deployment

```bash
npm run prod:build     # Full production build
npm run prod:run       # Test before deploying
# Deploy dist/ folder
```

---

See [README.md](README.md) for more information on algorithms and usage.
