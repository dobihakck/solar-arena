import { PlanetData } from "../data/planets";
import { TILES, AIR, getResourceTilesForPlanet, getBaseTilesForPlanet } from "../data/tiles";

export class PlanetGenerator {

  static generate(planet: PlanetData, seed?: number): number[][] {
  // Если seed не передан — генерируем детерминированно из имени планеты
  if (seed === undefined) {
    seed = this.hashString(planet.name);
  }
  const rng = this.makeRng(seed);
  const W = planet.worldWidth;
  const D = planet.worldDepth;
  const surfaceBase = planet.surfaceLevel;

  const { surface: surfaceTile, underground: undergroundTile } = getBaseTilesForPlanet(planet.name);
  const resourceTileIds = getResourceTilesForPlanet(planet.name);

  const world: number[][] = [];
  for (let y = 0; y < D; y++) {
    world.push(new Array(W).fill(AIR));
  }

  const surfaceHeights: number[] = [];
  let h = surfaceBase;
  for (let x = 0; x < W; x++) {
    h += (rng() - 0.5) * 2;
    h = Math.max(surfaceBase - 8, Math.min(surfaceBase + 8, h));
    surfaceHeights.push(Math.floor(h));
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let x = 1; x < W - 1; x++) {
      surfaceHeights[x] = Math.floor((surfaceHeights[x - 1] + surfaceHeights[x] + surfaceHeights[x + 1]) / 3);
    }
  }

  for (let x = 0; x < W; x++) {
    const surfY = surfaceHeights[x];
    for (let y = 0; y < D; y++) {
      if (y < surfY) {
        world[y][x] = AIR;
      } else if (y === surfY) {
        world[y][x] = surfaceTile;
      } else if (y >= D - 3) {
        world[y][x] = 3;
      } else if (y < surfY + 8) {
        world[y][x] = surfaceTile;
      } else {
        world[y][x] = undergroundTile;
      }
    }
  }

  for (const tileId of resourceTileIds) {
    const tileDef = TILES[tileId];
    if (!tileDef) continue;
    for (let x = 0; x < W; x++) {
      const surfY = surfaceHeights[x];
      for (let y = 0; y < D; y++) {
        const depth = y - surfY;
        if (depth < tileDef.minDepth || depth > tileDef.maxDepth) continue;
        if (world[y][x] !== surfaceTile && world[y][x] !== undergroundTile) continue;
        if (rng() < tileDef.spawnChance * planet.resourceRichness) {
          world[y][x] = tileId;
        }
      }
    }
  }

  for (let x = 5; x < W - 5; x++) {
    const surfY = surfaceHeights[x];
    for (let y = surfY + 10; y < D - 5; y++) {
      if (world[y][x] === 3) continue;
      if (rng() < 0.03) {
        world[y][x] = AIR;
        if (rng() < 0.5 && y + 1 < D - 3) world[y + 1][x] = AIR;
        if (rng() < 0.5 && x + 1 < W) world[y][x + 1] = AIR;
      }
    }
  }

  return world;
}

/** Детерминированный хэш строки → число (seed) */
private static hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return Math.abs(hash);
}

  private static makeRng(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }
}
