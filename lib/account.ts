// ── Local account + stylist notes ───────────────────────────────────────────
// There is no auth backend yet, so an "account" and the client's standing notes
// to the stylist are held in this browser's localStorage. Both keys live under
// the `ordre.` prefix so the privacy "delete my data" control erases them too.
// When a real backend exists, swap these helpers for authenticated calls — the
// shapes below are the contract the UI depends on.

const ACCOUNT_KEY = "ordre.account.v1";
const NOTES_KEY = "ordre.aiNotes.v1";

export type Account = {
  name: string;
  email: string;
  createdAt: number;
};

export type AiNotes = {
  preferredName: string; // full name shown on profile
  nickname: string;      // optional alias for the AI curator
  loves: string;
  notes: string;
  avoid: string;
};

export const EMPTY_NOTES: AiNotes = {
  preferredName: "",
  nickname: "",
  loves: "",
  notes: "",
  avoid: "",
};

// ── Account ─────────────────────────────────────────────────────────────────
export function getAccount(): Account | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Account;
    return a && typeof a.email === "string" ? a : null;
  } catch {
    return null;
  }
}

export function createAccount(name: string, email: string): Account {
  const account: Account = {
    name: name.trim(),
    email: email.trim(),
    createdAt: Date.now(),
  };
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    /* storage blocked — account still works for this session via the return */
  }
  return account;
}

export function signOut(): void {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* storage unavailable */
  }
}

// ── Stylist notes ───────────────────────────────────────────────────────────
export function getAiNotes(): AiNotes {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return { ...EMPTY_NOTES };
    const n = JSON.parse(raw) as Partial<AiNotes>;
    return { ...EMPTY_NOTES, ...n };
  } catch {
    return { ...EMPTY_NOTES };
  }
}

export function saveAiNotes(notes: AiNotes): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* storage full or blocked */
  }
}

/** Render the client's standing notes as guidance the stylist (AI) can act on. */
export function buildNotesDescription(n: AiNotes): string {
  const bits: string[] = [];
  const name = n.preferredName.trim();
  const loves = n.loves.trim();
  const notes = n.notes.trim();
  const avoid = n.avoid.trim();

  const nickname = n.nickname.trim();
  if (nickname) bits.push(`The client's preferred name for the curator is "${nickname}".`);
  else if (name) bits.push(`The client's name is "${name}".`);
  if (loves) bits.push(`Houses, designers, and pieces the client loves: ${loves}.`);
  if (notes) bits.push(`Standing notes from the client to always keep in mind: ${notes}.`);
  if (avoid) bits.push(`The client asks that you avoid: ${avoid}.`);

  return bits.length ? `Personal direction from the client. ${bits.join(" ")}` : "";
}

export function hasAnyNotes(n: AiNotes): boolean {
  return Boolean(
    n.preferredName.trim() || n.nickname.trim() || n.loves.trim() || n.notes.trim() || n.avoid.trim()
  );
}
