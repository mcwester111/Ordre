"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

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

function buildApiMessages(displayMessages: DisplayMessage[]): ApiMessage[] {
  return displayMessages.map((msg) => {
    if (msg.role === "assistant" || !msg.images?.length) {
      return { role: msg.role, content: msg.text };
    }
    const content: ApiContent[] = msg.images.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    }));
    if (msg.text.trim()) {
      content.push({ type: "text", text: msg.text });
    }
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
            "linear-gradient(to right, transparent, rgba(201,168,76,0.2))",
        }}
      />
      <span className="text-gold-dim text-[10px]">✦</span>
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(to left, transparent, rgba(201,168,76,0.2))",
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
        <span className="font-serif italic text-xs text-gold-dim tracking-wide">
          Ordre.
        </span>
      </div>

      {/* Message */}
      <div className="flex-1 max-w-2xl">
        <div
          className="relative pl-4"
          style={{
            borderLeft: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          <div
            className={`font-sans font-light text-sm leading-relaxed text-cream prose-curator ${
              message.isStreaming ? "streaming-cursor" : ""
            }`}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {message.text || (
              <span className="text-cream-muted italic text-xs">
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
            background: "rgba(201,168,76,0.06)",
            border: "1px solid rgba(201,168,76,0.15)",
          }}
        >
          <p className="font-sans font-light text-sm text-cream leading-relaxed">
            {message.text}
          </p>
        </div>
      )}

      {/* Label */}
      <span className="font-sans text-[10px] tracking-wider uppercase text-cream-muted opacity-40">
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
            borderColor: "rgba(201,168,76,0.4)",
            background:
              "linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.08) 100%)",
          }}
        />
      </div>
      <h2 className="font-serif text-3xl italic text-cream-dim mb-3">
        Begin your curation
      </h2>
      <p className="font-sans font-light text-xs tracking-wide text-cream-muted max-w-xs leading-relaxed">
        Share images that speak to you — editorials, street photography, film
        stills, interiors. Or describe the aesthetic you want to embody.
      </p>
      <div className="mt-8 flex items-center gap-3 opacity-30">
        <div
          className="w-12 h-px"
          style={{ background: "rgba(201,168,76,0.5)" }}
        />
        <span className="text-gold text-[10px]">✦</span>
        <div
          className="w-12 h-px"
          style={{ background: "rgba(201,168,76,0.5)" }}
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      files.forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          setPendingImages((prev) => [
            ...prev,
            { dataUrl, mediaType: file.type, base64 },
          ]);
        };
        reader.readAsDataURL(file);
      });

      // Reset input so same file can be re-added
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
        body: JSON.stringify({ messages: apiMessages }),
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
  }, [input, pendingImages, messages, isLoading]);

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
      style={{ background: "#080705" }}
    >
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          borderBottom: "1px solid rgba(201,168,76,0.12)",
          background: "rgba(8,7,5,0.95)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link href="/" className="group flex items-center gap-3">
          <span className="font-serif text-xl text-cream transition-colors duration-300 group-hover:text-gold-light">
            Ordre.
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-gold opacity-60"
            style={{ animation: isLoading ? "none" : undefined }}
          />
          <span className="font-sans text-[10px] tracking-widest uppercase text-cream-muted opacity-50">
            {isLoading ? "Curating" : "Active"}
          </span>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
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

      {/* Input area */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: "1px solid rgba(201,168,76,0.12)",
          background: "rgba(8,7,5,0.98)",
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
          {/* Image upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-colors duration-200 disabled:opacity-30"
            style={{
              border: "1px solid rgba(201,168,76,0.2)",
              color: "rgba(201,168,76,0.5)",
            }}
            title="Attach images"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
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
            className="flex-1 bg-transparent font-sans font-light text-sm text-cream placeholder:text-cream-muted placeholder:opacity-30 disabled:opacity-40 py-2"
            style={{
              minHeight: "36px",
              maxHeight: "160px",
              lineHeight: "1.6",
              caretColor: "#c9a84c",
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!input.trim() && !pendingImages.length)}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-all duration-300 disabled:opacity-20 group"
            style={{
              border: "1px solid rgba(201,168,76,0.35)",
              background:
                isLoading || (!input.trim() && !pendingImages.length)
                  ? "transparent"
                  : "rgba(201,168,76,0.08)",
            }}
          >
            {isLoading ? (
              <span
                className="block w-3 h-3 border border-gold-dim border-t-gold rounded-full"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(201,168,76,0.7)"
                strokeWidth="1.5"
                className="transition-colors duration-200 group-hover:stroke-gold"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="pb-3 px-6 md:px-10 font-sans text-[10px] tracking-wide text-cream-muted opacity-20">
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
