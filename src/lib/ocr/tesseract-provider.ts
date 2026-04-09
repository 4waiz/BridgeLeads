import type { OCRProvider } from "./types";
import type { ParsedBusinessCard } from "@/types";
import { parseBusinessCardText } from "./parser";

export class TesseractProvider implements OCRProvider {
  name = "tesseract";

  async extractBusinessCard(imageBuffer: Buffer, _mimeType: string): Promise<ParsedBusinessCard> {
    const Tesseract = await import("tesseract.js");

    const worker = await Tesseract.createWorker("eng");
    try {
      const { data } = await worker.recognize(imageBuffer);
      const rawText = data.text;
      return parseBusinessCardText(rawText);
    } finally {
      await worker.terminate();
    }
  }
}
