import os from "os";
import path from "path";
import { randomBytes } from "crypto";

// Each test run gets its own temp SQLite file to avoid ?cache=shared issues
const tmpDb = path.join(
  os.tmpdir(),
  `referon-test-${randomBytes(6).toString("hex")}.db`
);

process.env.DATABASE_URL = `file:${tmpDb}`;
process.env.AI_SERVICE_URL = "http://localhost:9999";
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.CORS_ORIGIN = "*";
process.env.AI_TIMEOUT_MS = "5000";
