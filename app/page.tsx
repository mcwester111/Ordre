"use client";

import { useState } from "react";
import GarmentCard from "./components/GarmentCard";

export default function Home() {
const [garments, setGarments] = useState<
  { name: string; category: string; image: string | null }[]
>([]);

const [prompt, setPrompt] = useState("");
const [image, setImage] = useState<string | null>(null);
const [hasStarted, setHasStarted] = useState(false);
const [messages, setMessages] = useState<
  { role: "user" | "ai"; content: string }[]
>([
  { role: "ai", content: "What style do you want to embody?" },
]);
function addGarment() {
  if (!prompt || !image) return;

  setGarments([
    ...garments,
    {
      name: prompt,
      category: "",
      image,
    },
  ]);

  setPrompt("");
  setImage(null);
}

  return (
    <main className="min-h-screen text-black px-6 py-16 max-w-xl mx-auto">
     <h1 className="text-[32px] tracking-[0.3em] font-normal text-center">
  ORDRE
</h1>
<p className="text-center text-[10px] tracking-[0.4em] text-black/50 mt-3">
  FORM · STRUCTURE · PRESENCE
</p>

      {/* Input */}
    <div className="mt-16 flex flex-col gap-6">

  {/* Chat messages */}
  <div className="mt-12 flex flex-col gap-4">
    {messages.map((m, i) => (
      <p
        key={i}
        className={`text-[14px] tracking-[0.15em] text-center ${
          m.role === "ai" ? "text-black/90" : "text-black/60"
        }`}
        style={{
          opacity: 0,
          animation: "fadeIn 1.8s ease-in-out forwards",
        }}
      >
        {m.content}
      </p>
    ))}
  </div>

  {/* Input box */}
  <textarea
    className="border-b border-black/20 px-1 py-2 text-[13px] tracking-wide focus:outline-none placeholder:text-black/40 resize-none text-center"
    placeholder="Begin..."
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (prompt.trim().length === 0) return;

        const userMessage = {
          role: "user" as const,
          content: prompt,
        };

        setMessages((prev) => [...prev, userMessage]);
        setPrompt("");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: "ai", content: "Add an image." },
          ]);
        }, 500);
      }
    }}
  />

  

<label className="mt-6 block cursor-pointer group">
  <div className="relative h-44 w-full flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.01]">

    {/* Image */}
   <span className="text-[11px] tracking-[0.2em] text-black/40 group-hover:text-black/80 transition-colors duration-[4000ms] ease-in-out">
  {image ? "IMAGE ADDED" : "ADD IMAGE"}
</span>

    {/* Frame */}
    <img
  src="/frame.png"
  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity duration-[1000ms] ease-in-out"
/>

  </div>

  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setImage(url);
    }}
  />
</label>


</div>

      {/* Garments */}
     <div className="mt-16 grid grid-cols-2 gap-6">
  {garments.map((g, i) => (
    <GarmentCard
      key={i}
      name={g.name}
      category={g.category}
      image={g.image}
    />
  ))}
</div>
    </main>
  );
}