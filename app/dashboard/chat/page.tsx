"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Conversation, ChatMessage, UserRole } from "@/lib/types";

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
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

      // Fetch user role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (
        !userData ||
        (userData.role !== "trainer" && userData.role !== "nutritionist")
      ) {
        // Redirect if not a professional (optional, but good for security)
        // router.push("/dashboard");
      }

      setUser({ id: user.id, role: userData?.role || "" });
      fetchConversations(user.id);
    };

    init();
  }, [router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to real-time messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          const newMsgId = payload.new.id;

          // Fetch full message details including sender info
          const { data: msgData } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:users(id, full_name, user_name, role)
            `
            )
            .eq("id", newMsgId)
            .single();

          if (msgData) {
            setMessages((prev) => [...prev, msgData as ChatMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

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
            user:users(id, full_name, user_name, role)
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
      const formattedConversations = (convData as any[]).map((conv) => ({
        ...conv,
        // Sort messages to get the last one
        messages: conv.messages.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));

      setConversations(formattedConversations);
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
          sender:users(id, full_name, user_name, role)
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

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);

    // Mark as read (optional implementation)
    // markAsRead(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: content,
      });

      if (error) throw error;

      // Update conversation list to show latest message (optimistic or re-fetch)
      // For simplicity, we rely on the real-time subscription for the message list
      // But we should update the conversation list "last message"
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id === selectedConversation.id) {
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
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.is_group && conv.group_name) return conv.group_name;

    // Find other participant
    const otherParticipant = conv.participants?.find(
      (p) => p.user && p.user.id !== user?.id
    );
    return (
      otherParticipant?.user?.full_name ||
      otherParticipant?.user?.user_name ||
      "Unknown User"
    );
  };

  const getConversationSubtitle = (conv: Conversation) => {
    if (conv.is_group) return `${conv.participants?.length || 0} members`;

    const otherParticipant = conv.participants?.find(
      (p) => p.user && p.user.id !== user?.id
    );
    return otherParticipant?.user?.role
      ? otherParticipant.user.role.charAt(0).toUpperCase() +
          otherParticipant.user.role.slice(1)
      : "";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Conversation List */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-gray-900 truncate pr-2">
                    {getConversationName(conv)}
                  </h3>
                  {conv.messages && conv.messages[0] && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(
                        conv.messages[0].created_at
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate flex-1 pr-2">
                    {conv.messages && conv.messages[0]
                      ? conv.messages[0].content
                      : "No messages yet"}
                  </p>
                  {conv.is_group && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                      Group
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`w-full md:w-2/3 lg:w-3/4 flex flex-col bg-white ${
          !selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm z-10">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden mr-3 text-gray-500 hover:text-gray-700"
              >
                ←
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {getConversationName(selectedConversation)}
                </h2>
                <p className="text-xs text-gray-500">
                  {getConversationSubtitle(selectedConversation)}
                </p>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <span className="text-4xl mb-2">💬</span>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                        }`}
                      >
                        {!isMe && selectedConversation.is_group && (
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            {msg.sender?.full_name || msg.sender?.user_name}
                          </p>
                        )}
                        <p className="text-sm md:text-base whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 text-right ${
                            isMe ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ➤
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Welcome to Messages
            </h3>
            <p>Select a conversation from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
