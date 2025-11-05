import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * PUT /api/profile/update
 * Update user profile information
 * Available to all authenticated users
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { full_name, phone_number, gender, location, birth_date } = body;

    // Validate required fields
    if (!full_name || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    // Validate gender if provided
    if (gender && !["male", "female", "other"].includes(gender.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid gender value. Must be male, female, or other" },
        { status: 400 }
      );
    }

    // Validate birth_date if provided
    if (birth_date) {
      const date = new Date(birth_date);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid birth date format" },
          { status: 400 }
        );
      }
      // Check if date is not in the future
      if (date > new Date()) {
        return NextResponse.json(
          { error: "Birth date cannot be in the future" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      full_name: string;
      phone_number: string | null;
      gender: string | null;
      location: string | null;
      birth_date: string | null;
    } = {
      full_name: full_name.trim(),
      phone_number: phone_number?.trim() || null,
      gender: gender?.toLowerCase() || null,
      location: location?.trim() || null,
      birth_date: birth_date || null,
    };

    // Update the user profile
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        profile: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/profile/update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
