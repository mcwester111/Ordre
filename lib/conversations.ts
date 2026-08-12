import { createClient } from "@/lib/supabase/client";

export type ConversationRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// ── Conversations ────────────────────────────────────────────────────────────

export async function createConversation(title: string, id?: string): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ ...(id ? { id } : {}), user_id: user.id, title })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function listConversations(): Promise<ConversationRow[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

export async function loadConversationMessages(conversationId: string): Promise<MessageRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []) as MessageRow[];
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("messages").delete().eq("conversation_id", conversationId);
  await supabase.from("conversations").delete().eq("id", conversationId);
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from("messages").insert({ conversation_id: conversationId, role, content });

  // Bump updated_at on the parent conversation so it sorts to top
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
