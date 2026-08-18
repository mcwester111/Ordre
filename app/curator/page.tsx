"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProfileIntake, { UserProfile, buildProfileDescription } from "@/components/ProfileIntake";
import ProfilePanel from "@/components/ProfilePanel";
import { AiNotes, EMPTY_NOTES, getAiNotes, getAccount, buildNotesDescription } from "@/lib/account";
import {
  loadProfileFromSupabase,
  loadProfileFromStorage,
  saveProfileToSupabase,
  saveProfileToStorage,
  loadNotepadFromSupabase,
  NOTEPAD_KEY,
} from "@/lib/profile";
import {
  createConversation,
  listConversations,
  loadConversationMessages,
  saveMessage,
  updateConversationTitle,
  deleteConversation,
  ConversationRow,
} from "@/lib/conversations";
import LeftSidebar from "@/components/LeftSidebar";

type MessageImage = {
  dataUrl: string;
  mediaType: string;
  base64: string;
};

type MessageDoc = {
  name: string;
  mediaType: string; // "application/pdf" | "text/plain"
  data: string;      // base64 for PDF, raw text for text/plain
};

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: MessageImage[];
  docs?: MessageDoc[];
  isStreaming?: boolean;
};

type ApiContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    }
  | {
      type: "document";
      title?: string;
      source:
        | { type: "base64"; media_type: "application/pdf"; data: string }
        | { type: "text"; media_type: "text/plain"; data: string };
    };

type ApiMessage = {
  role: "user" | "assistant";
  content: string | ApiContent[];
};

// ── Welcome flag — set once after the very first assistant response ───────
const WELCOMED_KEY = "ordre.welcomed.v1";
function loadWelcomed(): boolean {
  try { return localStorage.getItem(WELCOMED_KEY) === "true"; } catch { return false; }
}
function saveWelcomed() {
  try { localStorage.setItem(WELCOMED_KEY, "true"); } catch {}
}

