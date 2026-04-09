"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@/types";

export async function createLead(data: {
  full_name: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  domain?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  status?: LeadStatus;
  summary?: string;
  ocr_raw_text?: string;
  ocr_json?: Record<string, unknown>;
  enrichment_json?: Record<string, unknown>;
  duplicate_of?: string;
  tags?: string[];
  image_path?: string;
  image_name?: string;
  image_mime?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { tags, image_path, image_name, image_mime, ...leadData } = data;

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      user_id: user.id,
      ...leadData,
      status: leadData.status || "new",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Insert tags
  if (tags?.length) {
    await supabase.from("lead_tags").insert(
      tags.map((tag) => ({
        lead_id: lead.id,
        user_id: user.id,
        tag,
      }))
    );
  }

  // Insert attachment record
  if (image_path) {
    await supabase.from("lead_attachments").insert({
      lead_id: lead.id,
      user_id: user.id,
      storage_path: image_path,
      file_name: image_name || "business-card",
      mime_type: image_mime || "image/jpeg",
    });
  }

  // Log activity
  await supabase.from("lead_activity").insert({
    lead_id: lead.id,
    user_id: user.id,
    action: "created",
    metadata: { source: data.ocr_raw_text ? "business_card_scan" : "manual" },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { data: lead };
}

export async function updateLead(
  leadId: string,
  data: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    job_title?: string;
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
    domain?: string;
    address?: string;
    city?: string;
    country?: string;
    notes?: string;
    status?: LeadStatus;
    summary?: string;
    tags?: string[];
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { tags, ...leadData } = data;

  const { error } = await supabase
    .from("leads")
    .update(leadData)
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Update tags: delete old, insert new
  if (tags !== undefined) {
    await supabase
      .from("lead_tags")
      .delete()
      .eq("lead_id", leadId)
      .eq("user_id", user.id);

    if (tags.length > 0) {
      await supabase.from("lead_tags").insert(
        tags.map((tag) => ({
          lead_id: leadId,
          user_id: user.id,
          tag,
        }))
      );
    }
  }

  // Log activity
  await supabase.from("lead_activity").insert({
    lead_id: leadId,
    user_id: user.id,
    action: "updated",
    metadata: { fields: Object.keys(leadData) },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete storage files
  const { data: attachments } = await supabase
    .from("lead_attachments")
    .select("storage_path")
    .eq("lead_id", leadId);

  if (attachments?.length) {
    await supabase.storage
      .from("business-cards")
      .remove(attachments.map((a) => a.storage_path));
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function getLeads(params?: {
  search?: string;
  status?: LeadStatus | "all";
  sort?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  let query = supabase
    .from("leads")
    .select("*, lead_tags(*), lead_attachments(*)")
    .eq("user_id", user.id);

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params?.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,company.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    );
  }

  switch (params?.sort) {
    case "name":
      query = query.order("full_name", { ascending: true });
      break;
    case "company":
      query = query.order("company", { ascending: true });
      break;
    case "status":
      query = query.order("status", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return { error: error.message, data: [] };
  return { data: data || [] };
}

export async function getLead(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("leads")
    .select("*, lead_tags(*), lead_attachments(*)")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getLeadActivity(leadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_activity")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export async function getRecentLeads(limit = 5) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("leads")
    .select("id, full_name, company, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getLeadStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, new: 0, reviewed: 0, contacted: 0, qualified: 0, archived: 0 };

  const { data } = await supabase
    .from("leads")
    .select("status")
    .eq("user_id", user.id);

  const stats = { total: 0, new: 0, reviewed: 0, contacted: 0, qualified: 0, archived: 0 };
  if (data) {
    stats.total = data.length;
    data.forEach((lead) => {
      const s = lead.status as keyof typeof stats;
      if (s in stats) stats[s]++;
    });
  }

  return stats;
}
