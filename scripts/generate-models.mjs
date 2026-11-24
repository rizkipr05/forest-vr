import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { dedup, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const OUT_DIR = path.join(process.cwd(), "public", "models");
fs.mkdirSync(OUT_DIR, { recursive: true });

await MeshoptEncoder.ready;

/**
 * Helper to convert a Three.js BufferGeometry into a glTF-Transform Primitive.
 * Supports vertex colors, normals, and indexed or non-indexed meshes.
 */
function threeGeoToPrimitive(doc, buffer, geometry, material) {
  const geo = geometry.index ? geometry : geometry;
  if (!geo.attributes.normal) {
    geo.computeVertexNormals();
  }

  const posAttr = geo.attributes.position;
  const normAttr = geo.attributes.normal;
  const colorAttr = geo.attributes.color;

  const posArray = new Float32Array(posAttr.array);
  const normArray = new Float32Array(normAttr.array);

  const prim = doc.createPrimitive().setMaterial(material);
  prim.setAttribute(
    "POSITION",
    doc.createAccessor().setType("VEC3").setArray(posArray).setBuffer(buffer)
  );
  prim.setAttribute(
    "NORMAL",
    doc.createAccessor().setType("VEC3").setArray(normArray).setBuffer(buffer)
  );

  if (colorAttr) {
    const colArray = new Float32Array(colorAttr.array);
    prim.setAttribute(
      "COLOR_0",
      doc
        .createAccessor()
        .setType(colorAttr.itemSize === 4 ? "VEC4" : "VEC3")
        .setArray(colArray)
        .setBuffer(buffer)
    );
  }

  if (geo.index) {
    const rawIdx = geo.index.array;
    const maxIdx = posAttr.count;
    const idxArray =
      maxIdx > 65535 ? new Uint32Array(rawIdx) : new Uint16Array(rawIdx);
    prim.setIndices(
      doc.createAccessor().setType("SCALAR").setArray(idxArray).setBuffer(buffer)
    );
  }

  return prim;
}

function makeMaterial(doc, { name, hex, roughness = 0.68, metalness = 0.04, doubleSided = false }) {
  const color = new THREE.Color(hex);
  return doc
    .createMaterial(name)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(roughness)
    .setMetallicFactor(metalness)
    .setDoubleSided(doubleSided);
}

/**
 * Paint vertex colors onto a BufferGeometry using a callback (x, y, z, nx, ny, nz) -> THREE.Color
 */
function paintVertices(geo, colorFn) {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal || (geo.computeVertexNormals(), geo.attributes.normal);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    colorFn(
      pos.getX(i),
      pos.getY(i),
      pos.getZ(i),
      norm.getX(i),
      norm.getY(i),
      norm.getZ(i),
      c
    );
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Sculpt a sphere geometry with organic deformation callback.
 */
function makeSculptedEllipsoid(rx, ry, rz, wSeg = 20, hSeg = 14, deformFn = null) {
  const geo = new THREE.SphereGeometry(1, wSeg, hSeg);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) * rx;
    let y = pos.getY(i) * ry;
    let z = pos.getZ(i) * rz;
    if (deformFn) {
      const res = deformFn(x, y, z, pos.getX(i), pos.getY(i), pos.getZ(i));
      x = res[0];
      y = res[1];
      z = res[2];
    }
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Create a tapered tube along a 3D CatmullRomCurve3 with custom radius function r(t).
 */
function makeTaperedTube(points, tubularSegments, radialSegments, radiusFn) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions = [];
  const indices = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusFn(t);

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);
      const vx = p.x + r * (cos * N.x + sin * B.x);
      const vy = p.y + r * (cos * N.y + sin * B.y);
      const vz = p.z + r * (cos * N.z + sin * B.z);
      positions.push(vx, vy, vz);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Create an extruded sculpted leaf/wing/bract shape.
 */
function makeLeafGeometry(length = 1.0, width = 0.35, curveArch = 0.2, curl = 0.08) {
  const segL = 12;
  const segW = 4;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segL; i++) {
    const t = i / segL;
    const z = t * length;
    const w = Math.sin(t * Math.PI) * width * (1 - t * 0.25);
    const archY = Math.sin(t * Math.PI * 0.85) * curveArch - t * t * curveArch * 0.45;
    for (let j = 0; j <= segW; j++) {
      const u = (j / segW) * 2 - 1;
      const x = u * w;
      const y = archY + Math.abs(u) * curl + (1 - Math.abs(u)) * 0.015;
      positions.push(x, y, z);
    }
  }
  for (let i = 0; i < segL; i++) {
    for (let j = 0; j < segW; j++) {
      const a = i * (segW + 1) + j;
      const b = (i + 1) * (segW + 1) + j;
      const c = (i + 1) * (segW + 1) + (j + 1);
      const d = i * (segW + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

class ModelBuilder {
  constructor(title) {
    this.doc = new Document();
    this.doc.getRoot().getAsset().copyright = "CC0 - Amazon Rainforest Explorer Procedural Asset";
    this.doc.getRoot().getAsset().generator = "amazon-rainforest-explorer-glb-builder";
    this.buffer = this.doc.createBuffer("buffer");
    this.scene = this.doc.createScene(title);
    this.doc.getRoot().setDefaultScene(this.scene);
    this.root = this.doc.createNode("Root");
    this.scene.addChild(this.root);
    this.materials = new Map();
  }

  mat(key, opts) {
    if (!this.materials.has(key)) {
      this.materials.set(key, makeMaterial(this.doc, { name: key, ...opts }));
    }
    return this.materials.get(key);
  }

  addNode(name, parent = this.root, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
    const node = this.doc.createNode(name);
    node.setTranslation(pos);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2]));
    node.setRotation([q.x, q.y, q.z, q.w]);
    node.setScale(scale);
    parent.addChild(node);
    return node;
  }

  attachGeo(node, geo, material, meshName = node.getName()) {
    const prim = threeGeoToPrimitive(this.doc, this.buffer, geo, material);
    const mesh = node.getMesh() || this.doc.createMesh(meshName);
    mesh.addPrimitive(prim);
    node.setMesh(mesh);
    return node;
  }

  async save(filename) {
    this.doc.createExtension(EXTMeshoptCompression).setRequired(true);
    await this.doc.transform(
      dedup(),
      prune(),
      meshopt({ encoder: MeshoptEncoder, level: "medium" })
    );
    const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]);
    io.registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
    });
    const outPath = path.join(OUT_DIR, filename);
    await io.write(outPath, this.doc);
    const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`Saved ${filename} (${sizeKB} KB)`);
  }
}

