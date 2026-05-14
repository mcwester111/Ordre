"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProfileIntake, { UserProfile, buildProfileDescription } from "@/components/ProfileIntake";

type MessageImage = {
  dataUrl: string;
  mediaType: string;
  base64: string;
};

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: MessageImage[];
  isStreaming?: boolean;
};

type ApiContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

type ApiMessage = {
  role: "user" | "assistant";
  content: string | ApiContent[];
};

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

function buildApiMessages(displayMessages: DisplayMessage[]): ApiMessage[] {
  return displayMessages.map((msg) => {
    if (msg.role === "assistant" || !msg.images?.length) {
      return { role: msg.role, content: msg.text };
    }
    const content: ApiContent[] = msg.images.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    }));
    // Always include a text block — Claude requires at least one
    content.push({ type: "text", text: msg.text.trim() || "Please analyse these images and guide my style." });
    return { role: "user", content };
  });
}

function OrnamentDivider() {
  return (
    <div className="flex items-center gap-3 my-8 px-6 md:px-10">
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(110,80,40,0.2))",
        }}
      />
      <span className="text-[10px]" style={{ color: "rgba(110,80,40,0.4)" }}>✦</span>
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(to left, transparent, rgba(110,80,40,0.2))",
        }}
      />
    </div>
  );
}

function AssistantMessage({
  message,
}: {
  message: DisplayMessage;
}) {
  return (
    <div className="flex gap-4 px-6 md:px-10 py-2">
      {/* Label */}
      <div className="flex-shrink-0 w-16 pt-1 hidden md:block">
        <span className="font-serif italic text-xs tracking-wide" style={{ color: "rgba(100,65,15,0.6)" }}>
          Ordre.
        </span>
      </div>

      {/* Message */}
      <div className="flex-1 max-w-2xl">
        <div
          className="relative pl-4"
          style={{
            borderLeft: "1px solid rgba(110,80,40,0.2)",
          }}
        >
          <div
            className={`font-sans font-light text-sm leading-relaxed prose-curator ${
              message.isStreaming ? "streaming-cursor" : ""
            }`}
            style={{ whiteSpace: "pre-wrap", color: "#1A120A" }}
          >
            {message.text || (
              <span className="italic text-xs" style={{ color: "rgba(26,18,10,0.4)" }}>
                Considering your aesthetic...
              </span>
            )}
          </div>
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

      {/* Text */}
      {message.text.trim() && (
        <div
          className="max-w-sm px-4 py-3"
          style={{
            background: "rgba(110,80,40,0.05)",
            border: "1px solid rgba(110,80,40,0.15)",
          }}
        >
          <p className="font-sans font-light text-sm leading-relaxed" style={{ color: "#1A120A" }}>
            {message.text}
          </p>
        </div>
      )}

      {/* Label */}
      <span className="font-sans text-[10px] tracking-wider uppercase" style={{ color: "rgba(26,18,10,0.35)" }}>
        You
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-24">
      <div className="mb-8 opacity-20">
        <div
          className="w-16 h-16 border mx-auto"
          style={{
            borderColor: "rgba(110,80,40,0.4)",
            background:
              "linear-gradient(135deg, transparent 40%, rgba(110,80,40,0.06) 100%)",
          }}
        />
      </div>
      <h2 className="font-serif text-3xl italic mb-3" style={{ color: "rgba(26,18,10,0.65)" }}>
        Begin your curation
      </h2>
      <p className="font-sans font-light text-xs tracking-wide max-w-xs leading-relaxed" style={{ color: "rgba(26,18,10,0.45)" }}>
        Share images that speak to you — editorials, street photography, film
        stills, interiors. Or describe the aesthetic you want to embody.
      </p>
      <div className="mt-8 flex items-center gap-3 opacity-30">
        <div
          className="w-12 h-px"
          style={{ background: "rgba(110,80,40,0.5)" }}
        />
        <span className="text-[10px]" style={{ color: "rgba(110,80,40,0.8)" }}>✦</span>
        <div
          className="w-12 h-px"
          style={{ background: "rgba(110,80,40,0.5)" }}
        />
      </div>
    </div>
  );
}

