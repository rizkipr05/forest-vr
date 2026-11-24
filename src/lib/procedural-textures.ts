"use client";

import * as THREE from "three";

interface TextureBundle {
  barkMap: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  foliageMap: THREE.CanvasTexture;
  groundMap: THREE.CanvasTexture;
  groundBump: THREE.CanvasTexture;
  rockMap: THREE.CanvasTexture;
  leafMap: THREE.CanvasTexture;
}

let cachedBundle: TextureBundle | null = null;

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

/**
 * Generates seamless procedural PBR canvas textures (bark, terrain moss, granite rock,
 * leaf veins, and foliage canopy mottling) completely client-side with zero external network calls.
 */
export function getRainforestTextures(): TextureBundle | null {
  if (typeof document === "undefined") return null;
  if (cachedBundle) return cachedBundle;

  // 1. Furrowed Tropical Bark + Lichen Patches
  const [barkC, barkCtx] = makeCanvas(256, 256);
  const [barkBumpC, barkBumpCtx] = makeCanvas(256, 256);
  barkCtx.fillStyle = "#5c3d24";
  barkCtx.fillRect(0, 0, 256, 256);
  barkBumpCtx.fillStyle = "#808080";
  barkBumpCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 420; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    const w = 2 + (i % 4);
    const h = 22 + (i % 48);
    const dark = i % 2 === 0;
    barkCtx.fillStyle = dark ? "rgba(38,24,13,0.45)" : "rgba(128,92,58,0.35)";
    barkCtx.fillRect(x, y, w, h);
    barkBumpCtx.fillStyle = dark ? "rgba(30,30,30,0.55)" : "rgba(220,220,220,0.45)";
    barkBumpCtx.fillRect(x, y, w, h);
  }
  // Subtle green moss speckles on bark
  for (let i = 0; i < 85; i++) {
    const x = (i * 71) % 256;
    const y = (i * 131) % 256;
    barkCtx.fillStyle = "rgba(74, 124, 58, 0.35)";
    barkCtx.beginPath();
    barkCtx.arc(x, y, 4 + (i % 6), 0, Math.PI * 2);
    barkCtx.fill();
  }

  const barkMap = new THREE.CanvasTexture(barkC);
  barkMap.wrapS = barkMap.wrapT = THREE.RepeatWrapping;
  barkMap.repeat.set(2, 4);
  barkMap.colorSpace = THREE.SRGBColorSpace;

  const barkBump = new THREE.CanvasTexture(barkBumpC);
  barkBump.wrapS = barkBump.wrapT = THREE.RepeatWrapping;
  barkBump.repeat.set(2, 4);

  // 2. Canopy Foliage Mottled Light/Leaf Texture
  const [folC, folCtx] = makeCanvas(256, 256);
  folCtx.fillStyle = "#c8e6c9";
  folCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 650; i++) {
    const x = (i * 67) % 256;
    const y = (i * 113) % 256;
    const r = 4 + (i % 9);
    const shade = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#9ccc65" : "#558b2f";
    folCtx.globalAlpha = 0.25 + (i % 4) * 0.08;
    folCtx.fillStyle = shade;
    folCtx.beginPath();
    folCtx.ellipse(x, y, r * 1.3, r * 0.75, (i * 0.7) % Math.PI, 0, Math.PI * 2);
    folCtx.fill();
  }
  folCtx.globalAlpha = 1;
  const foliageMap = new THREE.CanvasTexture(folC);
  foliageMap.wrapS = foliageMap.wrapT = THREE.RepeatWrapping;
  foliageMap.repeat.set(2, 2);
  foliageMap.colorSpace = THREE.SRGBColorSpace;

  // 3. Organic Moss & Rainforest Floor Texture (seamless mottled foliage/earth, zero dot grid)
  const [gndC, gndCtx] = makeCanvas(256, 256);
  const [gndBC, gndBCtx] = makeCanvas(256, 256);
  gndCtx.fillStyle = "#dce8d5";
  gndCtx.fillRect(0, 0, 256, 256);
  gndBCtx.fillStyle = "#808080";
  gndBCtx.fillRect(0, 0, 256, 256);

  let seed = 918273;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 380; i++) {
    const x = nextRand() * 256;
    const y = nextRand() * 256;
    const rx = 10 + nextRand() * 24;
    const ry = 6 + nextRand() * 14;
    const rot = nextRand() * Math.PI;
    const pick = i % 3;
    gndCtx.fillStyle =
      pick === 0
        ? "rgba(82, 138, 62, 0.14)"
        : pick === 1
        ? "rgba(134, 178, 92, 0.12)"
        : "rgba(116, 86, 52, 0.08)";
    gndCtx.beginPath();
    gndCtx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    gndCtx.fill();
    // Wrap seamlessly at edges
    if (x + rx > 256) {
      gndCtx.beginPath();
      gndCtx.ellipse(x - 256, y, rx, ry, rot, 0, Math.PI * 2);
      gndCtx.fill();
    }
    if (y + ry > 256) {
      gndCtx.beginPath();
      gndCtx.ellipse(x, y - 256, rx, ry, rot, 0, Math.PI * 2);
      gndCtx.fill();
    }
  }
  const groundMap = new THREE.CanvasTexture(gndC);
  groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping;
  groundMap.repeat.set(12, 12);
  groundMap.colorSpace = THREE.SRGBColorSpace;

  const groundBump = new THREE.CanvasTexture(gndBC);
  groundBump.wrapS = groundBump.wrapT = THREE.RepeatWrapping;
  groundBump.repeat.set(12, 12);

  // 4. Granite River Rock Grain
  const [rkC, rkCtx] = makeCanvas(128, 128);
  rkCtx.fillStyle = "#cfd8dc";
  rkCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    const x = (i * 37) % 128;
    const y = (i * 59) % 128;
    rkCtx.fillStyle = i % 2 === 0 ? "rgba(60,70,80,0.28)" : "rgba(255,255,255,0.25)";
    rkCtx.fillRect(x, y, 2 + (i % 4), 2 + (i % 3));
  }
  const rockMap = new THREE.CanvasTexture(rkC);
  rockMap.wrapS = rockMap.wrapT = THREE.RepeatWrapping;
  rockMap.colorSpace = THREE.SRGBColorSpace;

  // 5. Tropical Veined Leaf Texture
  const [lfC, lfCtx] = makeCanvas(128, 128);
  lfCtx.fillStyle = "#dcedc8";
  lfCtx.fillRect(0, 0, 128, 128);
  lfCtx.strokeStyle = "rgba(85, 139, 47, 0.55)";
  lfCtx.lineWidth = 3;
  lfCtx.beginPath();
  lfCtx.moveTo(64, 0);
  lfCtx.lineTo(64, 128);
  lfCtx.stroke();
  lfCtx.lineWidth = 1.5;
  for (let y = 12; y < 124; y += 14) {
    lfCtx.beginPath();
    lfCtx.moveTo(64, y);
    lfCtx.lineTo(12, y - 10);
    lfCtx.moveTo(64, y);
    lfCtx.lineTo(116, y - 10);
    lfCtx.stroke();
  }
  const leafMap = new THREE.CanvasTexture(lfC);
  leafMap.colorSpace = THREE.SRGBColorSpace;

  cachedBundle = {
    barkMap,
    barkBump,
    foliageMap,
    groundMap,
    groundBump,
    rockMap,
    leafMap,
  };
  return cachedBundle;
}
