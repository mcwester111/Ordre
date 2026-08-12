import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/components/ProfileIntake";
import type { AiNotes } from "@/lib/account";
import { EMPTY_NOTES } from "@/lib/account";

export const PROFILE_KEY = "ordre.profile.v1";

// ── Supabase helpers ─────────────────────────────────────────────────────────

export async function loadProfileFromSupabase(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("colors, contrast, world, silhouette, gender, aesthetic")
    .eq("id", user.id)
    .single();

  if (error || !data || !Array.isArray(data.colors)) return null;

  return {
    colors: data.colors ?? [],
    environments: [],
    contrast: data.contrast ?? "",
    world: data.world ?? "",
    silhouette: data.silhouette ?? "",
    gender: data.gender ?? "womenswear",
    aesthetic: data.aesthetic ?? [],
  };
}

export async function saveProfileToSupabase(profile: UserProfile): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    colors: profile.colors,
    contrast: profile.contrast,
    world: profile.world,
    silhouette: profile.silhouette,
    gender: profile.gender,
    aesthetic: profile.aesthetic,
  });
}

// ── Notes (Supabase) ─────────────────────────────────────────────────────────

export async function loadNotesFromSupabase(): Promise<AiNotes | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("preferred_name, nickname, loves, notes, avoid")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    preferredName: data.preferred_name ?? "",
    nickname: data.nickname ?? "",
    loves: data.loves ?? "",
    notes: data.notes ?? "",
    avoid: data.avoid ?? "",
  };
}

export async function saveNotesToSupabase(notes: AiNotes): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    preferred_name: notes.preferredName,
    nickname: notes.nickname,
    loves: notes.loves,
    notes: notes.notes,
    avoid: notes.avoid,
  });
}

// ── Notepad (Supabase + localStorage) ────────────────────────────────────────

export const NOTEPAD_KEY = "ordre.notepad.v1";

export async function loadNotepadFromSupabase(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("notepad")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { notepad?: string | null }).notepad ?? null;
}

export async function saveNotepadToSupabase(content: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({ id: user.id, notepad: content });
}

// ── Avatar stamp (Supabase + localStorage cache) ─────────────────────────────

const AVATAR_CACHE_KEY = "ordre.avatar.v1";

export function loadAvatarFromCache(): { symbol: string; label: string } | null {
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveAvatarToCache(avatar: { symbol: string; label: string }) {
  try { localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(avatar)); } catch { /* ignore */ }
}

export async function loadAvatarFromSupabase(): Promise<{ symbol: string; label: string } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("avatar_symbol, avatar_label")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  const av = {
    symbol: data.avatar_symbol ?? "none",
    label: data.avatar_label ?? "initial",
  };
  saveAvatarToCache(av);
  return av;
}

export async function saveAvatarToSupabase(avatar: { symbol: string; label: string }): Promise<void> {
  saveAvatarToCache(avatar);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    avatar_symbol: avatar.symbol,
    avatar_label: avatar.label,
  });
}

// ── Display name (auth user_metadata) ────────────────────────────────────────

export async function saveNameToSupabase(first: string, last: string): Promise<void> {
  const supabase = createClient();
  await supabase.auth.updateUser({ data: { name: `${first.trim()} ${last.trim()}`.trim() } });
}

// ── localStorage helpers ─────────────────────────────────────────────────────

export function loadProfileFromStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as UserProfile;
    return saved && Array.isArray(saved.colors) ? saved : null;
  } catch {
    return null;
  }
}

export function saveProfileToStorage(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* storage full or blocked */
  }
}