export default function CuratorPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<MessageImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntake, setShowIntake] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const processed = await processImage(file);
          setPendingImages((prev) => [...prev, processed]);
        } catch {
          console.error("Failed to process image");
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    const text = input.trim();
    if (!text && !pendingImages.length) return;

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      images: pendingImages.length ? [...pendingImages] : undefined,
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
    setIsLoading(true);

    try {
      const apiMessages = buildApiMessages(newMessages);

      const response = await fetch("/api/curator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          profile: userProfile ? buildProfileDescription(userProfile) : "",
        }),
      });

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

      // Mark streaming as done
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });
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
  }, [input, pendingImages, messages, isLoading, userProfile]);

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
      // Auto-resize
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    },
    []
  );

  return (
    <div
      className="flex flex-col h-screen"
    >
      {/* Profile intake overlay */}
      {showIntake && (
        <ProfileIntake
          onComplete={(p) => {
            setUserProfile(p);
            setShowIntake(false);
          }}
        />
      )}

      {/* Header — hidden during intake */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          display: showIntake ? "none" : undefined,
          borderBottom: "1px solid rgba(110,80,40,0.15)",
          background: "rgba(245,240,232,0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link href="/" className="group flex items-center gap-3">
          <span className="font-serif text-xl transition-colors duration-300" style={{ color: "#1A120A" }}>
            Ordre.
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full opacity-60"
            style={{ background: "rgba(100,65,15,0.7)" }}
          />
          <span className="font-sans text-[10px] tracking-widest uppercase" style={{ color: "rgba(26,18,10,0.4)" }}>
            {isLoading ? "Curating" : "Active"}
          </span>
        </div>
      </header>

      {/* Messages area — hidden during intake */}
      <div className="flex-1 overflow-y-auto" style={{ visibility: showIntake ? "hidden" : "visible" }}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="py-6">
            {messages.map((msg, index) => (
              <div key={msg.id}>
                {index > 0 &&
                  msg.role === "user" &&
                  messages[index - 1].role === "assistant" && (
                    <OrnamentDivider />
                  )}
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
          borderTop: "1px solid rgba(110,80,40,0.15)",
          background: "rgba(245,240,232,0.97)",
          backdropFilter: "blur(20px)",
        }}
      >
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

        <div className="flex items-end gap-3 px-6 md:px-10 py-4">
          {/* Image upload — Art Nouveau square button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: "max-content" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 flex items-center justify-center transition-all duration-300 disabled:opacity-30 group"
            style={{
              width: 38,
              height: 38,
              border: "1px solid rgba(110,80,40,0.15)",
              background: "rgba(110,80,40,0.02)",
            }}
            title="Attach image"
          >
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none"
              stroke="rgba(110,80,40,0.55)" strokeWidth="0.42" strokeLinecap="round"
              className="transition-all duration-300"
            >
              {/* Outer border ring */}
              <circle cx="20" cy="20" r="18.5" />

              {/* Cusped Gothic scallop border — 16 sharp cusps */}
              {(() => {
                const n = 16, Ro = 17, Ri = 14.8;
                const pts: string[] = [];
                for (let i = 0; i <= n; i++) {
                  const ap = 2 * Math.PI * i / n;
                  const am = 2 * Math.PI * (i + 0.5) / n;
                  const xp = 20 + Ro * Math.cos(ap), yp = 20 + Ro * Math.sin(ap);
                  const xm = 20 + Ri * Math.cos(am), ym = 20 + Ri * Math.sin(am);
                  if (i === 0) pts.push(`M${xp.toFixed(2)} ${yp.toFixed(2)}`);
                  else pts.push(`L${xp.toFixed(2)} ${yp.toFixed(2)}`);
                  if (i < n) pts.push(`L${xm.toFixed(2)} ${ym.toFixed(2)}`);
                }
                return <path d={pts.join(' ')} strokeOpacity="0.38" />;
              })()}

              {/* 12 primary Gothic lancets — pointed-arch Bézier curves */}
              {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => (
                <path key={deg}
                  d="M -1.15 5.5 C -2.4 0.5 -0.65 -12.4 0 -13.2 C 0.65 -12.4 2.4 0.5 1.15 5.5"
                  transform={`translate(20 20) rotate(${deg + 90})`}
                  strokeOpacity="0.7"
                />
              ))}

              {/* 12 secondary lancets at 15° offset — shorter, more delicate */}
              {[15,45,75,105,135,165,195,225,255,285,315,345].map(deg => (
                <path key={deg}
                  d="M -0.72 8.2 C -1.5 4.2 -0.38 -6.8 0 -7.6 C 0.38 -6.8 1.5 4.2 0.72 8.2"
                  transform={`translate(20 20) rotate(${deg + 90})`}
                  strokeOpacity="0.28"
                />
              ))}

              {/* Inner tracery ring */}
              <circle cx="20" cy="20" r="5.2" strokeOpacity="0.25" />

              {/* Central 6-petal rosette — tiny lancets */}
              {[0,60,120,180,240,300].map(deg => (
                <path key={deg}
                  d="M -0.52 1.35 C -1.05 0.35 -0.28 -2.4 0 -2.7 C 0.28 -2.4 1.05 0.35 0.52 1.35"
                  transform={`translate(20 20) rotate(${deg + 90})`}
                  strokeOpacity="0.9"
                />
              ))}

              {/* Oculus */}
              <circle cx="20" cy="20" r="0.65" />
            </svg>
          </button>
          <span style={{
            display: "block",
            fontFamily: "var(--font-jost)",
            fontSize: "0.45rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(110,80,40,0.4)",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}>add image</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe your vision, or share an image…"
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent font-sans font-light text-sm disabled:opacity-40 py-2"
            style={{
              minHeight: "36px",
              maxHeight: "160px",
              lineHeight: "1.6",
              caretColor: "#1A120A",
              color: "#1A120A",
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!input.trim() && !pendingImages.length)}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-all duration-300 disabled:opacity-20 group"
            style={{
              border: "1px solid rgba(110,80,40,0.3)",
              background:
                isLoading || (!input.trim() && !pendingImages.length)
                  ? "transparent"
                  : "rgba(110,80,40,0.06)",
            }}
          >
            {isLoading ? (
              <span
                className="block w-3 h-3 rounded-full"
                style={{ border: "1px solid rgba(110,80,40,0.3)", borderTopColor: "rgba(110,80,40,0.8)", animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(110,80,40,0.6)"
                strokeWidth="1.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="pb-3 px-6 md:px-10 font-sans text-[10px] tracking-wide opacity-30" style={{ color: "rgba(26,18,10,0.5)" }}>
          Return to send &nbsp;·&nbsp; Shift + Return for new line
        </p>
      </div>

      {/* Spinner keyframe */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
