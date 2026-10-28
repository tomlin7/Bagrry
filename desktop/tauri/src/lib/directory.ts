import type { Company, Meeting, Person, Profile } from "./types";

export type DirectoryPerson = Person & { is_me?: boolean };

export function emailDomain(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@")[1]?.trim().toLowerCase();
  return domain || null;
}

/** "bitmesra.ac.in" → "Bitmesra" */
export function companyNameFromDomain(domain: string): string {
  const head = domain.split(".")[0]?.trim() ?? domain;
  if (!head) return domain;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

export function mergeSelfIntoPeople(
  people: Person[],
  profile: Profile | undefined,
  meetings: Meeting[],
): DirectoryPerson[] {
  const latest = meetings[0]?.date ?? null;
  const count = meetings.length;
  const profileEmail = profile?.email.trim().toLowerCase() || null;
  const profileName = profile?.name.trim() || "You";

  const marked = people.map((person) => {
    const email = person.email?.trim().toLowerCase() ?? null;
    const isMe = Boolean(profileEmail && email && email === profileEmail);
    return {
      ...person,
      is_me: isMe,
      note_count: isMe ? Math.max(person.note_count, count) : person.note_count,
      last_note_at: isMe ? (person.last_note_at ?? latest) : person.last_note_at,
    };
  });

  if (marked.some((person) => person.is_me) || !profile) return marked;

  return [
    {
      id: "person_me",
      name: profileName,
      email: profile.email || null,
      domain: emailDomain(profile.email),
      company_id: null,
      note_count: count,
      last_note_at: latest,
      is_me: true,
    },
    ...marked,
  ];
}

export function mergeDomainCompanies(companies: Company[], people: DirectoryPerson[], meetings: Meeting[]): Company[] {
  const byDomain = new Map<string, Company>();
  for (const company of companies) {
    if (company.domain) byDomain.set(company.domain.toLowerCase(), company);
  }

  const extra: Company[] = [];
  for (const person of people) {
    const domain = (person.domain || emailDomain(person.email))?.toLowerCase();
    if (!domain || byDomain.has(domain)) continue;
    const latest = person.is_me ? (meetings[0]?.date ?? person.last_note_at) : person.last_note_at;
    const count = person.is_me ? Math.max(person.note_count, meetings.length) : person.note_count;
    const synthesized: Company = {
      id: `company_domain:${domain}`,
      name: companyNameFromDomain(domain),
      domain,
      note_count: count,
      last_note_at: latest,
    };
    byDomain.set(domain, synthesized);
    extra.push(synthesized);
  }

  return [...companies, ...extra];
}

export function filterDirectory<T extends { name: string; note_count: number }>(
  rows: T[],
  query: string,
  metOnly: boolean,
  extraHaystack?: (row: T) => string,
): T[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (metOnly && row.note_count <= 0) return false;
    if (!q) return true;
    const hay = `${row.name} ${extraHaystack?.(row) ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export function sortByLastNote<T extends { last_note_at: string | null; name: string }>(
  rows: T[],
  dir: "desc" | "asc" = "desc",
): T[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = a.last_note_at ?? "";
    const bv = b.last_note_at ?? "";
    if (av === bv) return a.name.localeCompare(b.name);
    if (!av) return 1;
    if (!bv) return -1;
    return dir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
  });
  return copy;
}
