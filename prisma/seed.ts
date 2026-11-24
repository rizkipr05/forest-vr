import { PrismaClient } from "@prisma/client";
import { AMAZON_SPECIES } from "../src/data/species";
import { AMAZON_ACHIEVEMENTS, AMAZON_QUIZ } from "../src/data/quizzes";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Amazon Rainforest Explorer database...");

  for (const sp of AMAZON_SPECIES) {
    const commonData = {
      slug: sp.slug,
      name: sp.name,
      englishName: sp.englishName,
      scientificName: sp.scientificName,
      category: sp.category,
      shortDescription: sp.shortDescription,
      description: sp.description,
      habitat: sp.habitat,
      dietOrRole: sp.dietOrRole,
      conservationStatus: sp.conservationStatus,
      funFacts: sp.funFacts,
      narrationText: sp.narrationText,
      imageUrl: sp.imageUrl,
      modelUrl: sp.modelUrl,
      audioUrl: sp.audioUrl,
      accentColor: sp.accentColor,
      zone: sp.zone,
      posX: sp.position.x,
      posY: sp.position.y,
      posZ: sp.position.z,
      rotationY: sp.rotationY,
      scale: sp.scale,
      perchType: sp.perchType ?? "ground",
      animationStyle: sp.animationStyle,
    };

    if (sp.kind === "animal") {
      await prisma.animal.upsert({
        where: { slug: sp.slug },
        update: commonData,
        create: { id: sp.id, ...commonData },
      });
    } else {
      await prisma.plant.upsert({
        where: { slug: sp.slug },
        update: commonData,
        create: { id: sp.id, ...commonData },
      });
    }
  }

  await prisma.quiz.upsert({
    where: { slug: AMAZON_QUIZ.slug },
    update: {
      title: AMAZON_QUIZ.title,
      description: AMAZON_QUIZ.description,
    },
    create: {
      id: AMAZON_QUIZ.id,
      slug: AMAZON_QUIZ.slug,
      title: AMAZON_QUIZ.title,
      description: AMAZON_QUIZ.description,
    },
  });

  for (let qi = 0; qi < AMAZON_QUIZ.questions.length; qi++) {
    const q = AMAZON_QUIZ.questions[qi];
    await prisma.quizQuestion.upsert({
      where: { id: q.id },
      update: {
        quizId: AMAZON_QUIZ.id,
        type: q.type,
        prompt: q.prompt,
        hint: q.hint,
        imageUrl: q.imageUrl ?? null,
        relatedSpeciesSlug: q.relatedSpeciesSlug ?? null,
        explanation: q.explanation,
        orderIndex: qi,
      },
      create: {
        id: q.id,
        quizId: AMAZON_QUIZ.id,
        type: q.type,
        prompt: q.prompt,
        hint: q.hint,
        imageUrl: q.imageUrl ?? null,
        relatedSpeciesSlug: q.relatedSpeciesSlug ?? null,
        explanation: q.explanation,
        orderIndex: qi,
      },
    });

    for (let oi = 0; oi < q.options.length; oi++) {
      const opt = q.options[oi];
      await prisma.quizOption.upsert({
        where: { id: opt.id },
        update: {
          questionId: q.id,
          label: opt.label,
          isCorrect: opt.isCorrect,
          orderIndex: oi,
        },
        create: {
          id: opt.id,
          questionId: q.id,
          label: opt.label,
          isCorrect: opt.isCorrect,
          orderIndex: oi,
        },
      });
    }
  }

  for (const ach of AMAZON_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {
        title: ach.title,
        description: ach.description,
        iconName: ach.iconName,
        badgeColor: ach.badgeColor,
        requirementType: ach.requirementType,
        requirementValue: ach.requirementValue,
      },
      create: {
        id: ach.id,
        code: ach.code,
        title: ach.title,
        description: ach.description,
        iconName: ach.iconName,
        badgeColor: ach.badgeColor,
        requirementType: ach.requirementType,
        requirementValue: ach.requirementValue,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
