import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function extractDomain(input: string): string | null {
  if (!input) return null;
  try {
    if (input.includes("@")) {
      const domain = input.split("@")[1];
      if (domain && domain.includes(".")) return domain.toLowerCase();
    }
    let url = input;
    if (!url.startsWith("http")) url = `https://${url}`;
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[^\d+\-() ]/g, "").trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
}

export function generateLeadSummary(lead: {
  full_name?: string | null;
  job_title?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  domain?: string | null;
}): string {
  const parts: string[] = [];

  if (lead.job_title && lead.company) {
    parts.push(`${lead.job_title} at ${lead.company}`);
  } else if (lead.job_title) {
    parts.push(lead.job_title);
  } else if (lead.company) {
    parts.push(`Contact at ${lead.company}`);
  }

  const contactMethods: string[] = [];
  if (lead.email) contactMethods.push("direct email");
  if (lead.phone) contactMethods.push("phone number");
  if (lead.domain) contactMethods.push("company domain");

  if (contactMethods.length > 0) {
    parts.push(`with ${contactMethods.join(", ")} present`);
  }

  if (parts.length === 0) return "Business card contact.";
  return parts.join(" ") + ".";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
