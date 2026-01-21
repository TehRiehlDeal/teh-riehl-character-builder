# Data Loading System

This directory contains the data loading infrastructure for the PF2e Character Builder.

## Overview

The data loading system uses **build-time manifests** and **lazy loading** to efficiently handle 14,000+ game data files.

## Architecture

```
┌─────────────────────────────────────────┐
│  Raw Data (14,091 JSON files)          │
│  /src/lib/data/raw/                     │
└──────────────┬──────────────────────────┘
               │
               │ scripts/generate-data-manifests.js
               ▼
┌─────────────────────────────────────────┐
│  Manifests (7 JSON files, ~2.4MB)      │
│  /src/lib/data/manifests/               │
└──────────────┬──────────────────────────┘
               │
               │ dataLoader.ts
               ▼
┌─────────────────────────────────────────┐
│  Adapters                               │
│  Transform Foundry → App Schema         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Repositories                           │
│  Provide query interface                │
└─────────────────────────────────────────┘
```

## Key Components

### 1. Raw Data (`/raw`)

Foundry VTT PF2e System JSON files organized by category:
- `ancestries/` - 50 ancestry files
- `heritages/` - 322 heritage files (organized by ancestry)
- `backgrounds/` - 485 background files
- `classes/` - 27 class files
- `feats/` - 5,849 feat files (organized by type)
- `spells/` - 1,796 spell files (cantrips, standard, focus, rituals)
- `equipment/` - 5,566 equipment files (weapons, armor, gear)

### 2. Manifests (`/manifests`)

Small JSON files that index all data files for fast lookup:

```json
{
  "category": "feats",
  "generated": "2026-01-18T13:33:00Z",
  "count": 5848,
  "entries": [
    {
      "id": "feat-id-1",
      "name": "Fleet",
      "type": "feat",
      "level": 1,
      "path": "general/fleet.json"
    }
    // ... 5,847 more entries
  ]
}
```

**Generation:** Run `npm run generate:manifests` after updating raw data.

### 3. Data Loader (`dataLoader.ts`)

Provides utilities for loading data using manifests:

```typescript
// Load all data for a category
const feats = await loadAllData<FoundryFeat>('feats');

// Load a single item by ID
const feat = await loadDataById<FoundryFeat>('feats', 'feat-id');

// Load filtered data
const level1Feats = await loadDataByFilter<FoundryFeat>(
  'feats',
  (entry) => entry.level === 1
);
```

**Features:**
- In-memory caching
- Batched loading (50 files at a time)
- Fetch-based loading from static directory (works in production builds)
- Type-safe with TypeScript generics

**Static Files:**
Data files are served from the `static/data/` directory:
- `/data/manifests/` - Manifest JSON files
- `/data/raw/` - Raw game data JSON files (copied during build)

### 4. Adapters (`/adapters`)

Transform Foundry VTT data into application schema:

- `ancestryAdapter.ts` - Transforms ancestry data
- `backgroundAdapter.ts` - Transforms background data
- `classAdapter.ts` - Transforms class data
- `featAdapter.ts` - Transforms feat data
- `spellAdapter.ts` - Transforms spell data
- `equipmentAdapter.ts` - Transforms weapon/armor/equipment data

Each adapter:
- Removes Foundry-specific fields (`_id`, `folder`, `img`)
- Normalizes data structures
- Documents transformations (Apache 2.0 requirement)
- Has comprehensive test coverage

### 5. Repositories (`/repositories`)

Provide high-level data access methods:

```typescript
// Get all feats
const allFeats = await getAllFeats();

// Get feat by ID (lazy-loads only that feat)
const feat = await getFeatById('feat-id');

// Filter feats
const martialFeats = await getFeatsByCategory('class');
const level5Feats = await getFeatsByLevel(5);

// Search
const searchResults = await searchFeats('dragon');
```

**Repositories available:**
- `ancestryRepository.ts`
- `backgroundRepository.ts`
- `classRepository.ts`
- `featRepository.ts`
- `spellRepository.ts`
- `equipmentRepository.ts`

## Usage

### Loading Data in Components

```typescript
import { getAllFeats, getFeatsByLevel } from '$lib/data/repositories/featRepository';

// In a Svelte component
let feats = [];

onMount(async () => {
  feats = await getFeatsByLevel(1);
});
```

### Loading Data in Stores

```typescript
import { getAllAncestries } from '$lib/data/repositories/ancestryRepository';
import { writable } from 'svelte/store';

export const ancestries = writable([]);

export async function loadAncestries() {
  const data = await getAllAncestries();
  ancestries.set(data);
}
```

## Updating Data

When you update the raw data files:

1. **Copy new data** from Foundry VTT repository to `src/lib/data/raw/`
2. **Regenerate manifests**: `npm run generate:manifests`
3. **Copy to static directory**:
   ```bash
   cp -r src/lib/data/raw static/data/
   cp -r src/lib/data/manifests static/data/
   ```
4. **Update version**: Edit `src/lib/data/versioning/version.ts`
5. **Test**: Run `npm test` to ensure adapters still work
6. **Commit**: Commit both the raw data and manifests (in both src and static directories)

## Performance Characteristics

- **Initial manifest load**: ~2.4MB (one-time per category)
- **Per-item load**: ~1-10KB (dynamic import)
- **Cache**: All loaded data cached in memory
- **Batch size**: 50 files loaded concurrently
- **Total data**: ~50MB uncompressed, ~5MB compressed

## Development

### Adding a New Data Category

1. **Add raw data** to `/raw/new-category/`
2. **Update manifest generator**: Add category to `scripts/generate-data-manifests.js`
3. **Run generator**: `npm run generate:manifests`
4. **Create adapter**: `adapters/newCategoryAdapter.ts`
5. **Create repository**: `repositories/newCategoryRepository.ts`
6. **Add tests**: `adapters/newCategoryAdapter.test.ts`

### Clearing Caches

```typescript
import { clearDataCache, clearCategoryCache } from '$lib/data/dataLoader';

// Clear all caches
clearDataCache();

// Clear specific category
clearCategoryCache('feats');
```

## License Compliance

Data is sourced from the Foundry VTT PF2e System (Apache 2.0).

All adapters document transformations as required by the Apache License.

See `DATA_SOURCE.md` and `/legal` page for full attribution.

## Troubleshooting

### Manifest not found error
- Run `npm run generate:manifests`
- Ensure manifests are committed to git

### Import errors in production
- Check that Vite is configured to handle JSON imports
- Verify file paths use forward slashes
- Ensure manifests are included in build

### Slow loading
- Check network tab for excessive requests
- Verify caching is working
- Consider pre-loading frequently used data

## Future Enhancements

- **Incremental loading**: Load data on scroll/demand
- **Service worker caching**: Cache data for offline use
- **Search indexing**: Build search index at build time
- **Compression**: Compress large data files
- **CDN**: Serve data from CDN for faster loading
