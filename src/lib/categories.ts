import {
  Book,
  Cpu,
  Bike,
  Lamp,
  Dumbbell,
  Gamepad2,
  Music,
  Package,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "books"
  | "notes"
  | "electronics"
  | "transport"
  | "hostel"
  | "sports"
  | "gaming"
  | "music"
  | "other";

export const CATEGORIES: { key: CategoryKey; label: string; icon: LucideIcon }[] = [
  { key: "books", label: "Books", icon: Book },
  { key: "notes", label: "Notes", icon: NotebookPen },
  { key: "electronics", label: "Electronics", icon: Cpu },
  { key: "transport", label: "Transport", icon: Bike },
  { key: "hostel", label: "Hostel", icon: Lamp },
  { key: "sports", label: "Sports", icon: Dumbbell },
  { key: "gaming", label: "Gaming", icon: Gamepad2 },
  { key: "music", label: "Music", icon: Music },
  { key: "other", label: "Other", icon: Package },
];

export const CONDITIONS = [
  { key: "new", label: "New" },
  { key: "like_new", label: "Like new" },
  { key: "good", label: "Good" },
  { key: "fair", label: "Fair" },
  { key: "poor", label: "Poor" },
] as const;

export const conditionLabel = (c: string) =>
  CONDITIONS.find((x) => x.key === c)?.label ?? c;

export const categoryLabel = (c: string) =>
  CATEGORIES.find((x) => x.key === c)?.label ?? c;
