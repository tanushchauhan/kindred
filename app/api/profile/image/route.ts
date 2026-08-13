import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for existing image to delete later
    const { data: userData } = await supabase
      .from("users")
      .select("profile_image_url")
      .eq("id", user.id)
      .single();

    // 2. Parse Form Data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // 3. Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // 4. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // 5. Update User Profile
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_image_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update user error:", updateError);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    // 6. Delete old image if it exists
    if (userData?.profile_image_url) {
      const urlParts = userData.profile_image_url.split("/avatars/");
      if (urlParts.length > 1) {
        const oldFilePath = urlParts[1];
        // Don't await this, let it happen in background
        supabase.storage
          .from("avatars")
          .remove([oldFilePath])
          .then(({ error }) => {
            if (error) console.error("Failed to cleanup old image:", error);
          });
      }
    }

    return NextResponse.json({
      success: true,
      profile_image_url: publicUrl,
    });
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get current profile image URL to delete from storage
    const { data: userData } = await supabase
      .from("users")
      .select("profile_image_url")
      .eq("id", user.id)
      .single();

    if (userData?.profile_image_url) {
      // Extract the file path from the public URL
      // URL format: .../storage/v1/object/public/avatars/USER_ID/FILENAME
      const urlParts = userData.profile_image_url.split("/avatars/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        const { error: storageError } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (storageError) {
          console.error("Error removing file from storage:", storageError);
          // Continue to remove from DB even if storage fails, to keep DB clean
        }
      }
    }

    // 3. Update User Profile to remove image URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_image_url: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update user error:", updateError);
      return NextResponse.json(
        { error: "Failed to remove profile image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Profile image delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
