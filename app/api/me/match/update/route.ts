import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * PUT /api/me/match/update
 *
 * Update the client's trainer or nutritionist selection
 *
 * Allows clients to change their trainer or nutritionist selections.
 * Can update one professional at a time or both.
 * Pass null to clear a selection.
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user is a client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (userData.role !== "client") {
      return NextResponse.json(
        { error: "This feature is only available to clients" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { trainerId, nutritionistId } = body;

    // Validate that at least one professional ID is provided
    if (trainerId === undefined && nutritionistId === undefined) {
      return NextResponse.json(
        {
          error: "Please provide trainerId or nutritionistId to update",
        },
        { status: 400 }
      );
    }

    // Validate professional IDs if provided (and not null)
    if (trainerId !== null && trainerId !== undefined) {
      const { data: trainer } = await supabase
        .from("trainer_profiles")
        .select("user_id, is_verified")
        .eq("user_id", trainerId)
        .eq("is_verified", true)
        .single();

      if (!trainer) {
        return NextResponse.json(
          { error: "Invalid or unverified trainer ID" },
          { status: 400 }
        );
      }
    }

    if (nutritionistId !== null && nutritionistId !== undefined) {
      const { data: nutritionist } = await supabase
        .from("nutritionist_profiles")
        .select("user_id, is_verified")
        .eq("user_id", nutritionistId)
        .eq("is_verified", true)
        .single();

      if (!nutritionist) {
        return NextResponse.json(
          { error: "Invalid or unverified nutritionist ID" },
          { status: 400 }
        );
      }
    }

    // Check if match record exists
    const { data: existingMatch } = await supabase
      .from("client_matches")
      .select("id")
      .eq("client_id", user.id)
      .single();

    // Build update object - only include fields that were provided
    const updateData: Record<string, unknown> = {};
    if (trainerId !== undefined) {
      updateData.selected_trainer_id = trainerId;
    }
    if (nutritionistId !== undefined) {
      updateData.selected_nutritionist_id = nutritionistId;
    }

    if (existingMatch) {
      // Update existing match
      const { error: updateError } = await supabase
        .from("client_matches")
        .update(updateData)
        .eq("client_id", user.id);

      if (updateError) {
        console.error("Error updating match:", updateError);
        return NextResponse.json(
          { error: "Failed to update match selection" },
          { status: 500 }
        );
      }
    } else {
      // Create new match record (for manual selection without AI)
      const { error: insertError } = await supabase
        .from("client_matches")
        .insert({
          client_id: user.id,
          selected_trainer_id: trainerId !== undefined ? trainerId : null,
          selected_nutritionist_id:
            nutritionistId !== undefined ? nutritionistId : null,
        });

      if (insertError) {
        console.error("Error creating match:", insertError);
        return NextResponse.json(
          { error: "Failed to create match selection" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Match selection updated successfully",
      updated: {
        trainer: trainerId !== undefined,
        nutritionist: nutritionistId !== undefined,
      },
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match selection" },
      { status: 500 }
    );
  }
}