function addEyes(builder, parent, eyePositions, eyeRadius = 0.045, irisHex = "#111827") {
  const eyeMat = builder.mat("eyeDark", { hex: irisHex, roughness: 0.15, metalness: 0.1 });
  const glintMat = builder.mat("eyeWhite", { hex: "#ffffff", roughness: 0.1 });
  for (const [ex, ey, ez] of eyePositions) {
    const eNode = builder.addNode("Eye", parent, [ex, ey, ez]);
    builder.attachGeo(eNode, new THREE.SphereGeometry(eyeRadius, 12, 10), eyeMat);
    const gNode = builder.addNode("EyeGlint", eNode, [ex > 0 ? eyeRadius * 0.28 : -eyeRadius * 0.28, eyeRadius * 0.35, eyeRadius * 0.65]);
    builder.attachGeo(gNode, new THREE.SphereGeometry(eyeRadius * 0.32, 8, 8), glintMat);
  }
}

// =========================================================================
// 1. JAGUAR
// =========================================================================
async function buildJaguar() {
  const b = new ModelBuilder("Jaguar");
  const coatMat = b.mat("jaguarCoat", { hex: "#ffffff", roughness: 0.62 });
  const darkMat = b.mat("dark", { hex: "#29180a", roughness: 0.55 });
  const noseMat = b.mat("nose", { hex: "#451a03", roughness: 0.4 });

  // Muscular feline torso with natural waist taper & true rosette vertex pattern
  const bodyGeo = makeSculptedEllipsoid(0.35, 0.33, 0.74, 32, 22, (x, y, z, nx, ny, nz) => {
    const chestBoost = nz > 0.25 ? 1.14 : nz < -0.25 ? 1.05 : 0.94;
    const spine = ny > 0.4 ? 0.045 : 0;
    return [x * chestBoost, y + spine, z];
  });
  paintVertices(bodyGeo, (x, y, z, _nx, ny, _nz, out) => {
    if (y < -0.15) {
      out.set("#fef3c7");
      return;
    }
    const cell = Math.abs(Math.sin(x * 13 + z * 4) * Math.cos(z * 11 - y * 6));
    if (cell > 0.62 && cell < 0.78) out.set("#1c1108");
    else if (cell >= 0.78) out.set("#92400e");
    else out.set("#e08b1f");
  });

  const body = b.addNode("Body", b.root, [0, 0.58, 0]);
  b.attachGeo(body, bodyGeo, coatMat);

  // Muscular Neck Bridge
  const neck = b.addNode("Neck", body, [0, 0.16, 0.54], [-0.4, 0, 0]);
  b.attachGeo(neck, makeSculptedEllipsoid(0.2, 0.2, 0.24, 16, 12), b.mat("neckAmber", { hex: "#e08b1f", roughness: 0.62 }));

  // Head group
  const head = b.addNode("Head", body, [0, 0.27, 0.72]);
  const skullGeo = makeSculptedEllipsoid(0.22, 0.21, 0.25, 24, 16, (x, y, z) => [
    x * (z > 0.08 ? 0.82 : 1.02),
    y * (z > 0.1 ? 0.92 : 1.0),
    z,
  ]);
  paintVertices(skullGeo, (x, y, z, _nx, _ny, _nz, out) => {
    if (z > 0.14 && y < 0.03) out.set("#fef3c7");
    else if (Math.abs(Math.sin(x * 22 + y * 20)) > 0.8) out.set("#29180a");
    else out.set("#e08b1f");
  });
  b.attachGeo(head, skullGeo, coatMat);

  // Muzzle & Nose
  const muzzle = b.addNode("Muzzle", head, [0, -0.04, 0.22]);
  b.attachGeo(muzzle, makeSculptedEllipsoid(0.13, 0.1, 0.13, 14, 10), b.mat("cream", { hex: "#fef3c7", roughness: 0.65 }));
  const nose = b.addNode("Nose", muzzle, [0, 0.05, 0.11]);
  b.attachGeo(nose, makeSculptedEllipsoid(0.05, 0.035, 0.035, 10, 8), noseMat);

  // Rounded feline ears
  for (const side of [-1, 1]) {
    const ear = b.addNode(`Ear_${side > 0 ? "R" : "L"}`, head, [side * 0.16, 0.18, -0.02], [0.2, 0, -side * 0.35]);
    b.attachGeo(ear, makeSculptedEllipsoid(0.065, 0.075, 0.035, 10, 8), darkMat);
  }
  addEyes(b, head, [[-0.1, 0.06, 0.2], [0.1, 0.06, 0.2]], 0.036, "#14532d");

  // 4 Sturdy Legs with paws
  const legCoords = [
    ["LegFL", -0.2, 0.3, 0.38],
    ["LegFR", 0.2, 0.3, 0.38],
    ["LegBL", -0.21, 0.3, -0.38],
    ["LegBR", 0.21, 0.3, -0.38],
  ];
  for (const [name, lx, ly, lz] of legCoords) {
    const leg = b.addNode(name, b.root, [lx, ly, lz]);
    const legGeo = makeTaperedTube(
      [new THREE.Vector3(0, 0.26, 0), new THREE.Vector3(0, 0.02, 0.02), new THREE.Vector3(0, -0.24, 0.04)],
      8,
      10,
      (t) => 0.11 - t * 0.035
    );
    paintVertices(legGeo, (x, y, _z, _nx, _ny, _nz, out) => {
      out.set(Math.sin(y * 28 + x * 22) > 0.7 ? "#451a03" : "#d97706");
    });
    b.attachGeo(leg, legGeo, coatMat);
    const paw = b.addNode(`${name}_Paw`, leg, [0, -0.25, 0.08]);
    b.attachGeo(paw, makeSculptedEllipsoid(0.085, 0.05, 0.11, 10, 8), b.mat("amber", { hex: "#d97706", roughness: 0.65 }));
  }

  // Curving Tail
  const tail = b.addNode("Tail", body, [0, 0.06, -0.68]);
  const tailGeo = makeTaperedTube(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.06, -0.18, -0.28),
      new THREE.Vector3(0.14, -0.1, -0.58),
      new THREE.Vector3(0.08, 0.12, -0.76),
    ],
    14,
    10,
    (t) => 0.065 * (1 - t * 0.45)
  );
  paintVertices(tailGeo, (_x, _y, z, _nx, _ny, _nz, out) => {
    out.set(Math.sin(z * 26) > 0.35 ? "#29180a" : "#f59e0b");
  });
  b.attachGeo(tail, tailGeo, coatMat);

  await b.save("jaguar.glb");
}

