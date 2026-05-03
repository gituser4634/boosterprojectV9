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

async function deleteUsers() {
  const emailsToDelete = ["childpatron@gmail.com", "medalihiza@proton.me"];

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected! Looking for users with emails:", emailsToDelete);

    // Find users first
    const findQuery = `SELECT id, email, username FROM "User" WHERE email = ANY($1)`;
    const findResult = await client.query(findQuery, [emailsToDelete]);

    if (findResult.rows.length === 0) {
      console.log("No users found with these emails.");
      await client.end();
      process.exit(0);
    }

    console.log("Found users to delete:");
    findResult.rows.forEach((user: any) => {
      console.log(`  - ${user.email} (${user.username})`);
    });

    // Delete verification tokens
    console.log("\nDeleting verification tokens...");
    const userIds = findResult.rows.map((u: any) => u.id);
    await client.query(`DELETE FROM "VerificationToken" WHERE "userId" = ANY($1)`, [userIds]);
    console.log("  Done");

    // Delete password reset tokens
    console.log("Deleting password reset tokens...");
    await client.query(`DELETE FROM "PasswordResetToken" WHERE "userId" = ANY($1)`, [userIds]);
    console.log("  Done");

    // Delete users
    console.log("Deleting users...");
    const deleteResult = await client.query(`DELETE FROM "User" WHERE email = ANY($1)`, [emailsToDelete]);
    console.log(`  Deleted ${deleteResult.rowCount} user(s)`);

    console.log("\nSuccess! Users have been deleted.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deleteUsers();
