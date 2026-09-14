import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合并 Tailwind className（shadcn/ui 约定），避免样式冲突 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 数字格式化：12800 -> "1.3万"，9800 -> "9800" */
export function formatCount(n: number): string {
  if (n >= 10000) {
    const v = (n / 10000).toFixed(1);
    return `${v.endsWith(".0") ? v.slice(0, -2) : v}万`;
  }
  return String(n);
}