// =========================================================================
// 2. TOUCAN
// =========================================================================
async function buildToucan() {
  const b = new ModelBuilder("Toucan");
  const blackMat = b.mat("plumage", { hex: "#18181b", roughness: 0.55 });
  const bibMat = b.mat("bib", { hex: "#fde047", roughness: 0.6 });
  const beakMat = b.mat("beak", { hex: "#ffffff", roughness: 0.42 });
  const feetMat = b.mat("feet", { hex: "#64748b", roughness: 0.6 });

  const body = b.addNode("Body", b.root, [0, 0.52, 0], [-0.25, 0, 0]);
  b.attachGeo(body, makeSculptedEllipsoid(0.24, 0.34, 0.26, 20, 14), blackMat);

  const bib = b.addNode("Bib", body, [0, 0.12, 0.15]);
  b.attachGeo(bib, makeSculptedEllipsoid(0.17, 0.2, 0.14, 16, 12), bibMat);

  const head = b.addNode("Head", body, [0, 0.35, 0.08]);
  b.attachGeo(head, makeSculptedEllipsoid(0.18, 0.17, 0.19, 18, 14), blackMat);
  addEyes(b, head, [[-0.12, 0.04, 0.11], [0.12, 0.04, 0.11]], 0.036, "#0284c7");

  // Iconic curved giant Toco beak with vertex color gradient (yellow -> orange -> black tip)
  const beak = b.addNode("Beak", head, [0, 0.0, 0.14]);
  const beakGeo = makeTaperedTube(
    [
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0, 0.02, 0.24),
      new THREE.Vector3(0, -0.02, 0.46),
      new THREE.Vector3(0, -0.1, 0.6),
    ],
    14,
    12,
    (t) => Math.max(0.015, 0.115 * Math.sin((1 - t * 0.85) * Math.PI * 0.52))
  );
  paintVertices(beakGeo, (_x, y, z, _nx, _ny, _nz, out) => {
    if (z > 0.48) out.set("#111827");
    else if (y > 0.04 && z < 0.32) out.set("#facc15");
    else out.set("#f97316");
  });
  b.attachGeo(beak, beakGeo, beakMat);

  // Articulated Wings
  for (const side of [-1, 1]) {
    const wing = b.addNode(`Wing${side < 0 ? "L" : "R"}`, body, [side * 0.22, 0.04, -0.02], [0.1, 0, side * 0.15]);
    b.attachGeo(wing, makeSculptedEllipsoid(0.06, 0.27, 0.17, 14, 10), blackMat);
  }

  // Tail feathers
  const tail = b.addNode("Tail", body, [0, -0.26, -0.24], [0.7, 0, 0]);
  b.attachGeo(tail, makeLeafGeometry(0.45, 0.12, 0.04, 0.02), blackMat);

  // Perching Legs
  for (const side of [-1, 1]) {
    const leg = b.addNode(`Leg_${side < 0 ? "L" : "R"}`, b.root, [side * 0.1, 0.16, 0.04]);
    b.attachGeo(leg, new THREE.CylinderGeometry(0.024, 0.022, 0.3, 8), feetMat);
  }

  await b.save("toucan.glb");
}

