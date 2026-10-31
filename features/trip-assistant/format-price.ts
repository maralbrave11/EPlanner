import type { PriceRange } from "./types";

/** Formats an estimated range, e.g. "≈ $90 – $150 per night". Never a single number. */
export function formatPriceRange(price: PriceRange): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  });
  const range = `≈ ${fmt.format(price.min)} – ${fmt.format(price.max)}`;
  return price.unit ? `${range} ${price.unit}` : range;
}
