import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: { email: (credentials.email as string).trim().toLowerCase() },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true,
            password: true,
            isActive: true,
            emailVerified: true,
            profilePictureUrl: true,
          },
        });

        console.log("\n=== LOGIN DEBUG ===");
        console.log("Email attempted:", credentials.email);
        console.log("User found:", !!user);
        if (user) {
          console.log("User active:", user.isActive);
          console.log("Email verified:", user.emailVerified);
          console.log("Stored password length:", user.password?.length);
          console.log("Stored password starts with:", user.password?.substring(0, 30));
          console.log("Input password length:", (credentials.password as string).length);
        }

        if (!user || !user.isActive) {
          console.log("LOGIN FAILED: User not found or inactive");
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          console.log("LOGIN FAILED: Email not verified - user must verify email first");
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        console.log("Attempting bcrypt.compare...");
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log("Password match result:", passwordMatch);

        if (!passwordMatch) {
          console.log("LOGIN FAILED: Password does not match");
          console.log("Expected hash:", user.password.substring(0, 30));
          console.log("Attempted password:", (credentials.password as string).substring(0, 20));
          return null;
        }
        console.log("LOGIN SUCCESS: Password matches, returning user");
        console.log("=== END LOGIN DEBUG ===");

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.profilePictureUrl ?? null,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
});