// =========================================================================
// 3. SLOTH (hanging upside-down / perched hug pose)
// =========================================================================
async function buildSloth() {
  const b = new ModelBuilder("Sloth");
  const furMat = b.mat("slothFur", { hex: "#ffffff", roughness: 0.82 });
  const faceMat = b.mat("slothFace", { hex: "#fde68a", roughness: 0.72 });
  const clawMat = b.mat("claws", { hex: "#451a03", roughness: 0.45 });

  const body = b.addNode("Body", b.root, [0, -0.35, 0], [0, 0, 0]);
  const bodyGeo = makeSculptedEllipsoid(0.28, 0.24, 0.42, 20, 14);
  paintVertices(bodyGeo, (x, y, z, _nx, _ny, _nz, out) => {
    const moss = Math.sin(x * 14 + z * 10) * Math.cos(y * 12);
    out.set(moss > 0.38 ? "#65a30d" : "#92400e");
  });
  b.attachGeo(body, bodyGeo, furMat);

  const head = b.addNode("Head", body, [0, 0.02, 0.4]);
  b.attachGeo(head, makeSculptedEllipsoid(0.18, 0.17, 0.16, 18, 12), faceMat);

  // Cute eye masks
  for (const side of [-1, 1]) {
    const patch = b.addNode(`Mask_${side}`, head, [side * 0.075, 0.02, 0.12], [0, 0, side * 0.25]);
    b.attachGeo(patch, makeSculptedEllipsoid(0.055, 0.036, 0.03, 10, 8), clawMat);
  }
  addEyes(b, head, [[-0.075, 0.02, 0.14], [0.075, 0.02, 0.14]], 0.024, "#1c1917");

  // 4 Long hooking arms reaching upward to grasp a branch at y = 0
  const limbCoords = [
    ["ArmL", -0.22, 0.1, 0.22],
    ["ArmR", 0.22, 0.1, 0.22],
    ["LegL", -0.22, 0.1, -0.22],
    ["LegR", 0.22, 0.1, -0.22],
  ];
  for (const [name, lx, ly, lz] of limbCoords) {
    const limb = b.addNode(name, body, [lx, ly, lz]);
    const limbGeo = makeTaperedTube(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(lx > 0 ? 0.06 : -0.06, 0.2, 0),
        new THREE.Vector3(lx > 0 ? -0.14 : 0.14, 0.36, 0),
      ],
      10,
      8,
      (t) => 0.065 * (1 - t * 0.3)
    );
    paintVertices(limbGeo, (_x, _y, _z, _nx, _ny, _nz, out) => out.set("#78350f"));
    b.attachGeo(limb, limbGeo, furMat);

    // 3 Curved Claws
    for (let c = -1; c <= 1; c++) {
      const claw = b.addNode(`${name}_Claw${c}`, limb, [lx > 0 ? -0.14 : 0.14, 0.37, c * 0.028], [0, 0, lx > 0 ? 0.8 : -0.8]);
      b.attachGeo(claw, new THREE.ConeGeometry(0.015, 0.09, 6), clawMat);
    }
  }

  await b.save("sloth.glb");
}

// =========================================================================
// 4. ANACONDA (coiled sculptural serpent)
// =========================================================================
async function buildAnaconda() {
  const b = new ModelBuilder("Anaconda");
  const skinMat = b.mat("anacondaSkin", { hex: "#ffffff", roughness: 0.42, metalness: 0.08 });

  const pts = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 5.2;
    const radius = 0.72 * (1 - t * 0.58) + 0.15;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.12 + t * 0.34 + (t > 0.82 ? (t - 0.82) * 2.2 : 0);
    pts.push(new THREE.Vector3(x, y, z));
  }

  const coilGeo = makeTaperedTube(pts, 72, 12, (t) => {
    if (t < 0.12) return 0.03 + (t / 0.12) * 0.08;
    if (t > 0.92) return 0.11 - (t - 0.92) * 0.4;
    return 0.115 + Math.sin(t * Math.PI) * 0.035;
  });

  paintVertices(coilGeo, (x, y, z, _nx, _ny, _nz, out) => {
    if (y < 0.1) {
      out.set("#a3e635");
      return;
    }
    const spot = Math.sin(x * 11 + z * 11) * Math.cos(z * 14 - x * 9);
    out.set(spot > 0.45 ? "#14532d" : "#22c55e");
  });

  const body = b.addNode("Body", b.root, [0, 0, 0]);
  b.attachGeo(body, coilGeo, skinMat);

  const headPt = pts[pts.length - 1];
  const head = b.addNode("Head", b.root, [headPt.x, headPt.y + 0.02, headPt.z], [0.1, 0.4, 0]);
  const headGeo = makeSculptedEllipsoid(0.14, 0.09, 0.2, 14, 10);
  paintVertices(headGeo, (_x, _y, _z, _nx, _ny, _nz, out) => out.set("#16a34a"));
  b.attachGeo(head, headGeo, skinMat);
  addEyes(b, head, [[-0.08, 0.05, 0.08], [0.08, 0.05, 0.08]], 0.024, "#facc15");

  await b.save("anaconda.glb");
}

