import type { OCRProvider } from "./types";
import { TesseractProvider } from "./tesseract-provider";
import { VisionProvider } from "./vision-provider";

export function getOCRProvider(): OCRProvider {
  const provider = process.env.OCR_PROVIDER || "tesseract";

  if (provider === "vision" || provider === "openai" || provider === "anthropic") {
    try {
      return new VisionProvider();
    } catch {
      console.warn("Vision provider not available, falling back to Tesseract");
      return new TesseractProvider();
    }
  }

  // Check if any vision API key is available even when set to tesseract
  if (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      return new VisionProvider();
    } catch {
      // Fall through to Tesseract
    }
  }

  return new TesseractProvider();
}

export { parseBusinessCardText } from "./parser";
export type { OCRProvider } from "./types";
