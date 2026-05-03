import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Basic file validation
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "File too large (max 2MB)." }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using admin client (bypasses RLS)
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("profile-pictures")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Server upload error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
