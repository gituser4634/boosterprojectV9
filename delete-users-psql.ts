// Delete users directly using SQL via psql
import { spawn } from "child_process";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  console.error("ERROR: DATABASE_URL or DIRECT_URL not set");
  process.exit(1);
}

console.log("Connecting to database...");

// SQL commands to delete users
const emailsToDelete = ["childpatron@gmail.com", "medalihiza@proton.me"];
const emailsList = emailsToDelete.map(e => `'${e}'`).join(",");

const sqlCommands = `
-- Find and show users to delete
SELECT id, email, username FROM "User" WHERE email IN (${emailsList});

-- Delete verification tokens
DELETE FROM "VerificationToken" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email IN (${emailsList})
);

-- Delete password reset tokens  
DELETE FROM "PasswordResetToken"
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email IN (${emailsList})
);

-- Delete users
DELETE FROM "User" WHERE email IN (${emailsList});

-- Show result
SELECT 'Deletion complete' as status;
`;

console.log("Running SQL commands...");

const psql = spawn("psql", [directUrl], {
  stdio: ["pipe", "pipe", "pipe"],
});

psql.stdin.write(sqlCommands);
psql.stdin.end();

let output = "";
let errorOutput = "";

psql.stdout.on("data", (data) => {
  output += data.toString();
  console.log(data.toString());
});

psql.stderr.on("data", (data) => {
  errorOutput += data.toString();
  console.error(data.toString());
});

psql.on("close", (code) => {
  if (code === 0) {
    console.log("\nUsers deleted successfully!");
  } else {
    console.error(`\npsql exited with code ${code}`);
    if (errorOutput) {
      console.error("Error:", errorOutput);
    }
  }
  process.exit(code);
});
