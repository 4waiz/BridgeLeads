import type { ParsedBusinessCard } from "@/types";

export interface OCRProvider {
  name: string;
  extractBusinessCard(imageBuffer: Buffer, mimeType: string): Promise<ParsedBusinessCard>;
}
