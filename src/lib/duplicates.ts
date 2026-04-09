import { createClient } from "@/lib/supabase/server";
import type { DuplicateWarning } from "@/types";

export async function findDuplicates(
  userId: string,
  fields: {
    email?: string;
    phone?: string;
    full_name?: string;
    company?: string;
  },
  excludeLeadId?: string
): Promise<DuplicateWarning[]> {
  const supabase = await createClient();
  const duplicates: DuplicateWarning[] = [];

  // Check by email (exact match)
  if (fields.email) {
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, company, email, phone")
      .eq("user_id", userId)
      .eq("email", fields.email)
      .neq("id", excludeLeadId || "00000000-0000-0000-0000-000000000000")
      .limit(3);

    if (data?.length) {
      data.forEach((lead) => {
        if (!duplicates.find((d) => d.lead_id === lead.id)) {
          duplicates.push({
            ...lead,
            lead_id: lead.id,
            similarity_reason: `Same email: ${fields.email}`,
          });
        }
      });
    }
  }

  // Check by phone (exact match)
  if (fields.phone) {
    const normalizedPhone = fields.phone.replace(/[^\d]/g, "");
    if (normalizedPhone.length >= 7) {
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, company, email, phone")
        .eq("user_id", userId)
        .neq("id", excludeLeadId || "00000000-0000-0000-0000-000000000000")
        .limit(10);

      if (data?.length) {
        data.forEach((lead) => {
          if (lead.phone) {
            const existingPhone = lead.phone.replace(/[^\d]/g, "");
            if (existingPhone === normalizedPhone && !duplicates.find((d) => d.lead_id === lead.id)) {
              duplicates.push({
                ...lead,
                lead_id: lead.id,
                similarity_reason: `Same phone: ${fields.phone}`,
              });
            }
          }
        });
      }
    }
  }

  // Check by company + name similarity
  if (fields.company && fields.full_name) {
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, company, email, phone")
      .eq("user_id", userId)
      .ilike("company", fields.company)
      .neq("id", excludeLeadId || "00000000-0000-0000-0000-000000000000")
      .limit(5);

    if (data?.length) {
      data.forEach((lead) => {
        if (
          lead.full_name &&
          fields.full_name &&
          lead.full_name.toLowerCase() === fields.full_name.toLowerCase() &&
          !duplicates.find((d) => d.lead_id === lead.id)
        ) {
          duplicates.push({
            ...lead,
            lead_id: lead.id,
            similarity_reason: `Same name and company: ${fields.full_name} at ${fields.company}`,
          });
        }
      });
    }
  }

  return duplicates;
}
