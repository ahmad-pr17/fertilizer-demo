/**
 * Managed Postgres providers (Neon, Supabase, RDS, etc.) require SSL and
 * signal it via `sslmode=require` in the connection string; the pg driver
 * doesn't turn that into a real TLS connection on its own when TypeORM
 * passes a parsed `url`, so it needs to be requested explicitly here. Local
 * docker-compose Postgres has no SSL listener at all, so this only turns on
 * when the URL asks for it — never hardcode `ssl: true` for both cases.
 */
export function getSslOption(databaseUrl: string): { rejectUnauthorized: boolean } | false {
  return databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false;
}
