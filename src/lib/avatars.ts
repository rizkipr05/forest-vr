export const EXPLORER_AVATARS = [
  { slug: "jaguar", label: "Jaguar", imageUrl: "/images/animals/jaguar.jpg" },
  { slug: "toucan", label: "Burung Tukan", imageUrl: "/images/animals/toucan.jpg" },
  { slug: "macaw", label: "Makaw Merah", imageUrl: "/images/animals/macaw.jpg" },
  { slug: "sloth", label: "Kukang (Sloth)", imageUrl: "/images/animals/sloth.jpg" },
  { slug: "capybara", label: "Kapibara", imageUrl: "/images/animals/capybara.jpg" },
  { slug: "poison-dart-frog", label: "Katak Panah", imageUrl: "/images/animals/poison-dart-frog.jpg" },
] as const;

export function getAvatarImageUrl(avatarSlug?: string | null): string {
  const found = EXPLORER_AVATARS.find((a) => a.slug === avatarSlug);
  return found?.imageUrl ?? "/images/animals/jaguar.jpg";
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}