// =========================================================================
// 5. POISON DART FROG
// =========================================================================
async function buildPoisonDartFrog() {
  const b = new ModelBuilder("PoisonDartFrog");
  const skinMat = b.mat("frogSkin", { hex: "#ffffff", roughness: 0.28, metalness: 0.06 });

  const body = b.addNode("Body", b.root, [0, 0.2, 0], [-0.22, 0, 0]);
  const bodyGeo = makeSculptedEllipsoid(0.24, 0.17, 0.3, 20, 14);
  paintVertices(bodyGeo, (x, y, z, _nx, _ny, _nz, out) => {
    const spot = Math.sin(x * 24 + z * 18) * Math.cos(z * 22);
    if (spot > 0.56) out.set("#0f172a");
    else if (y > 0.03) out.set("#facc15");
    else out.set("#2563eb");
  });
  b.attachGeo(body, bodyGeo, skinMat);

  const head = b.addNode("Head", body, [0, 0.07, 0.22]);
  const headGeo = makeSculptedEllipsoid(0.19, 0.13, 0.17, 16, 12);
  paintVertices(headGeo, (x, y, _z, _nx, _ny, _nz, out) => {
    out.set(y > 0.01 ? "#facc15" : "#2563eb");
    if (Math.abs(x) < 0.06 && y > 0.05) out.set("#0f172a");
  });
  b.attachGeo(head, headGeo, skinMat);
  addEyes(b, head, [[-0.12, 0.08, 0.08], [0.12, 0.08, 0.08]], 0.044, "#0f172a");

  // Folded back hind legs & propped front arms
  const blueMat = b.mat("frogBlue", { hex: "#1d4ed8", roughness: 0.3 });
  for (const side of [-1, 1]) {
    const hind = b.addNode(`HindLeg_${side}`, b.root, [side * 0.22, 0.12, -0.16], [0.2, side * 0.4, 0]);
    b.attachGeo(hind, makeSculptedEllipsoid(0.08, 0.1, 0.18, 12, 8), blueMat);
    const front = b.addNode(`FrontArm_${side}`, b.root, [side * 0.18, 0.12, 0.18], [-0.4, 0, side * 0.2]);
    b.attachGeo(front, makeTaperedTube([new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0, -0.09, 0.06)], 6, 8, () => 0.042), blueMat);
  }

  await b.save("poison-dart-frog.glb");
}

// =========================================================================
// 6. CAPYBARA
// =========================================================================
async function buildCapybara() {
  const b = new ModelBuilder("Capybara");
  const furMat = b.mat("capyFur", { hex: "#9a5b25", roughness: 0.85 });
  const darkMat = b.mat("capyDark", { hex: "#451a03", roughness: 0.7 });

  const body = b.addNode("Body", b.root, [0, 0.45, 0]);
  b.attachGeo(body, makeSculptedEllipsoid(0.35, 0.33, 0.56, 22, 16), furMat);

  // Characteristic boxy snout head
  const head = b.addNode("Head", body, [0, 0.22, 0.52]);
  const headGeo = makeSculptedEllipsoid(0.21, 0.2, 0.27, 18, 14, (x, y, z) => [
    x * 0.92,
    y * (z > 0.05 ? 0.94 : 1.0),
    z * 1.05,
  ]);
  b.attachGeo(head, headGeo, furMat);

  for (const side of [-1, 1]) {
    const ear = b.addNode(`Ear_${side}`, head, [side * 0.14, 0.17, -0.08], [0, 0, -side * 0.25]);
    b.attachGeo(ear, makeSculptedEllipsoid(0.045, 0.065, 0.035, 10, 8), darkMat);
  }
  addEyes(b, head, [[-0.14, 0.07, 0.09], [0.14, 0.07, 0.09]], 0.03, "#1c1917");
  const nose = b.addNode("Nose", head, [0, 0.02, 0.26]);
  b.attachGeo(nose, makeSculptedEllipsoid(0.07, 0.045, 0.035, 10, 8), darkMat);

  const legs = [
    ["LegFL", -0.2, 0.18, 0.3],
    ["LegFR", 0.2, 0.18, 0.3],
    ["LegBL", -0.21, 0.18, -0.32],
    ["LegBR", 0.21, 0.18, -0.32],
  ];
  for (const [name, lx, ly, lz] of legs) {
    const leg = b.addNode(name, b.root, [lx, ly, lz]);
    b.attachGeo(leg, new THREE.CylinderGeometry(0.08, 0.065, 0.36, 10), darkMat);
  }

  await b.save("capybara.glb");
}

