import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { Conversation } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // 1. Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch conversations where the user is a participant
    const { data: participantRows, error: participantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (participantError) throw participantError;

    const conversationIds = participantRows.map((row) => row.conversation_id);

    if (conversationIds.length === 0) {
      return NextResponse.json([]);
    }

    // 3. Fetch conversation details, participants, and last message
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        is_group,
        group_name,
        created_at,
        updated_at,
        participants:conversation_participants(
          user:users(id, full_name, user_name, role, profile_image_url)
        ),
        messages(
          content,
          created_at,
          is_read
        )
      `
      )
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (convError) throw convError;

    // 4. Transform data to match frontend interface
    // We cast to unknown first because Supabase types might not match our exact nested structure automatically
    const typedConversations = conversations as unknown as Conversation[];

    const formattedConversations = typedConversations.map((conv) => {
      const participants = conv.participants || [];
      const messages = conv.messages || [];

      const otherParticipants = participants
        .map((p) => p.user)
        .filter((u) => u.id !== user.id);

      const participantsToReturn =
        otherParticipants.length > 0
          ? otherParticipants
          : participants.map((p) => p.user);

      const sortedMessages = [...messages].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMsg = sortedMessages[0];

      return {
        id: conv.id,
        participant_ids: participantsToReturn.map((u) => u.id),
        participant_names: participantsToReturn.map(
          (u) => u.full_name || "Unknown"
        ),
        participant_usernames: participantsToReturn.map(
          (u) => u.user_name || "unknown"
        ),
        participant_roles: participantsToReturn.map((u) => u.role),
        participant_images: participantsToReturn.map(
          (u) => u.profile_image_url
        ),
        is_group: conv.is_group,
        group_name: conv.group_name,
        last_message: lastMsg ? lastMsg.content : null,
        last_message_time: lastMsg ? lastMsg.created_at : conv.created_at,
        unread_count: 0,
        is_online: false,
        created_at: conv.created_at,
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
