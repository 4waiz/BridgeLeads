import { extractDomain, generateLeadSummary } from "@/lib/utils";
import type { ParsedBusinessCard } from "@/types";

export interface EnrichmentResult {
  domain: string | null;
  summary: string;
  contact_methods: string[];
  enrichment_json: Record<string, unknown>;
}

export function enrichLead(
  parsed: ParsedBusinessCard,
  overrides?: Record<string, string>
): EnrichmentResult {
  const email = overrides?.email || parsed.email.value;
  const website = overrides?.website || parsed.website.value;
  const phone = overrides?.phone || parsed.phone.value;
  const company = overrides?.company || parsed.company.value;
  const jobTitle = overrides?.job_title || parsed.job_title.value;
  const fullName = overrides?.full_name || parsed.full_name.value;

  // Domain normalization
  let domain: string | null = null;
  if (website) {
    domain = extractDomain(website);
  }
  if (!domain && email) {
    domain = extractDomain(email);
  }

  // Contact method summary
  const contactMethods: string[] = [];
  if (email) contactMethods.push("email");
  if (phone) contactMethods.push("phone");
  if (website) contactMethods.push("website");

  // Summary generation
  const summary = generateLeadSummary({
    full_name: fullName,
    job_title: jobTitle,
    company,
    email,
    phone,
    domain,
  });

  const enrichment_json: Record<string, unknown> = {
    domain,
    contact_methods: contactMethods,
    has_email: !!email,
    has_phone: !!phone,
    has_website: !!website,
    domain_source: website ? "website" : email ? "email" : null,
  };

  return {
    domain,
    summary,
    contact_methods: contactMethods,
    enrichment_json,
  };
}

// Hook for future external enrichment provider
export interface ExternalEnrichmentProvider {
  name: string;
  enrich(domain: string): Promise<Record<string, unknown>>;
}

export async function enrichWithExternal(
  domain: string,
  _provider?: ExternalEnrichmentProvider
): Promise<Record<string, unknown> | null> {
  // Placeholder for future enrichment APIs (Clearbit, Apollo, etc.)
  // When an API key is configured, implement the provider and call it here.
  if (!_provider) return null;

  try {
    return await _provider.enrich(domain);
  } catch (error) {
    console.error("External enrichment failed:", error);
    return null;
  }
}