// =========================================================================
// 7. SCARLET MACAW
// =========================================================================
async function buildMacaw() {
  const b = new ModelBuilder("ScarletMacaw");
  const redMat = b.mat("macawRed", { hex: "#dc2626", roughness: 0.55 });
  const wingMat = b.mat("macawWing", { hex: "#ffffff", roughness: 0.5 });
  const faceMat = b.mat("macawFace", { hex: "#fef2f2", roughness: 0.65 });
  const beakTopMat = b.mat("beakTop", { hex: "#fef3c7", roughness: 0.35 });
  const beakLowMat = b.mat("beakLow", { hex: "#1e293b", roughness: 0.45 });
  const blueMat = b.mat("macawBlue", { hex: "#2563eb", roughness: 0.52 });

  const body = b.addNode("Body", b.root, [0, 0.54, 0], [-0.28, 0, 0]);
  b.attachGeo(body, makeSculptedEllipsoid(0.2, 0.34, 0.22, 18, 14), redMat);

  const head = b.addNode("Head", body, [0, 0.34, 0.06]);
  b.attachGeo(head, makeSculptedEllipsoid(0.16, 0.17, 0.18, 16, 12), redMat);

  for (const side of [-1, 1]) {
    const cheek = b.addNode(`Cheek_${side}`, head, [side * 0.09, 0.01, 0.09]);
    b.attachGeo(cheek, makeSculptedEllipsoid(0.07, 0.06, 0.07, 10, 8), faceMat);
  }
  addEyes(b, head, [[-0.12, 0.03, 0.11], [0.12, 0.03, 0.11]], 0.025, "#0f172a");

  // Hooked parrot beak
  const beakTop = b.addNode("Beak", head, [0, 0.0, 0.16]);
  const hookGeo = makeTaperedTube(
    [new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(0, 0.03, 0.11), new THREE.Vector3(0, -0.07, 0.15)],
    8,
    10,
    (t) => 0.075 * (1 - t * 0.78)
  );
  b.attachGeo(beakTop, hookGeo, beakTopMat);
  const beakLow = b.addNode("BeakLower", head, [0, -0.04, 0.14]);
  b.attachGeo(beakLow, makeSculptedEllipsoid(0.05, 0.04, 0.07, 10, 8), beakLowMat);

  // Tricolor wings (red shoulder, yellow middle, blue flight tips)
  for (const side of [-1, 1]) {
    const wing = b.addNode(`Wing${side < 0 ? "L" : "R"}`, body, [side * 0.19, 0.03, -0.02], [0.15, 0, side * 0.14]);
    const wGeo = makeSculptedEllipsoid(0.055, 0.3, 0.16, 14, 12);
    paintVertices(wGeo, (_x, y, _z, _nx, _ny, _nz, out) => {
      if (y > 0.1) out.set("#dc2626");
      else if (y > -0.06) out.set("#facc15");
      else out.set("#2563eb");
    });
    b.attachGeo(wing, wGeo, wingMat);
  }

  // Long sweeping tail plume
  const tail = b.addNode("Tail", body, [0, -0.28, -0.18], [0.65, 0, 0]);
  b.attachGeo(tail, makeLeafGeometry(0.72, 0.11, 0.03, 0.01), blueMat);

  await b.save("macaw.glb");
}

// =========================================================================
// 8. TAPIR
// =========================================================================
async function buildTapir() {
  const b = new ModelBuilder("Tapir");
  const coatMat = b.mat("tapirCoat", { hex: "#57534e", roughness: 0.78 });
  const saddleMat = b.mat("tapirBelly", { hex: "#78716c", roughness: 0.8 });
  const darkMat = b.mat("tapirDark", { hex: "#292524", roughness: 0.75 });
  const whiteMat = b.mat("tapirWhite", { hex: "#f5f5f4", roughness: 0.65 });

  const body = b.addNode("Body", b.root, [0, 0.52, 0]);
  b.attachGeo(body, makeSculptedEllipsoid(0.36, 0.34, 0.66, 22, 16), saddleMat);

  // Neck + Head + Prehensile Short Trunk
  const head = b.addNode("Head", body, [0, 0.16, 0.62]);
  b.attachGeo(head, makeSculptedEllipsoid(0.2, 0.21, 0.3, 18, 14), coatMat);

  const trunk = b.addNode("Trunk", head, [0, -0.02, 0.24]);
  const trunkGeo = makeTaperedTube(
    [new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, -0.04, 0.14), new THREE.Vector3(0, -0.14, 0.18)],
    10,
    10,
    (t) => 0.085 * (1 - t * 0.45)
  );
  b.attachGeo(trunk, trunkGeo, darkMat);

  // White-tipped rounded ears
  for (const side of [-1, 1]) {
    const ear = b.addNode(`Ear_${side}`, head, [side * 0.13, 0.21, -0.08]);
    b.attachGeo(ear, makeSculptedEllipsoid(0.055, 0.075, 0.035, 10, 8), darkMat);
    const tip = b.addNode(`EarTip_${side}`, ear, [0, 0.055, 0]);
    b.attachGeo(tip, makeSculptedEllipsoid(0.042, 0.025, 0.03, 8, 6), whiteMat);
  }
  addEyes(b, head, [[-0.14, 0.05, 0.1], [0.14, 0.05, 0.1]], 0.028, "#0f172a");

  const legs = [
    ["LegFL", -0.2, 0.22, 0.36],
    ["LegFR", 0.2, 0.22, 0.36],
    ["LegBL", -0.21, 0.22, -0.38],
    ["LegBR", 0.21, 0.22, -0.38],
  ];
  for (const [name, lx, ly, lz] of legs) {
    const leg = b.addNode(name, b.root, [lx, ly, lz]);
    b.attachGeo(leg, new THREE.CylinderGeometry(0.095, 0.075, 0.44, 10), darkMat);
  }

  await b.save("tapir.glb");
}

