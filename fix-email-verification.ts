import { loadEnvConfig } from "@next/env";
import pg from "pg";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error("ERROR: DATABASE_URL or DIRECT_URL not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function fixEmailVerification() {
  try {
    console.log("Connecting to database...");
    await client.connect();

    console.log("Setting all existing users to emailVerified = true...");
    const result = await client.query(
      `UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false`
    );

    console.log(`Updated ${result.rowCount} users`);
    console.log("Done! All users can now login.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixEmailVerification();
