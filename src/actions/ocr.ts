"use server";

import { createClient } from "@/lib/supabase/server";
import { getOCRProvider } from "@/lib/ocr";
import { enrichLead } from "@/lib/enrichment";
import { findDuplicates } from "@/lib/duplicates";
import type { ParsedBusinessCard, DuplicateWarning } from "@/types";

export async function processBusinessCard(formData: FormData): Promise<{
  parsed: ParsedBusinessCard | null;
  enrichment: { domain: string | null; summary: string; contact_methods: string[] } | null;
  duplicates: DuplicateWarning[];
  imagePath: string | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { parsed: null, enrichment: null, duplicates: [], imagePath: null, error: "Not authenticated" };
    }

    const file = formData.get("image") as File;
    if (!file || file.size === 0) {
      return { parsed: null, enrichment: null, duplicates: [], imagePath: null, error: "No image provided" };
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";

    // Upload to temporary storage
    const tempId = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${user.id}/${tempId}/card.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("business-cards")
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { parsed: null, enrichment: null, duplicates: [], imagePath: null, error: "Failed to upload image" };
    }

    // Run OCR
    const provider = getOCRProvider();
    const parsed = await provider.extractBusinessCard(buffer, mimeType);

    // Enrich
    const enrichment = enrichLead(parsed);

    // Find duplicates
    const duplicates = await findDuplicates(user.id, {
      email: parsed.email.value,
      phone: parsed.phone.value,
      full_name: parsed.full_name.value,
      company: parsed.company.value,
    });

    return {
      parsed,
      enrichment: {
        domain: enrichment.domain,
        summary: enrichment.summary,
        contact_methods: enrichment.contact_methods,
      },
      duplicates,
      imagePath: storagePath,
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    return {
      parsed: null,
      enrichment: null,
      duplicates: [],
      imagePath: null,
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
}