// =========================================================================
// 9. KAPOK TREE (Ceiba pentandra with massive fluted buttress roots)
// =========================================================================
async function buildKapokTree() {
  const b = new ModelBuilder("KapokTree");
  const barkMat = b.mat("bark", { hex: "#78350f", roughness: 0.9 });
  const leafMat = b.mat("canopyLeaf", { hex: "#ffffff", roughness: 0.72 });

  // Tall emergent trunk
  const trunk = b.addNode("Trunk", b.root, [0, 0, 0]);
  const trunkGeo = makeTaperedTube(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.08, 2.2, -0.05),
      new THREE.Vector3(-0.06, 4.6, 0.08),
      new THREE.Vector3(0, 6.8, 0),
    ],
    18,
    14,
    (t) => 0.62 - t * 0.32
  );
  b.attachGeo(trunk, trunkGeo, barkMat);

  // 5 Sweeping Buttress Roots
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const buttress = b.addNode(`Buttress_${i}`, b.root, [0, 0, 0], [0, ang, 0]);
    const buttGeo = makeTaperedTube(
      [new THREE.Vector3(0.28, 2.2, 0), new THREE.Vector3(0.75, 0.85, 0), new THREE.Vector3(1.55, 0.0, 0)],
      10,
      8,
      (t) => 0.22 * (1 - t * 0.45)
    );
    b.attachGeo(buttress, buttGeo, barkMat);
  }

  // Canopy spreading limbs + smooth overlapping leaf clusters
  const canopy = b.addNode("Fronds", b.root, [0, 6.4, 0]);
  const crowns = [
    [0, 1.15, 0, 2.5, 1.15, 2.4],
    [-1.95, 0.35, 1.05, 1.85, 0.92, 1.75],
    [2.05, 0.45, 0.85, 1.9, 0.98, 1.75],
    [0.35, 0.55, -1.95, 1.95, 0.96, 1.85],
    [-1.35, 0.15, -1.45, 1.6, 0.84, 1.6],
    [1.4, 0.85, -1.2, 1.5, 0.8, 1.5],
    [-0.9, 1.35, 0.7, 1.45, 0.75, 1.45],
  ];
  for (let i = 0; i < crowns.length; i++) {
    const [cx, cy, cz, rx, ry, rz] = crowns[i];
    const cluster = b.addNode(`Crown_${i}`, canopy, [cx, cy, cz]);
    const cGeo = makeSculptedEllipsoid(rx, ry, rz, 24, 16, (x, y, z) => [
      x * (1 + 0.12 * Math.sin(z * 2.3 + i)),
      y * (1 + 0.1 * Math.cos(x * 2.2)),
      z * (1 + 0.12 * Math.sin(y * 2.9)),
    ]);
    paintVertices(cGeo, (_x, y, _z, _nx, ny, _nz, out) => {
      out.set(ny > 0.22 || y > 0.32 ? "#388e3c" : "#1b5e20");
    });
    b.attachGeo(cluster, cGeo, leafMat);
  }

  await b.save("kapok-tree.glb");
}

// =========================================================================
// 10. AMAZON WATER LILY (Victoria amazonica)
// =========================================================================
async function buildWaterLily() {
  const b = new ModelBuilder("AmazonWaterLily");
  const padMat = b.mat("lilyPad", { hex: "#ffffff", roughness: 0.5, doubleSided: true });
  const petalMat = b.mat("lotusPetal", { hex: "#f9a8d4", roughness: 0.4, doubleSided: true });
  const centerMat = b.mat("lotusCenter", { hex: "#fde047", roughness: 0.45 });

  // Scalloped giant rimmed tray using LatheGeometry
  const profile = [
    new THREE.Vector2(0.0, 0.02),
    new THREE.Vector2(0.55, 0.025),
    new THREE.Vector2(1.05, 0.03),
    new THREE.Vector2(1.12, 0.18),
    new THREE.Vector2(1.16, 0.17),
    new THREE.Vector2(1.1, 0.0),
    new THREE.Vector2(0.0, 0.0),
  ];
  const padGeo = new THREE.LatheGeometry(profile, 44);
  paintVertices(padGeo, (x, y, z, _nx, _ny, _nz, out) => {
    const r = Math.hypot(x, z);
    const angle = Math.atan2(z, x);
    const rib = Math.abs(Math.sin(angle * 12));
    if (y > 0.08 && r > 1.12) out.set("#991b1b");
    else if (y > 0.08) out.set("#1b5e20");
    else if (rib > 0.9 && r > 0.12) out.set("#a7f3d0");
    else out.set("#2e7d32");
  });
  const pad = b.addNode("Pad", b.root, [0, 0, 0]);
  b.attachGeo(pad, padGeo, padMat);

  // Blooming multi-petal flower
  const blossom = b.addNode("Blossom", b.root, [0.28, 0.05, 0.22]);
  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 8 : 6;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + ring * 0.35;
      const petal = b.addNode(`Petal_${ring}_${i}`, blossom, [0, 0, 0], [ring === 0 ? -0.55 : -0.95, ang, 0]);
      b.attachGeo(petal, makeLeafGeometry(0.24 - ring * 0.05, 0.075, 0.06, 0.02), petalMat);
    }
  }
  const core = b.addNode("FlowerCore", blossom, [0, 0.06, 0]);
  b.attachGeo(core, new THREE.SphereGeometry(0.065, 10, 8), centerMat);

  await b.save("water-lily.glb");
}

