import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { env } from "../config/env.js";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const client = createClient({ url: env.DATABASE_URL });
    _db = drizzle(client, { schema });
  }
  return _db;
}

/** Call this in tests after changing DATABASE_URL to force a fresh connection. */
export function resetDbSingleton() {
  _db = null;
}
