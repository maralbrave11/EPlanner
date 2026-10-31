import type { LanguageCode } from "../languages";
import { ar } from "./ar";
import { en, type Messages } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";
import { ja } from "./ja";
import { mn } from "./mn";
import { pt } from "./pt";
import { ru } from "./ru";
import { zh } from "./zh";

// Record<LanguageCode, ...> makes TypeScript fail the build if a language is missing.
export const MESSAGES: Record<LanguageCode, Messages> = {
  en, mn, zh, hi, es, fr, ar, pt, ru, ja,
};

export type { MessageKey, Messages } from "./en";
