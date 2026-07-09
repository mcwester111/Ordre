// ── User data control (GDPR/CCPA right-to-erasure) ──────────────────────────

import { createClient } from "@/lib/supabase/client";

export const APP_STORAGE_PREFIX = "ordre.";

/** True if the app currently holds any locally-stored data for this browser. */
export function hasStoredData(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(APP_STORAGE_PREFIX)) return true;
    }
  } catch {
    /* storage unavailable */
  }
  return false;
}

/** Remove every `ordre.*` key from this browser. */
function clearLocalData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(APP_STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Erase all personal data the app holds about the user (right to deletion).
 * For signed-in users: deletes the Supabase account (cascades profile,
 * conversations, messages) then signs out. Always clears localStorage.
 */
export async function deleteAllUserData(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // delete_own_account() is a security-definer Postgres function that
    // deletes auth.users where id = auth.uid(). Cascades everything.
    await supabase.rpc("delete_own_account");
    await supabase.auth.signOut();
  }

  clearLocalData();
}
