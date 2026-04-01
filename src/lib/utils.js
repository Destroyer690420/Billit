import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFinancialYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)

  // If month is April or later, FY is currentYear-(currentYear+1)
  // If month is Jan-Mar, FY is (currentYear-1)-currentYear
  const startYear = month >= 3 ? year : year - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  
  return `${startYear}-${endYear}`;
}

export function getShortFinancialYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();

  const startYear = month >= 3 ? year : year - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  const shortStartYear = startYear.toString().slice(-2);
  
  return `${shortStartYear}${endYear}`;
}
