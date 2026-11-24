/**
 * Deterministic PRNG, 2D noise, and shared Amazon Rainforest terrain/river geometry functions.
 * Keeping terrain math in a single module guarantees procedural trees, plants, rocks, animals,
 * river water, and player collision/elevation stay perfectly aligned.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(ix: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function valueNoise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2D(ix, iz);
  const b = hash2D(ix + 1, iz);
  const c = hash2D(ix, iz + 1);
  const d = hash2D(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

export function fbm2D(x: number, z: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * (valueNoise2D(x * frequency, z * frequency) * 2 - 1);
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.05;
  }

  return value / norm;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Center X coordinate of the meandering Amazon tributary along the Z axis.
 */
export function getRiverCenterX(z: number): number {
  return Math.sin(z * 0.055) * 8.0 + Math.cos(z * 0.025) * 3.0;
}

/**
 * Half-width of the Amazon river water surface at coordinate Z.
 */
export function getRiverHalfWidth(z: number): number {
  return 6.2 + Math.sin(z * 0.09 + 0.8) * 1.1;
}

/**
 * Ground terrain height at world coordinates (x, z).
 * Water level sits at y = 0.0. Riverbed dips to ~ -1.55m; banks rise smoothly to 0.55m - 3.2m.
 */
export function getTerrainHeight(x: number, z: number): number {
  const riverX = getRiverCenterX(z);
  const halfWidth = getRiverHalfWidth(z);
  const distFromRiver = Math.abs(x - riverX);

  // Rolling jungle floor noise
  const broadHills = fbm2D(x * 0.028 + 4.1, z * 0.028 - 2.3, 4) * 1.65;
  const microUndulation = fbm2D(x * 0.11, z * 0.11, 2) * 0.28;

  // Raise outer forest perimeter gently to frame the scene
  const radialDist = Math.hypot(x, z);
  const perimeterRise = smoothstep(32, 62, radialDist) * 3.4;

  // Keep player spawn clearing around (-14, 8) gentle and welcoming
  const spawnClear = 1 - smoothstep(4, 14, Math.hypot(x + 14, z - 8));
  const clearingFlat = 0.72;

  const naturalLand = 0.75 + broadHills * (1 - 0.55 * spawnClear) + microUndulation + perimeterRise;
  const landHeight = naturalLand * (1 - 0.35 * spawnClear) + clearingFlat * (0.35 * spawnClear);

  // Carve river channel smoothly below y = 0
  if (distFromRiver < halfWidth + 4.2) {
    const bankBlend = smoothstep(halfWidth - 1.4, halfWidth + 4.2, distFromRiver);
    const channelDepth = -1.55 + smoothstep(0, halfWidth, distFromRiver) * 1.3;
    return channelDepth * (1 - bankBlend) + Math.max(0.28, landHeight) * bankBlend;
  }

  return Math.max(0.35, landHeight);
}

/** Bridge span coordinates crossing the river near z = 0. */
export const BRIDGE_CONFIG = {
  zCenter: 0,
  halfDepth: 1.55,
  xStart: -4.8,
  xEnd: 11.2,
  deckBaseHeight: 1.15,
};

/**
 * Returns true if (x, z) is on the wooden Amazon explorer bridge.
 */
export function isOnBridge(x: number, z: number): boolean {
  return (
    x >= BRIDGE_CONFIG.xStart &&
    x <= BRIDGE_CONFIG.xEnd &&
    Math.abs(z - BRIDGE_CONFIG.zCenter) <= BRIDGE_CONFIG.halfDepth
  );
}

/**
 * Returns the bridge deck Y elevation at X (gently arched across the river).
 */
export function getBridgeDeckY(x: number): number {
  const t =
    (x - BRIDGE_CONFIG.xStart) / (BRIDGE_CONFIG.xEnd - BRIDGE_CONFIG.xStart);
  const clamped = Math.max(0, Math.min(1, t));
  const arch = Math.sin(clamped * Math.PI) * 0.55;
  return BRIDGE_CONFIG.deckBaseHeight + arch;
}

/**
 * Walkable height for the explorer (accounts for bridge deck over water and prevents sinking).
 */
export function getWalkableHeight(x: number, z: number): number {
  if (isOnBridge(x, z)) {
    return getBridgeDeckY(x);
  }
  const terrain = getTerrainHeight(x, z);
  return Math.max(0.18, terrain);
}

/**
 * Returns true if (x, z) is safely on dry land or the bridge (not deep river water).
 */
export function isWalkablePosition(x: number, z: number): boolean {
  if (isOnBridge(x, z)) return true;
  return getTerrainHeight(x, z) > 0.14;
}
