import { loadEnvConfig } from "@next/env";
import { Resend } from "resend";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const apiKey = process.env.RESEND_API_KEY;
const senderEmail = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";

console.log("RESEND_API_KEY set:", !!apiKey);
console.log("API Key length:", apiKey?.length);
console.log("Sender email:", senderEmail);

if (!apiKey) {
  console.error("ERROR: RESEND_API_KEY not found!");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
  try {
    console.log("\nAttempting to send test email from onboarding@resend.dev to verified address...");
    
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "medalihi@gmail.com",
      subject: "Test Email - Using onboarding@resend.dev",
      html: "<h1>Test</h1><p>This is a test email from onboarding@resend.dev</p>",
    });

    console.log("Result:", result);
    
    if (result.error) {
      console.error("❌ Email send failed:", result.error);
    } else {
      console.log("✅ Email send successful, ID:", result.data?.id);
    }
  } catch (error) {
    console.error("Exception:", error);
  }
}

testEmail();
