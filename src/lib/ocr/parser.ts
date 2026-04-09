import type { ParsedBusinessCard, ParsedField } from "@/types";
import { splitFullName, normalizePhone, isValidEmail, extractDomain } from "@/lib/utils";

function field(value: string, confidence: number): ParsedField {
  return { value: value.trim(), confidence };
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\/[^\s]*)*/g;

// Common job title keywords
const TITLE_KEYWORDS = [
  "ceo", "cto", "cfo", "coo", "cio", "vp", "president", "director",
  "manager", "engineer", "developer", "designer", "analyst", "consultant",
  "coordinator", "specialist", "lead", "head", "chief", "senior", "junior",
  "associate", "executive", "officer", "founder", "partner", "advisor",
  "architect", "administrator", "supervisor", "procurement", "marketing",
  "sales", "product", "project", "program", "operations", "finance",
  "hr", "human resources", "intern", "assistant", "secretary",
];

export function parseBusinessCardText(rawText: string): ParsedBusinessCard {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const emails = rawText.match(EMAIL_RE) || [];
  const phones = rawText.match(PHONE_RE) || [];
  const urls = rawText.match(URL_RE) || [];

  // Filter URLs that aren't emails
  const websites = urls.filter((u) => !u.includes("@") && u.includes("."));

  // Remove matched items from lines for name/company detection
  const cleanLines = lines.map((line) => {
    let clean = line;
    emails.forEach((e) => (clean = clean.replace(e, "")));
    phones.forEach((p) => (clean = clean.replace(p, "")));
    websites.forEach((w) => (clean = clean.replace(w, "")));
    return clean.trim();
  }).filter(Boolean);

  // Detect job title line
  let jobTitleLine = "";
  let jobTitleIdx = -1;
  for (let i = 0; i < cleanLines.length; i++) {
    const lower = cleanLines[i].toLowerCase();
    if (TITLE_KEYWORDS.some((kw) => lower.includes(kw))) {
      jobTitleLine = cleanLines[i];
      jobTitleIdx = i;
      break;
    }
  }

  // Name is usually the first prominent line
  let fullName = "";
  let nameIdx = -1;
  for (let i = 0; i < cleanLines.length; i++) {
    if (i === jobTitleIdx) continue;
    const line = cleanLines[i];
    // Name heuristic: 2-4 words, no numbers, no special chars
    if (
      line.split(/\s+/).length >= 2 &&
      line.split(/\s+/).length <= 5 &&
      !/\d/.test(line) &&
      line.length < 50
    ) {
      fullName = line;
      nameIdx = i;
      break;
    }
  }

  // Company: often appears after name/title, or is the first remaining line
  let company = "";
  for (let i = 0; i < cleanLines.length; i++) {
    if (i === nameIdx || i === jobTitleIdx) continue;
    const line = cleanLines[i];
    if (line.length > 2 && line.length < 80 && !/\d{4,}/.test(line)) {
      company = line;
      break;
    }
  }

  // Address: lines with numbers + street keywords
  const addressKeywords = ["street", "st", "ave", "avenue", "blvd", "road", "rd", "drive", "dr", "suite", "floor", "fl"];
  let address = "";
  let city = "";
  let country = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (addressKeywords.some((kw) => lower.includes(kw)) || /\d+\s+\w+/.test(line)) {
      if (!emails.some((e) => line.includes(e)) && !phones.some((p) => line.includes(p))) {
        address = line;
        break;
      }
    }
  }

  // Remaining unmatched text goes to notes
  const matchedTexts = [fullName, jobTitleLine, company, address, ...emails, ...phones, ...websites];
  const remainingLines = lines.filter(
    (line) => !matchedTexts.some((m) => m && line.includes(m))
  );
  const notes = remainingLines.join("; ");

  const { first, last } = splitFullName(fullName);
  const email = emails[0] || "";
  const phone = normalizePhone(phones[0] || "");
  const website = websites[0] || "";

  return {
    full_name: field(fullName, fullName ? 0.8 : 0),
    first_name: field(first, first ? 0.7 : 0),
    last_name: field(last, last ? 0.7 : 0),
    job_title: field(jobTitleLine, jobTitleLine ? 0.75 : 0),
    company: field(company, company ? 0.7 : 0),
    email: field(email, email && isValidEmail(email) ? 0.95 : email ? 0.5 : 0),
    phone: field(phone, phone ? 0.85 : 0),
    website: field(website, website ? 0.8 : 0),
    address: field(address, address ? 0.6 : 0),
    city: field(city, 0),
    country: field(country, 0),
    notes: field(notes, notes ? 0.3 : 0),
    raw_text: rawText,
  };
}