// ── Conversation cache (localStorage write-ahead buffer) ──────────────────
// Keeps the active conversation alive across hard refreshes. Supabase writes
// are async and can race a quick refresh; localStorage is synchronous and
// always wins. On load we check the cache and flush any unsaved data to
// Supabase in the background.
const CONV_CACHE_KEY = "ordre.activeConv.v1";
type CachedConv = { id: string; title: string; messages: { id: string; role: "user" | "assistant"; text: string }[] };
function saveConvCache(id: string, title: string, msgs: { id: string; role: "user" | "assistant"; text: string }[]) {
  try { localStorage.setItem(CONV_CACHE_KEY, JSON.stringify({ id, title, messages: msgs })); } catch {}
}
function loadConvCache(): CachedConv | null {
  try { const r = localStorage.getItem(CONV_CACHE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function clearConvCache() {
  try { localStorage.removeItem(CONV_CACHE_KEY); } catch {}
}

// ── Upload safety limits ───────────────────────────────────────────────────
// Allowlist-based handling plus hard caps so a malicious or runaway upload
// can't exhaust memory or balloon the API payload.
const MAX_FILES_PER_ADD = 20;               // per selection / folder
const MAX_ATTACHMENTS = 24;                  // total queued at once
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;    // 25 MB (before downscale)
const MAX_PDF_BYTES = 20 * 1024 * 1024;      // 20 MB
const MAX_TEXT_BYTES = 1 * 1024 * 1024;      // 1 MB

// Resize + convert image to JPEG via canvas, max 1600px, returns {base64, mediaType}
async function processImage(file: File): Promise<MessageImage> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1600;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      resolve({ dataUrl, mediaType: "image/jpeg", base64 });
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// Resize a dataUrl to a small thumbnail for wardrobe context injection
async function resizeDataUrlToBase64(
  dataUrl: string,
  maxDim = 260,
  quality = 0.72,
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("no ctx")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", quality);
        resolve({ base64: out.split(",")[1], mediaType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

// Build visual wardrobe + moodboard context to inject before the real conversation
async function buildWardrobeContext(): Promise<ApiContent[] | null> {
  const content: ApiContent[] = [];

  // ── Closet ──────────────────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem("ordre.closet.v1");
    if (raw) {
      const cubbies = JSON.parse(raw) as { id: string; label: string; items: { id: string; dataUrl: string }[] }[];
      const labeled = cubbies.filter(c => c.label.trim() && c.items.length > 0);
      if (labeled.length > 0) {
        content.push({ type: "text", text: "Here is my current wardrobe, organised by category in my Ordre closet:" });
        for (const cubby of labeled.slice(0, 10)) {
          content.push({ type: "text", text: `Category: ${cubby.label.toUpperCase()} — ${cubby.items.length} item${cubby.items.length !== 1 ? "s" : ""}` });
          for (const item of cubby.items.slice(0, 5)) {
            const thumb = await resizeDataUrlToBase64(item.dataUrl);
            if (thumb) content.push({ type: "image", source: { type: "base64", media_type: thumb.mediaType, data: thumb.base64 } });
          }
        }
      }
    }
  } catch { /* ignore */ }

  // ── Moodboard images ────────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem("ordre.moodboard.v1");
    if (raw) {
      const images = JSON.parse(raw) as { id: string; dataUrl: string }[];
      if (images.length > 0) {
        content.push({ type: "text", text: `I also have ${images.length} image${images.length !== 1 ? "s" : ""} saved to my moodboard:` });
        for (const img of images.slice(0, 8)) {
          const thumb = await resizeDataUrlToBase64(img.dataUrl);
          if (thumb) content.push({ type: "image", source: { type: "base64", media_type: thumb.mediaType, data: thumb.base64 } });
        }
      }
    }
  } catch { /* ignore */ }

  // ── Canvas text annotations ─────────────────────────────────────────────
  try {
    const raw = localStorage.getItem("ordre.canvas.v1");
    if (raw) {
      const canvases = JSON.parse(raw) as { id: string; items: { type?: string; text?: string }[] }[];
      const texts = canvases.flatMap(c => c.items.filter(i => i.type === "text" && i.text?.trim()).map(i => i.text!.trim()));
      if (texts.length > 0) {
        content.push({ type: "text", text: `Text notes on my moodboard canvas:\n${texts.map(t => `– ${t}`).join("\n")}` });
      }
    }
  } catch { /* ignore */ }

  return content.length > 0 ? content : null;
}

function buildApiMessages(displayMessages: DisplayMessage[]): ApiMessage[] {
  return displayMessages.map((msg) => {
    const hasMedia = !!(msg.images?.length || msg.docs?.length);
    if (msg.role === "assistant" || !hasMedia) {
      return { role: msg.role, content: msg.text };
    }
    const content: ApiContent[] = [];

    msg.images?.forEach((img) => {
      content.push({
        type: "image",
        source: { type: "base64", media_type: img.mediaType, data: img.base64 },
      });
    });

    msg.docs?.forEach((doc) => {
      if (doc.mediaType === "application/pdf") {
        content.push({
          type: "document",
          title: doc.name,
          source: { type: "base64", media_type: "application/pdf", data: doc.data },
        });
      } else {
        content.push({
          type: "document",
          title: doc.name,
          source: { type: "text", media_type: "text/plain", data: doc.data },
        });
      }
    });

    // Always include a text block — Claude requires at least one.
    content.push({
      type: "text",
      text: msg.text.trim() || "Please consider what I've shared and guide my style.",
    });
    return { role: "user", content };
  });
}

// Strip markdown asterisk formatting — the curator writes plain prose,
// so **bold** and *italic* syntax should never appear as literal characters.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}

function AssistantMessage({
  message,
}: {
  message: DisplayMessage;
}) {
  return (
    <div className="flex px-6 md:px-10 py-3">
      <div className="max-w-2xl">
        <div
          className={`font-sans text-[15px] leading-7 prose-curator ${
            message.isStreaming ? "streaming-cursor" : ""
          }`}
          style={{ whiteSpace: "pre-wrap", color: "#1A120A", letterSpacing: "0", fontFamily: "var(--font-inter)" }}
        >
          {message.text ? (
            stripMarkdown(message.text)
          ) : (
            <span className="italic text-xs" style={{ color: "rgba(26,18,10,0.4)" }}>
              Considering your aesthetic...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: DisplayMessage }) {
  return (
    <div className="flex flex-col items-end gap-2 px-6 md:px-10 py-2">
      {/* Images */}
      {message.images && message.images.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end max-w-sm">
          {message.images.map((img, i) => (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{
                border: "1px solid rgba(201,168,76,0.2)",
                width: message.images!.length === 1 ? "180px" : "120px",
                height: message.images!.length === 1 ? "180px" : "120px",
              }}
            >
              <Image
                src={img.dataUrl}
                alt="Reference"
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Document chips */}
      {message.docs && message.docs.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          {message.docs.map((doc, i) => (
            <div
              key={i}
              className="flex items-center gap-2"
              style={{
                maxWidth: 220,
                padding: "6px 10px",
                borderRadius: "10px",
                background: "rgba(248,243,234,0.7)",
                border: "1px solid rgba(26,18,10,0.12)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,10,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="truncate" style={{ fontFamily: "var(--font-inter)", fontSize: "12.5px", color: "rgba(26,18,10,0.8)" }} title={doc.name}>
                {doc.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Text bubble — right-aligned, faint warm background to distinguish from AI */}
      {message.text.trim() && (
        <div
          style={{
            background: "rgba(228,220,206,0.52)",
            border: "1px solid rgba(26,18,10,0.07)",
            padding: "10px 14px",
            borderRadius: "16px",
            maxWidth: "min(420px, 85%)",
          }}
        >
          <p
            className="text-[15px] leading-7"
            style={{ color: "rgba(26,18,10,0.92)", letterSpacing: "0", fontFamily: "var(--font-inter)" }}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-24">
      <p className="text-[13px] tracking-wide max-w-xs leading-relaxed" style={{ color: "rgba(26,18,10,0.55)", fontFamily: "var(--font-inter)" }}>
        Describe the aesthetic you want to embody. Or, share images that speak
        to you — editorials, street photography, film stills, interiors.
      </p>
      <div className="mt-3 flex items-center gap-3" style={{ opacity: 0.55, filter: "brightness(1.15)" }}>
        <div
          className="w-12 h-px"
          style={{ background: "rgba(26,18,10,0.55)" }}
        />
        <Image
          src="/swan-logo.png"
          alt="Ordre"
          width={24}
          height={17}
          style={{ objectFit: "contain", display: "block" }}
        />
        <div
          className="w-12 h-px"
          style={{ background: "rgba(26,18,10,0.55)" }}
        />
      </div>
    </div>
  );
}

export default function CuratorPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<MessageImage[]>([]);
  const [pendingDocs, setPendingDocs] = useState<MessageDoc[]>([]);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntake, setShowIntake] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiNotes, setAiNotes] = useState<AiNotes>(EMPTY_NOTES);
  const [clientName, setClientName] = useState<string>("");
  const [plusOpen, setPlusOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [welcomed, setWelcomed] = useState(false);
  const [inputExpanded, setInputExpanded] = useState(false);
  // Gate the first paint until we've checked storage, so returning clients
  // don't see a flash of the intake before it's skipped.
  const [hydrated, setHydrated] = useState(false);

  // Keep localStorage cache in sync with the active conversation so a hard
  // refresh can always restore the current state without a network round-trip.
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const title = conversations.find(c => c.id === conversationId)?.title ?? "";
    saveConvCache(conversationId, title, messages.map(m => ({ id: m.id, role: m.role, text: m.text })));
  }, [messages, conversationId, conversations]);

  // Load a saved aesthetic profile — a returning client skips the intake.
  // Try Supabase first (signed-in users), fall back to localStorage.
  useEffect(() => {
    async function loadProfile() {
      const fromSupabase = await loadProfileFromSupabase();
      if (fromSupabase) {
        setUserProfile(fromSupabase);
        setShowIntake(false);
        saveProfileToStorage(fromSupabase); // keep local cache in sync
      } else {
        const fromStorage = loadProfileFromStorage();
        if (fromStorage) {
          setUserProfile(fromStorage);
          setShowIntake(false);
        }
      }
      setAiNotes(getAiNotes());
      const account = getAccount();
      if (account?.name) setClientName(account.name);

      // Sync notepad from Supabase into localStorage so the sidebar and AI
      // context always reflect the latest saved content across devices.
      loadNotepadFromSupabase().then(remote => {
        if (remote !== null) {
          try { localStorage.setItem(NOTEPAD_KEY, remote); } catch {}
        }
      });

      // Check welcomed flag before loading conversations
      if (loadWelcomed()) setWelcomed(true);

      // Load conversation history. Supabase is authoritative; localStorage cache
      // covers the gap when a refresh races the async DB writes.
      const cached = loadConvCache();
      const convos = await listConversations();

      if (convos.length > 0) {
        // They've had prior conversations — they've already seen the welcome
        setWelcomed(true);
        saveWelcomed();
        const cachedMissing = cached && !convos.find(c => c.id === cached.id);
        if (cachedMissing && cached!.messages.length > 0) {
          // The cached conversation hasn't made it to Supabase yet — show it
          // immediately and flush it to Supabase in the background.
          const c = cached!;
          setConversationId(c.id);
          setMessages(c.messages.map(m => ({ id: m.id, role: m.role as "user" | "assistant", text: m.text })));
          setConversations([
            { id: c.id, title: c.title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ...convos,
          ]);
          (async () => {
            const saved = await createConversation(c.title, c.id);
            if (saved) {
              for (const m of c.messages) await saveMessage(c.id, m.role as "user" | "assistant", m.text);
            }
          })();
        } else {
          // Supabase has the conversation — it's authoritative. Load the one
          // the user was most recently in (prefer cached id if present).
          setConversations(convos);
          const target = cached ? (convos.find(c => c.id === cached.id) ?? convos[0]) : convos[0];
          const msgs = await loadConversationMessages(target.id);
          if (msgs.length > 0) {
            setConversationId(target.id);
            setMessages(msgs.map(m => ({ id: m.id, role: m.role, text: m.content })));
          }
          clearConvCache();
        }
      } else if (cached && cached.messages.length > 0) {
        // No Supabase conversations at all (guest or fast refresh) — restore
        // from cache and attempt to flush to Supabase.
        const c = cached;
        setConversationId(c.id);
        setMessages(c.messages.map(m => ({ id: m.id, role: m.role as "user" | "assistant", text: m.text })));
        setConversations([{ id: c.id, title: c.title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
        (async () => {
          const saved = await createConversation(c.title, c.id);
          if (saved) {
            for (const m of c.messages) await saveMessage(c.id, m.role as "user" | "assistant", m.text);
          }
        })();
      }

      setHydrated(true);
    }
    loadProfile();
  }, []);

  const completeIntake = useCallback((p: UserProfile) => {
    setUserProfile(p);
    setShowIntake(false);
    saveProfileToStorage(p);
    saveProfileToSupabase(p); // fire-and-forget — session still works if this fails
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);

  // Close the + menu when clicking anywhere outside it.
  useEffect(() => {
    if (!plusOpen) return;
    const onDown = (e: MouseEvent) => {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setPlusOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [plusOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus the composer the moment the chat opens, so a caret blinks immediately
  // — a small signal that the curator is live and ready to receive.
  useEffect(() => {
    if (showIntake) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [showIntake]);

  const handleFilesSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      let files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      const isFolderUpload = files.some((f) => !!f.webkitRelativePath);

      // Allowlist only — anything not explicitly known-safe is rejected.
      // Matched on BOTH mime and extension so a spoofed type can't sneak through.
      // SVG is excluded deliberately: it can carry script/XSS and isn't needed.
      const isImage = (f: File) =>
        f.type.startsWith("image/") &&
        f.type !== "image/svg+xml" &&
        /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif|tiff?)$/i.test(f.name);
      const isPdf = (f: File) =>
        (f.type === "application/pdf" || f.type === "") && /\.pdf$/i.test(f.name);
      const isText = (f: File) =>
        (f.type.startsWith("text/") || f.type === "") && /\.(txt|md|csv)$/i.test(f.name);
      const isSupported = (f: File) => isImage(f) || isPdf(f) || isText(f);
      const overSized = (f: File) =>
        (isImage(f) && f.size > MAX_IMAGE_BYTES) ||
        (isPdf(f) && f.size > MAX_PDF_BYTES) ||
        (isText(f) && f.size > MAX_TEXT_BYTES);
      const baseName = (f: File) => (f.webkitRelativePath || f.name).split("/").pop() || f.name;
      const isIgnorable = (f: File) => {
        const n = baseName(f);
        return n.startsWith(".") || /^(Thumbs\.db|desktop\.ini)$/i.test(n);
      };
      const readBase64 = (f: File) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(f);
        });

      const reset = () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      };

      // Drop system/hidden files (e.g. .DS_Store) so they don't fail a folder.
      files = files.filter((f) => !isIgnorable(f));
      if (!files.length) {
        reset();
        return;
      }

      // A folder is all-or-nothing: reject the whole folder if it is too large,
      // or holds anything we can't safely read (a Word doc, an executable,
      // an archive, an oversized file, …).
      if (isFolderUpload) {
        if (files.length > MAX_FILES_PER_ADD) {
          setFileNotice(`Folder not added — too many files (max ${MAX_FILES_PER_ADD})`);
          reset();
          return;
        }
        const bad = files.find((f) => !isSupported(f));
        if (bad) {
          setFileNotice(`Folder not added — ${baseName(bad)} cannot be read. Only images, PDFs, and text files are allowed`);
          reset();
          return;
        }
        const big = files.find((f) => overSized(f));
        if (big) {
          setFileNotice(`Folder not added — ${baseName(big)} is too large`);
          reset();
          return;
        }
      } else if (files.length > MAX_FILES_PER_ADD) {
        files = files.slice(0, MAX_FILES_PER_ADD);
        setFileNotice(`Only the first ${MAX_FILES_PER_ADD} files were added`);
      }

      const skipped: string[] = [];
      const tooBig: string[] = [];
      for (const file of files) {
        try {
          if (!isSupported(file)) {
            skipped.push(baseName(file));
            continue;
          }
          if (overSized(file)) {
            tooBig.push(baseName(file));
            continue;
          }
          if (isImage(file)) {
            // processImage decodes the pixels and re-encodes to JPEG via canvas,
            // which also strips any metadata/embedded payload. A non-image that
            // slipped past the allowlist fails to decode and is caught below.
            const processed = await processImage(file);
            setPendingImages((prev) =>
              prev.length >= MAX_ATTACHMENTS ? prev : [...prev, processed]
            );
          } else if (isPdf(file)) {
            const data = await readBase64(file);
            setPendingDocs((prev) =>
              prev.length >= MAX_ATTACHMENTS
                ? prev
                : [...prev, { name: baseName(file), mediaType: "application/pdf", data }]
            );
          } else if (isText(file)) {
            const data = await file.text();
            setPendingDocs((prev) =>
              prev.length >= MAX_ATTACHMENTS
                ? prev
                : [...prev, { name: baseName(file), mediaType: "text/plain", data }]
            );
          }
        } catch {
          skipped.push(baseName(file));
        }
      }

      if (tooBig.length) {
        setFileNotice(`${tooBig[0]} is too large`);
      } else if (skipped.length) {
        setFileNotice(`${skipped.join(", ")} cannot be read. Only .pdf documents are supported`);
      }

      reset();
    },
    []
  );

  // Auto-dismiss the unsupported-file notice.
  useEffect(() => {
    if (!fileNotice) return;
    const t = setTimeout(() => setFileNotice(null), 6000);
    return () => clearTimeout(t);
  }, [fileNotice]);

  const removeImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeDoc = useCallback((index: number) => {
    setPendingDocs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Open the hidden file input configured for the chosen source.
  const openPicker = useCallback((opts: { accept?: string; directory?: boolean }) => {
    const el = fileInputRef.current;
    if (!el) return;
    el.accept = opts.accept ?? "";
    if (opts.directory) el.setAttribute("webkitdirectory", "");
    else el.removeAttribute("webkitdirectory");
    el.value = "";
    el.click();
    setPlusOpen(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    const text = input.trim();
    if (!text && !pendingImages.length && !pendingDocs.length) return;

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      images: pendingImages.length ? [...pendingImages] : undefined,
      docs: pendingDocs.length ? [...pendingDocs] : undefined,
    };

    const assistantMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
      isStreaming: true,
    };

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, assistantMessage]);
    setInput("");
    setPendingImages([]);
    setPendingDocs([]);
    setInputExpanded(false);
    setIsLoading(true);

    // Create conversation in DB before saving any messages (foreign key requirement).
    // The sidebar update is optimistic (immediate). We also write to localStorage
    // synchronously so a refresh within the async window still restores the convo.
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const title = text.slice(0, 60) || "New conversation";
      const newId = crypto.randomUUID();
      activeConversationId = newId;
      setConversationId(newId);
      setConversations((prev) => [
        { id: newId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ...prev,
      ]);
      // Write to cache synchronously before any network calls — survives an
      // immediate refresh even if the Supabase writes haven't landed yet.
      saveConvCache(newId, title, newMessages.map(m => ({ id: m.id, role: m.role, text: m.text })));
      await createConversation(title, newId);
    }

    // Save user message before making the API call so a refresh preserves it
    if (activeConversationId && text) {
      await saveMessage(activeConversationId, "user", text);
    }

    try {
      const apiMessages = buildApiMessages(newMessages);

      // Prepend wardrobe + moodboard context so the AI can see the actual items
      const wardrobeContext = await buildWardrobeContext();
      const contextMessages: ApiMessage[] = wardrobeContext
        ? [
            { role: "user", content: wardrobeContext },
            { role: "assistant", content: "I can see your wardrobe and moodboard. I'll draw on these throughout our conversation — referencing the specific pieces and visual references you've stored." },
          ]
        : [];
      const messagesWithContext = [...contextMessages, ...apiMessages];

      const response = await fetch("/api/curator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesWithContext,
          welcomed,
          profile: [
            userProfile ? buildProfileDescription(userProfile) : "",
            buildNotesDescription(aiNotes),
            clientName ? `The client's name is ${clientName}. They are a known client — greet them by name on the first message and do not introduce yourself.` : "",
            (() => { try { const n = localStorage.getItem("ordre.notepad.v1"); return n?.trim() ? `The client has left themselves the following personal notes (their own reminders and thoughts — use them as context if relevant, but don't repeat them back verbatim):\n${n.trim()}` : ""; } catch { return ""; } })(),
          ]
            .filter(Boolean)
            .join("\n\n"),
        }),
      });

      if (response.status === 429) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: "You're moving a little quickly — give me a moment, then try again.",
            isStreaming: false,
          };
          return updated;
        });
        return;
      }

      if (!response.ok) throw new Error("API error");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamedText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: streamedText,
          };
          return updated;
        });
      }

      // Mark streaming as done and save assistant message
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });
      if (activeConversationId && streamedText) {
        saveMessage(activeConversationId, "assistant", streamedText);

        // After the very first-ever response, mark the client as welcomed
        // so no future conversation opens with the greeting again.
        if (!welcomed) {
          setWelcomed(true);
          saveWelcomed();
        }

        // Generate a proper title after the first exchange
        if (messages.length === 0 && text) {
          fetch("/api/conversation-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
          })
            .then((r) => r.json())
            .then(({ title }) => {
              if (title && activeConversationId) {
                updateConversationTitle(activeConversationId, title);
                setConversations((prev) =>
                  prev.map((c) => c.id === activeConversationId ? { ...c, title } : c)
                );
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: "Something went wrong. Please try again.",
          isStreaming: false,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, pendingImages, pendingDocs, messages, isLoading, userProfile, aiNotes, clientName, conversationId, welcomed]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      const newHeight = Math.min(el.scrollHeight, 160);
      el.style.height = newHeight + "px";
      setInputExpanded(newHeight > 32);
    },
    []
  );

  const handleSelectConversation = async (id: string) => {
    const msgs = await loadConversationMessages(id);
    setMessages(msgs.map((m) => ({ id: m.id, role: m.role, text: m.content })));
    setConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    setConversations(prev => prev.filter(x => x.id !== id));
    if (conversationId === id) { setConversationId(null); setMessages([]); }
  };

  const handleNewConversation = () => {
    clearConvCache();
    setMessages([]);
    setConversationId(null);
    // Refresh conversation list so any pending title updates are reflected
    listConversations().then(updated => {
      if (updated.length > 0) setConversations(updated);
    }).catch(() => {});
  };

  const handleRenameConversation = async (id: string, title: string) => {
    await updateConversationTitle(id, title);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  // Refresh the conversation list every 5 minutes so new sessions surface automatically
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await listConversations();
      setConversations(updated);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex h-screen relative"
    >
      {/* Transcript background — the Ordre stationery card (swan letterhead at top,
          framed parchment), shown crisp behind the conversation. */}
      <div aria-hidden style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgb(245,240,232)",
        backgroundImage: "url('/backgroundchat.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Profile intake overlay — held back until storage is checked so a
          returning client never flashes the intake before it's skipped. */}
      {hydrated && showIntake && <ProfileIntake onComplete={completeIntake} />}

      {/* Left sidebar toolbar */}
      <LeftSidebar
        conversations={conversations}
        conversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
      />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ position: "relative" }}>

      {/* Profile overlay — account gate + curated profile with stylist notes */}
      {showProfile && (
        <ProfilePanel
          userProfile={userProfile}
          onClose={() => setShowProfile(false)}
          onRefineAesthetic={() => {
            setShowProfile(false);
            setShowIntake(true);
          }}
          onNotesChange={setAiNotes}
        />
      )}

      {/* Header — hidden during intake */}
      <header
        className="flex-shrink-0 flex items-center justify-end px-6 md:px-10 py-4"
        style={{
          display: showIntake ? "none" : undefined,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Link
          href="/"
          className="group flex items-center"
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/webfont3e.png"
            alt="ORDRE"
            style={{ height: "15px", width: "auto", display: "block" }}
          />
        </Link>

        <div className="flex items-center gap-5">
          {/* Profile — opens the client's profile (account + stylist notes) */}
          <button
            onClick={() => setShowProfile(true)}
            style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.5rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(26,18,10,0.45)",
              background: "none",
              border: "none",
              paddingBottom: "1px",
              borderBottom: "1px solid rgba(26,18,10,0.18)",
              transition: "color 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(26,18,10,0.8)";
              e.currentTarget.style.borderBottomColor = "rgba(26,18,10,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(26,18,10,0.45)";
              e.currentTarget.style.borderBottomColor = "rgba(26,18,10,0.18)";
            }}
          >
            Profile
          </button>

          {/* Data & privacy — reach the erasure control from inside the app */}
          <Link
            href="/privacy"
            style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.5rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(26,18,10,0.45)",
              textDecoration: "none",
              paddingBottom: "1px",
              borderBottom: "1px solid rgba(26,18,10,0.18)",
              transition: "color 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(26,18,10,0.8)";
              e.currentTarget.style.borderBottomColor = "rgba(26,18,10,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(26,18,10,0.45)";
              e.currentTarget.style.borderBottomColor = "rgba(26,18,10,0.18)";
            }}
          >
            Privacy
          </Link>
        </div>
      </header>

      {/* Messages area — hidden during intake */}
      <div className="flex-1 overflow-y-auto" style={{ visibility: showIntake ? "hidden" : "visible", position: "relative", zIndex: 1 }}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="py-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "assistant" ? (
                  <AssistantMessage message={msg} />
                ) : (
                  <UserMessage message={msg} />
                )}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area — hidden during intake */}
      <div
        className="flex-shrink-0"
        style={{
          display: showIntake ? "none" : undefined,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Unsupported-file hint */}
        {fileNotice && (
          <div className="px-6 md:px-10 pt-3 pb-0">
            <div
              className="flex items-start gap-2"
              style={{
                maxWidth: 460,
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(120,80,30,0.06)",
                border: "1px solid rgba(120,80,30,0.16)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(120,80,30,0.65)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "12.5px", lineHeight: 1.5, color: "rgba(26,18,10,0.7)" }}>
                {fileNotice}
              </span>
              <button
                onClick={() => setFileNotice(null)}
                className="flex-shrink-0"
                style={{ color: "rgba(26,18,10,0.4)", fontSize: "12px", lineHeight: 1, padding: "0 2px", marginLeft: "auto" }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Image previews */}
        {pendingImages.length > 0 && (
          <div
            className="flex gap-2 px-6 md:px-10 pt-3 pb-0 flex-wrap"
          >
            {pendingImages.map((img, i) => (
              <div
                key={i}
                className="relative group"
                style={{
                  width: 56,
                  height: 56,
                  border: "1px solid rgba(201,168,76,0.25)",
                }}
              >
                <Image
                  src={img.dataUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <span className="text-cream text-xs">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Document chips */}
        {pendingDocs.length > 0 && (
          <div className="flex gap-2 px-6 md:px-10 pt-3 pb-0 flex-wrap">
            {pendingDocs.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  maxWidth: 220,
                  padding: "6px 10px",
                  borderRadius: "10px",
                  background: "rgba(248,243,234,0.7)",
                  border: "1px solid rgba(26,18,10,0.12)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,10,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span
                  className="truncate"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "12.5px", color: "rgba(26,18,10,0.8)" }}
                  title={doc.name}
                >
                  {doc.name}
                </span>
                <button
                  onClick={() => removeDoc(i)}
                  className="flex-shrink-0"
                  style={{ color: "rgba(26,18,10,0.4)", fontSize: "12px", lineHeight: 1, padding: "0 2px" }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 md:px-10 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          {/* Composer — thin inline bar: + | textarea | send */}
          <div
            className="flex items-center gap-2"
            style={{
              borderRadius: inputExpanded ? "18px" : "999px",
              padding: "7px 8px 7px 6px",
              background: "rgba(244,237,224,0.95)",
              border: "1px solid rgba(26,18,10,0.22)",
              boxShadow: "0 6px 20px -14px rgba(40,28,12,0.28)",
              transition: "border-radius 0.15s ease",
              alignItems: inputExpanded ? "flex-end" : "center",
            }}
          >
              {/* Attach menu (+) */}
              <div className="relative" ref={plusRef}>
                {plusOpen && (
                  <>
                    {/* menu — pops upward */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 10px)",
                        left: 0,
                        zIndex: 50,
                        minWidth: 184,
                        padding: "4px",
                        borderRadius: "12px",
                        background: "rgba(250,246,238,0.94)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(26,18,10,0.10)",
                        boxShadow: "0 18px 44px -16px rgba(40,28,12,0.42)",
                        animation: "slideUpModal 0.18s ease both",
                      }}
                    >
                      {[
                        {
                          label: "Add Photos",
                          onClick: () => openPicker({ accept: "image/*" }),
                          icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
                        },
                        {
                          label: "Add Files",
                          onClick: () => openPicker({ accept: "application/pdf,text/plain,.pdf,.txt,.md,.csv" }),
                          icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
                        },
                        {
                          label: "Add Folder",
                          onClick: () => openPicker({ directory: true }),
                          icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
                        },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={item.onClick}
                          className="w-full flex items-center gap-2.5 rounded-md transition-colors"
                          style={{
                            padding: "3px 9px",
                            fontFamily: "var(--font-inter)",
                            fontSize: "14px",
                            color: "#1A120A",
                            background: "transparent",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(26,18,10,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,10,0.62)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            {item.icon}
                          </svg>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button
                  onClick={() => setPlusOpen((o) => !o)}
                  disabled={isLoading}
                  className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-30"
                  style={{ width: 30, height: 30, border: "1px solid rgba(26,18,10,0.16)", background: plusOpen ? "rgba(26,18,10,0.06)" : "transparent" }}
                  title="Add"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,10,0.6)" strokeWidth="1.6" strokeLinecap="round" style={{ transform: plusOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s ease" }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

            {/* Text input — grows with content */}
            <textarea
              id="composer"
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 ? "Describe your vision, or share an image…" : ""}
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-[15px] disabled:opacity-40"
              style={{
                minHeight: "24px",
                maxHeight: "200px",
                lineHeight: "1.6",
                caretColor: "#1A120A",
                color: "#1A120A",
                fontFamily: "var(--font-inter)",
                resize: "none",
                outline: "none",
                padding: "0 4px",
                alignSelf: "center",
              }}
            />

              {/* Send button — appears when there's content */}
              {(!!input.trim() || pendingImages.length > 0 || pendingDocs.length > 0 || isLoading) && (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  title="Send"
                  className="flex-shrink-0 flex items-center justify-center rounded-full transition-colors duration-200"
                  style={{
                    width: 30,
                    height: 30,
                    background: "rgba(26,18,10,0.14)",
                    border: "1px solid rgba(26,18,10,0.85)",
                    animation: "fadeInOverlay 0.2s ease both",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(26,18,10,0.22)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(26,18,10,0.14)")}
                >
                  {isLoading ? (
                    <span
                      className="block w-3 h-3 rounded-full"
                      style={{ border: "1px solid rgba(26,18,10,0.25)", borderTopColor: "rgba(26,18,10,0.85)", animation: "spin 0.8s linear infinite" }}
                    />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,10,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  )}
                </button>
              )}
          </div>
        </div>

      </div>

      </div>{/* end main content column */}

      {/* Spinner keyframe */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Prompt matches the empty-state "Describe the aesthetic…" type —
           the same clean Inter the client reads and writes in. */
        textarea#composer::placeholder {
          font-family: var(--font-inter);
          font-style: normal;
          font-size: 15px;
          letter-spacing: 0;
          color: rgba(26,18,10,0.42);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
