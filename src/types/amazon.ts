export type SpeciesKind = "animal" | "plant";

export type SpeciesCategory =
  | "Mamalia"
  | "Burung"
  | "Reptil"
  | "Amfibi"
  | "Tumbuhan";

export type QuizQuestionType =
  | "multiple_choice"
  | "guess_image"
  | "plant_id"
  | "amazon_fact";

export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface SpeciesRecord {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  scientificName: string;
  kind: SpeciesKind;
  category: SpeciesCategory;
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
  position: Vector3Tuple;
  rotationY: number;
  scale: number;
  perchType?: "ground" | "water" | "stump" | "branch" | "boulder" | "log";
  animationStyle: "breathe" | "flap" | "sway" | "slither" | "hop" | "float";
}

export interface QuizOptionItem {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestionItem {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  hint: string;
  imageUrl?: string;
  relatedSpeciesSlug?: string;
  explanation: string;
  options: QuizOptionItem[];
}

export interface QuizDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  questions: QuizQuestionItem[];
}

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  badgeColor: string;
  requirementType: "discover_count" | "discover_all" | "quiz_score" | "quiz_complete";
  requirementValue: number;
}

export interface ExplorerProgressSnapshot {
  explorerId: string;
  explorerName: string;
  username?: string | null;
  avatarSlug: string;
  isRegistered: boolean;
  joinedAt?: string;
  bestQuizScore?: number;
  discoveredSlugs: string[];
  totalDiscoveries: number;
  quizAttempts: {
    id: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    createdAt: string;
  }[];
  unlockedAchievementCodes: string[];
  storageSource: "database" | "local";
}
