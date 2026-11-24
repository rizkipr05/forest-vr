import { AMAZON_SPECIES, getAnimals, getPlants, getSpeciesBySlug } from "@/data/species";
import { getPrisma } from "@/lib/prisma";
import type { SpeciesCategory, SpeciesKind, SpeciesRecord } from "@/types/amazon";

function mapDbRowToSpecies(
  row: {
    id: string;
    slug: string;
    name: string;
    englishName: string;
    scientificName: string;
    category: string;
    shortDescription: string;
    description: string;
    habitat: string;
    dietOrRole: string;
    conservationStatus: string;
    funFacts: string[];
    narrationText: string;
    imageUrl: string;
    modelUrl: string;
    audioUrl: string;
    accentColor: string;
    zone: string;
    posX: number;
    posY: number;
    posZ: number;
    rotationY: number;
    scale: number;
    perchType: string | null;
    animationStyle: string;
  },
  kind: SpeciesKind
): SpeciesRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    englishName: row.englishName,
    scientificName: row.scientificName,
    kind,
    category: row.category as SpeciesCategory,
    shortDescription: row.shortDescription,
    description: row.description,
    habitat: row.habitat,
    dietOrRole: row.dietOrRole,
    conservationStatus: row.conservationStatus,
    funFacts: row.funFacts,
    narrationText: row.narrationText,
    imageUrl: row.imageUrl,
    modelUrl: row.modelUrl,
    audioUrl: row.audioUrl,
    accentColor: row.accentColor,
    zone: row.zone,
    position: { x: row.posX, y: row.posY, z: row.posZ },
    rotationY: row.rotationY,
    scale: row.scale,
    perchType: (row.perchType as SpeciesRecord["perchType"]) || "ground",
    animationStyle: row.animationStyle as SpeciesRecord["animationStyle"],
  };
}

export async function listAnimals(): Promise<{ items: SpeciesRecord[]; source: "database" | "seed" }> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.animal.findMany({ orderBy: { name: "asc" } });
      if (rows.length > 0) {
        return {
          items: rows.map((r) => mapDbRowToSpecies(r, "animal")),
          source: "database",
        };
      }
    } catch {
      // Fall back safely to static seed data
    }
  }
  return { items: getAnimals(), source: "seed" };
}

export async function listPlants(): Promise<{ items: SpeciesRecord[]; source: "database" | "seed" }> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.plant.findMany({ orderBy: { name: "asc" } });
      if (rows.length > 0) {
        return {
          items: rows.map((r) => mapDbRowToSpecies(r, "plant")),
          source: "database",
        };
      }
    } catch {
      // Fall back safely to static seed data
    }
  }
  return { items: getPlants(), source: "seed" };
}

export async function listAllSpecies(): Promise<SpeciesRecord[]> {
  const [animalsRes, plantsRes] = await Promise.all([listAnimals(), listPlants()]);
  if (animalsRes.items.length + plantsRes.items.length === 0) {
    return AMAZON_SPECIES;
  }
  return [...animalsRes.items, ...plantsRes.items];
}

export async function findSpeciesBySlug(slug: string): Promise<SpeciesRecord | null> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const animal = await prisma.animal.findUnique({ where: { slug } });
      if (animal) return mapDbRowToSpecies(animal, "animal");

      const plant = await prisma.plant.findUnique({ where: { slug } });
      if (plant) return mapDbRowToSpecies(plant, "plant");
    } catch {
      // Fall back safely to seed data
    }
  }
  return getSpeciesBySlug(slug) ?? null;
}
