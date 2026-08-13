"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Conversation, ChatMessage } from "@/lib/types";

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams?.get("conversationId");

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user and conversations on mount
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      // Fetch user details
      const { data: userData } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (userData) {
        setCurrentUser({
          id: user.id,
          role: userData.role,
          full_name: userData.full_name,
        });
        fetchConversations(user.id);
      }
    };

    init();
  }, [router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to real-time messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) return;

    // Fetch initial messages
    fetchMessages(activeConversationId);

    const channel = supabase
      .channel(`conversation:${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          const newMsgId = payload.new.id;

          // Fetch full message details including sender info
          const { data: msgData } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:users(id, full_name, user_name, role, profile_image_url)
            `
            )
            .eq("id", newMsgId)
            .single();

          if (msgData) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === msgData.id)) return prev;
              return [...prev, msgData as ChatMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  const fetchConversations = async (userId: string) => {
    try {
      // 1. Get conversation IDs for the user
      const { data: participantRows, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (partError) throw partError;

      const conversationIds = participantRows.map((row) => row.conversation_id);

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. Fetch conversation details
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(
          `
          *,
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

      // Transform data to match Conversation type
      const formattedConversations: Conversation[] = (
        convData as Conversation[]
      ).map((conv) => ({
        ...conv,
        // Sort messages to get the last one
        messages: (conv.messages ?? []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));

      // Deduplicate conversations by other participant
      // Keep the one with the most recent activity
      const uniqueConversationsMap = new Map<string, Conversation>();

      formattedConversations.forEach((conv) => {
        // Find the other participant
        const otherParticipant = conv.participants?.find(
          (p) => p.user.id !== userId
        )?.user;

        if (!otherParticipant) return;

        const existingConv = uniqueConversationsMap.get(otherParticipant.id);

        if (!existingConv) {
          uniqueConversationsMap.set(otherParticipant.id, conv);
        } else {
          // Compare to see which one is "better" (has messages or is newer)
          const existingTime = existingConv.messages?.[0]?.created_at
            ? new Date(existingConv.messages[0].created_at).getTime()
            : new Date(existingConv.updated_at).getTime();

          const newTime = conv.messages?.[0]?.created_at
            ? new Date(conv.messages[0].created_at).getTime()
            : new Date(conv.updated_at).getTime();

          if (newTime > existingTime) {
            uniqueConversationsMap.set(otherParticipant.id, conv);
          }
        }
      });

      const uniqueConversations = Array.from(
        uniqueConversationsMap.values()
      ).sort((a, b) => {
        const timeA = a.messages?.[0]?.created_at
          ? new Date(a.messages[0].created_at).getTime()
          : new Date(a.updated_at).getTime();
        const timeB = b.messages?.[0]?.created_at
          ? new Date(b.messages[0].created_at).getTime()
          : new Date(b.updated_at).getTime();
        return timeB - timeA;
      });

      setConversations(uniqueConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users(id, full_name, user_name, role, profile_image_url)
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !currentUser || sending)
      return;

    const content = newMessage.trim();
    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConversationId,
        sender_id: currentUser.id,
        content: content,
      });

      if (error) throw error;

      setNewMessage("");

      // Update conversation list to show latest message
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id === activeConversationId) {
              return {
                ...c,
                updated_at: new Date().toISOString(),
                messages: [
                  {
                    content,
                    created_at: new Date().toISOString(),
                    is_read: false,
                  },
                ],
              };
            }
            return c;
          })
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser || !conversation.participants) return null;
    return conversation.participants.find((p) => p.user.id !== currentUser.id)
      ?.user;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-teal)]"></div>
      </div>
    );
  }

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const activeParticipant = activeConversation
    ? getOtherParticipant(activeConversation)
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8 font-sans flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-teal)] shadow-sm hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            Messages
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex">
        {/* Conversations List - Hidden on mobile if chat is active */}
        <div
          className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${
            activeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full px-4 py-2 bg-[var(--color-background)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-subtext)]">
                No conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const lastMessage = conversation.messages?.[0];
                const isActive = conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      isActive
                        ? "bg-teal-50 border-r-4 border-[var(--color-teal)]"
                        : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--color-background)] flex items-center justify-center text-[var(--color-teal)] font-bold text-lg shrink-0">
                      {otherUser?.profile_image_url ? (
                        <img
                          src={otherUser.profile_image_url}
                          alt={otherUser.full_name || "User"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        (otherUser?.full_name || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-[var(--color-foreground)] truncate">
                          {otherUser?.full_name || "Unknown User"}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-[var(--color-subtext)]">
                            {formatTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-subtext)] truncate">
                        {lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area - Hidden on mobile if no chat active */}
        <div
          className={`w-full md:w-2/3 flex flex-col ${
            !activeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversationId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white z-10">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center text-[var(--color-teal)] font-bold shrink-0">
                  {activeParticipant?.profile_image_url ? (
                    <img
                      src={activeParticipant.profile_image_url}
                      alt={activeParticipant.full_name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (activeParticipant?.full_name || "U")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-[var(--color-foreground)]">
                    {activeParticipant?.full_name || "Unknown User"}
                  </h2>
                  <p className="text-xs text-[var(--color-subtext)] capitalize">
                    {activeParticipant?.role || "User"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-background)]">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-teal)]"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-[var(--color-subtext)] py-12">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isMe
                              ? "bg-[var(--color-teal)] text-white rounded-br-none"
                              : "bg-white text-[var(--color-foreground)] rounded-bl-none shadow-sm"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 text-right ${
                              isMe ? "text-teal-100" : "text-gray-400"
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-[var(--color-background)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-[var(--color-teal)] text-white p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 transform rotate-90"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-subtext)] bg-[var(--color-background)]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <span className="text-4xl">💬</span>
              </div>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a client to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-teal)]"></div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
