import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza a probabilidade de uma etapa para o intervalo 0–1.
 * Tolera dados guardados como percentagem inteira (ex: 5, 15, 100) ou já como fração (0.05).
 */
export function normalizeProb(p: number | null | undefined): number {
  const v = p ?? 0
  return v > 1 ? v / 100 : v
}
