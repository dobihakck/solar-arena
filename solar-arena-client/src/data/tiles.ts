export interface TileType {
  id: number;
  name: string;
  color: number;
  edgeColor: number;
  hardness: number;
  solid: boolean;
  resource?: string;
  minDepth: number;
  maxDepth: number;
  spawnChance: number;
  transparent?: boolean;
}

export const TILE_SIZE = 28;
export const AIR = 0;

export const TILES: Record<number, TileType> = {
  0: { id: 0, name: "air", color: 0x000000, edgeColor: 0x000000, hardness: 0, solid: false, minDepth: 0, maxDepth: 0, spawnChance: 0, transparent: true },

  1: { id: 1, name: "dirt", color: 0x6b4226, edgeColor: 0x4a2e18, hardness: 0.3, solid: true, minDepth: 0, maxDepth: 15, spawnChance: 1.0 },
  2: { id: 2, name: "stone", color: 0x5a5a6a, edgeColor: 0x3a3a4a, hardness: 0.8, solid: true, minDepth: 5, maxDepth: 200, spawnChance: 1.0 },
  3: { id: 3, name: "bedrock", color: 0x1a1a2e, edgeColor: 0x0a0a1e, hardness: 999, solid: true, minDepth: 95, maxDepth: 200, spawnChance: 1.0 },

  10: { id: 10, name: "iron_ore", color: 0x8b6f47, edgeColor: 0x5a4530, hardness: 1.0, solid: true, resource: "iron", minDepth: 3, maxDepth: 80, spawnChance: 0.12 },
  11: { id: 11, name: "sulfur", color: 0xe6c229, edgeColor: 0xb89620, hardness: 0.6, solid: true, resource: "sulfur", minDepth: 2, maxDepth: 60, spawnChance: 0.08 },
  12: { id: 12, name: "titanium_ore", color: 0xb0bec5, edgeColor: 0x78909c, hardness: 1.8, solid: true, resource: "titanium", minDepth: 15, maxDepth: 70, spawnChance: 0.05 },
  13: { id: 13, name: "potassium", color: 0xc8a2c8, edgeColor: 0x9a7a9a, hardness: 0.7, solid: true, resource: "potassium", minDepth: 25, maxDepth: 65, spawnChance: 0.04 },
  14: { id: 14, name: "sodium_ore", color: 0xf0f0e0, edgeColor: 0xc0c0a0, hardness: 0.5, solid: true, resource: "sodium", minDepth: 10, maxDepth: 50, spawnChance: 0.05 },

  20: { id: 20, name: "basalt", color: 0x2f2f3a, edgeColor: 0x1f1f2a, hardness: 1.2, solid: true, resource: "basalt", minDepth: 0, maxDepth: 90, spawnChance: 0.15 },
  21: { id: 21, name: "granite", color: 0x8a7560, edgeColor: 0x5a4a40, hardness: 1.5, solid: true, resource: "granite", minDepth: 10, maxDepth: 80, spawnChance: 0.08 },
  22: { id: 22, name: "pyrite", color: 0xffd700, edgeColor: 0xcca800, hardness: 1.0, solid: true, resource: "pyrite", minDepth: 8, maxDepth: 60, spawnChance: 0.06 },

  30: { id: 30, name: "coal", color: 0x1a1a1a, edgeColor: 0x0a0a0a, hardness: 0.5, solid: true, resource: "coal", minDepth: 3, maxDepth: 40, spawnChance: 0.10 },
  31: { id: 31, name: "copper_ore", color: 0xb87333, edgeColor: 0x8a5626, hardness: 1.0, solid: true, resource: "copper", minDepth: 5, maxDepth: 55, spawnChance: 0.08 },
  32: { id: 32, name: "tin_ore", color: 0xa0a0a0, edgeColor: 0x707070, hardness: 0.8, solid: true, resource: "tin", minDepth: 4, maxDepth: 35, spawnChance: 0.07 },
  33: { id: 33, name: "gold_ore", color: 0xffd700, edgeColor: 0xcca800, hardness: 1.8, solid: true, resource: "gold", minDepth: 25, maxDepth: 80, spawnChance: 0.04 },
  34: { id: 34, name: "silver_ore", color: 0xc0c0c0, edgeColor: 0x909090, hardness: 1.5, solid: true, resource: "silver", minDepth: 20, maxDepth: 70, spawnChance: 0.05 },
  35: { id: 35, name: "diamond", color: 0x00ffff, edgeColor: 0x00aaaa, hardness: 3.0, solid: true, resource: "diamond", minDepth: 50, maxDepth: 95, spawnChance: 0.02 },
  36: { id: 36, name: "emerald", color: 0x50c878, edgeColor: 0x309050, hardness: 2.5, solid: true, resource: "emerald", minDepth: 45, maxDepth: 90, spawnChance: 0.02 },
  37: { id: 37, name: "platinum_ore", color: 0xe5e4e2, edgeColor: 0xb5b4b2, hardness: 2.5, solid: true, resource: "platinum", minDepth: 40, maxDepth: 90, spawnChance: 0.03 },
  38: { id: 38, name: "lead_ore", color: 0x5a5a6a, edgeColor: 0x3a3a4a, hardness: 1.0, solid: true, resource: "lead", minDepth: 15, maxDepth: 60, spawnChance: 0.06 },

  40: { id: 40, name: "iron_oxide", color: 0xcd5c5c, edgeColor: 0x9a3c3c, hardness: 0.4, solid: true, resource: "iron_oxide", minDepth: 0, maxDepth: 30, spawnChance: 0.20 },
  41: { id: 41, name: "olivine", color: 0x6b8e23, edgeColor: 0x4a6a18, hardness: 1.5, solid: true, resource: "olivine", minDepth: 20, maxDepth: 75, spawnChance: 0.06 },
  42: { id: 42, name: "water_ice", color: 0xaaddff, edgeColor: 0x77aacc, hardness: 0.3, solid: true, resource: "water_ice", minDepth: 2, maxDepth: 25, spawnChance: 0.10 },
  43: { id: 43, name: "hematite", color: 0x8b0000, edgeColor: 0x5a0000, hardness: 1.2, solid: true, resource: "hematite", minDepth: 15, maxDepth: 70, spawnChance: 0.07 },
  44: { id: 44, name: "clay", color: 0xb08968, edgeColor: 0x806040, hardness: 0.4, solid: true, resource: "clay", minDepth: 0, maxDepth: 20, spawnChance: 0.08 },

  50: { id: 50, name: "ammonia_ice", color: 0xdda0dd, edgeColor: 0xaa70aa, hardness: 0.5, solid: true, resource: "ammonia", minDepth: 0, maxDepth: 40, spawnChance: 0.12 },
  51: { id: 51, name: "methane_ice", color: 0x66ccff, edgeColor: 0x4090cc, hardness: 0.6, solid: true, resource: "methane", minDepth: 5, maxDepth: 50, spawnChance: 0.10 },
  52: { id: 52, name: "silicates", color: 0x7a6a5a, edgeColor: 0x5a4a3a, hardness: 1.3, solid: true, resource: "silicates", minDepth: 10, maxDepth: 80, spawnChance: 0.08 },

  60: { id: 60, name: "hydrocarbon", color: 0x4a4a2a, edgeColor: 0x2a2a1a, hardness: 0.7, solid: true, resource: "hydrocarbon", minDepth: 0, maxDepth: 60, spawnChance: 0.12 },
  61: { id: 61, name: "nitrogen_ice", color: 0xaaaaff, edgeColor: 0x7777cc, hardness: 0.5, solid: true, resource: "nitrogen", minDepth: 3, maxDepth: 45, spawnChance: 0.10 },
};

export function getResourceTilesForPlanet(planetName: string): number[] {
  const ranges: Record<string, [number, number]> = {
    "Mercury":  [10, 14],
    "Venus":    [20, 22],
    "Earth":    [30, 38],
    "Mars":     [40, 44],
    "Jupiter":  [50, 52],
    "Saturn":   [60, 61],
  };
  const range = ranges[planetName];
  if (!range) return [10];
  const ids: number[] = [];
  for (let i = range[0]; i <= range[1]; i++) {
    if (TILES[i]) ids.push(i);
  }
  return ids;
}

export function getBaseTilesForPlanet(planetName: string): { surface: number; underground: number } {
  const baseTiles: Record<string, { surface: number; underground: number }> = {
    "Mercury":  { surface: 1, underground: 2 },
    "Venus":    { surface: 20, underground: 20 },
    "Earth":    { surface: 1, underground: 2 },
    "Mars":     { surface: 40, underground: 2 },
    "Jupiter":  { surface: 50, underground: 52 },
    "Saturn":   { surface: 60, underground: 61 },
  };
  return baseTiles[planetName] ?? { surface: 1, underground: 2 };
}
