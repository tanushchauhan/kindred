import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { ChatMessage } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { id: conversationId } = await params;

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify participation
    const { data: participation, error: partError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (partError || !participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        is_read,
        sender:users(id, full_name, user_name, role, profile_image_url)
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const typedMessages = messages as unknown as ChatMessage[];

    // Format
    const formattedMessages = typedMessages.map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender?.full_name || "Unknown",
      sender_username: msg.sender?.user_name || "unknown",
      sender_role: msg.sender?.role || "client",
      sender_image: msg.sender?.profile_image_url || null,
      content: msg.content,
      created_at: msg.created_at,
      read: msg.is_read,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { id: conversationId } = await params;

  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify participation
    const { data: participation, error: partError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (partError || !participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
      })
      .select(
        `
        *,
        sender:users(id, full_name, user_name, role)
      `
      )
      .single();

    if (error) throw error;

    const typedMessage = message as unknown as ChatMessage;

    // Update conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Format response
    const formattedMessage = {
      id: typedMessage.id,
      conversation_id: typedMessage.conversation_id,
      sender_id: typedMessage.sender_id,
      sender_name: typedMessage.sender?.full_name || "Unknown",
      sender_username: typedMessage.sender?.user_name || "unknown",
      sender_role: typedMessage.sender?.role || "client",
      content: typedMessage.content,
      created_at: typedMessage.created_at,
      read: typedMessage.is_read,
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
