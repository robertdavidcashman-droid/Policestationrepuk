import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export const BROCHURE_FILENAME = "police-station-agent-kent-brochure.pdf";
export const BROCHURE_PUBLIC_PATH = resolve(
  process.cwd(),
  "public/outreach",
  BROCHURE_FILENAME
);

export interface BrochureAttachment {
  filename: string;
  content: string;
}

/** Load pre-built brochure PDF as base64 for Resend attachment. */
export function loadBrochureAttachment(): BrochureAttachment | null {
  if (!existsSync(BROCHURE_PUBLIC_PATH)) {
    console.warn("[firm-outreach] Brochure PDF missing:", BROCHURE_PUBLIC_PATH);
    return null;
  }
  const buffer = readFileSync(BROCHURE_PUBLIC_PATH);
  return {
    filename: BROCHURE_FILENAME,
    content: buffer.toString("base64"),
  };
}
