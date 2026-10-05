import { Leaf, Recycle, Trash2, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Category } from "./types";

export const CATEGORY: Record<Category, { label: string; bin: string; Icon: LucideIcon }> = {
  recycling: { label: "Recycling", bin: "Recycling bin", Icon: Recycle },
  compost: { label: "Compost", bin: "Compost bin", Icon: Leaf },
  trash: { label: "Trash", bin: "Trash bin", Icon: Trash2 },
  special: { label: "Special", bin: "Don't bin it", Icon: TriangleAlert },
};
