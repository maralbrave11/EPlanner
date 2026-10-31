import type { PriceRange } from "./types";

/**
 * Formats an estimated range, e.g. "≈ $90 – $150 per night". Never a single number.
 * `locale` is a BCP 47 tag (e.g. "mn-MN") used for number and currency formatting.
 */
export function formatPriceRange(price: PriceRange, locale = "en-US"): string {
  let fmt: Intl.NumberFormat;
  try {
    fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: price.currency,
      maximumFractionDigits: 0,
    });
  } catch {
    // Unknown currency code from the AI: show the plain numbers with the code.
    fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const range = `≈ ${fmt.format(price.min)} – ${fmt.format(price.max)} ${price.currency}`;
    return price.unit ? `${range} ${price.unit}` : range;
  }
  const range = `≈ ${fmt.format(price.min)} – ${fmt.format(price.max)}`;
  return price.unit ? `${range} ${price.unit}` : range;
}