// =========================================================================
// 11. BROMELIAD
// =========================================================================
async function buildBromeliad() {
  const b = new ModelBuilder("Bromeliad");
  const leafMat = b.mat("bromLeaf", { hex: "#16a34a", roughness: 0.45, doubleSided: true });
  const bractMat = b.mat("bromBract", { hex: "#e11d48", roughness: 0.4, doubleSided: true });
  const cupMat = b.mat("bromWater", { hex: "#38bdf8", roughness: 0.15 });

  const rosette = b.addNode("Fronds", b.root, [0, 0, 0]);
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const leaf = b.addNode(`OuterLeaf_${i}`, rosette, [0, 0.08, 0], [-0.45 - (i % 2) * 0.15, ang, 0]);
    b.attachGeo(leaf, makeLeafGeometry(0.68, 0.14, 0.16, 0.04), leafMat);
  }
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + 0.2;
    const bract = b.addNode(`Bract_${i}`, rosette, [0, 0.16, 0], [-0.95, ang, 0]);
    b.attachGeo(bract, makeLeafGeometry(0.42, 0.1, 0.09, 0.025), bractMat);
  }
  // Tiny rainwater pool inside the rosette funnel
  const water = b.addNode("WaterPool", rosette, [0, 0.18, 0]);
  b.attachGeo(water, new THREE.CylinderGeometry(0.12, 0.08, 0.03, 14), cupMat);

  await b.save("bromeliad.glb");
}

// =========================================================================
// 12. HELICONIA
// =========================================================================
async function buildHeliconia() {
  const b = new ModelBuilder("Heliconia");
  const stemMat = b.mat("stem", { hex: "#65a30d", roughness: 0.65 });
  const leafMat = b.mat("heliLeaf", { hex: "#15803d", roughness: 0.5, doubleSided: true });
  const bractMat = b.mat("heliBract", { hex: "#ffffff", roughness: 0.35 });

  const plant = b.addNode("Fronds", b.root, [0, 0, 0]);
  // Broad paddle leaves
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.4;
    const lNode = b.addNode(`Leaf_${i}`, plant, [0, 0.15, 0], [-0.85, ang, 0]);
    b.attachGeo(lNode, makeLeafGeometry(1.15, 0.24, 0.22, 0.04), leafMat);
  }

  // Tall flower stalk + alternating lobster-claw bracts
  const stalk = b.addNode("Stalk", plant, [0, 0, 0]);
  b.attachGeo(
    stalk,
    makeTaperedTube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0.75, 0), new THREE.Vector3(0.02, 1.45, 0)], 10, 8, () => 0.045),
    stemMat
  );

  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const claw = b.addNode(`Claw_${i}`, plant, [0.02, 0.75 + i * 0.12, 0], [0, side > 0 ? 0 : Math.PI, side * 0.25]);
    const clawGeo = makeSculptedEllipsoid(0.22, 0.07, 0.075, 14, 10, (x, y, z) => [
      x + 0.16,
      y + Math.sin((x + 0.22) * 5) * 0.04,
      z * (1 - Math.max(0, x) * 1.4),
    ]);
    paintVertices(clawGeo, (x, _y, _z, _nx, _ny, _nz, out) => {
      out.set(x > 0.26 ? "#facc15" : "#dc2626");
    });
    b.attachGeo(claw, clawGeo, bractMat);
  }

  await b.save("heliconia.glb");
}

// =========================================================================
// 13. GIANT FERN
// =========================================================================
async function buildGiantFern() {
  const b = new ModelBuilder("GiantFern");
  const trunkMat = b.mat("fernTrunk", { hex: "#78350f", roughness: 0.9 });
  const frondMat = b.mat("fernFrond", { hex: "#ffffff", roughness: 0.62, doubleSided: true });

  const base = b.addNode("Trunk", b.root, [0, 0.25, 0]);
  b.attachGeo(base, new THREE.CylinderGeometry(0.14, 0.2, 0.55, 12), trunkMat);

  const fronds = b.addNode("Fronds", b.root, [0, 0.45, 0]);
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 2;
    const pitch = -0.45 - (i % 3) * 0.18;
    const fNode = b.addNode(`Frond_${i}`, fronds, [0, 0, 0], [pitch, ang, 0]);
    const fGeo = makeLeafGeometry(1.35, 0.34, 0.28, 0.06);
    paintVertices(fGeo, (x, _y, z, _nx, _ny, _nz, out) => {
      const pinna = Math.sin(z * 28);
      if (Math.abs(x) < 0.03) out.set("#65a30d");
      else out.set(pinna > 0 ? "#22c55e" : "#15803d");
    });
    b.attachGeo(fNode, fGeo, frondMat);
  }

  await b.save("giant-fern.glb");
}

await Promise.all([
  buildJaguar(),
  buildToucan(),
  buildSloth(),
  buildAnaconda(),
  buildPoisonDartFrog(),
  buildCapybara(),
  buildMacaw(),
  buildTapir(),
  buildKapokTree(),
  buildWaterLily(),
  buildBromeliad(),
  buildHeliconia(),
  buildGiantFern(),
]);

console.log("All 13 Meshopt-compressed GLB 3D models built successfully!");
