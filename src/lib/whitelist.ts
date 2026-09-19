/**
 * Lightweight helper to check if an email is whitelisted for early access.
 * Safe to import inside Next.js Middleware and Edge runtimes.
 */
export function isEmailWhitelisted(email?: string | null, isWhitelistedInDb?: boolean): boolean {
  if (isWhitelistedInDb) return true;
  if (!email) return false;

  const normalized = email.trim().toLowerCase();

  // Founder and default authorized accounts
  const defaultAllowed = ["andreigrigore464@gmail.com", "founder@repurposemvp.local"];
  if (defaultAllowed.includes(normalized)) return true;

  const envAllowed = (process.env.ALLOWED_EMAILS || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (envAllowed.includes(normalized)) return true;

  // Wildcard domain match support (e.g. "@mycompany.com")
  const domain = `@${normalized.split("@")[1] || ""}`;
  if (envAllowed.includes(domain)) return true;

  return false;
}
