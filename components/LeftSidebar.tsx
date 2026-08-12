"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ConversationRow } from "@/lib/conversations";
import { saveNotepadToSupabase } from "@/lib/profile";

const INK = "rgba(26,18,10,0.85)";
const MUTED = "rgba(26,18,10,0.42)";
const LINE = "rgba(100,65,15,0.13)";
const GOLD = "rgba(100,65,15,0.7)";

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontSize: "0.42rem",
  fontWeight: 600,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: GOLD,
};

const INLINE_INPUT: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  borderBottom: `1px solid rgba(100,65,15,0.3)`,
  outline: "none",
  fontFamily: "var(--font-cormorant)",
  fontStyle: "italic",
  fontSize: "0.88rem",
  color: INK,
  padding: "0",
  width: "100%",
  minWidth: 0,
};

const PROJECTS_KEY  = "ordre.projects.v1";
const NOTEPAD_KEY   = "ordre.notepad.v1";

type Project = { id: string; name: string; conversationIds: string[] };

function genId() { return Math.random().toString(36).slice(2); }
function toTitleCase(s: string) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

export default function LeftSidebar({
  conversations,
  conversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onRenameConversation,
}: {
  conversations: ConversationRow[];
  conversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, title: string) => void;
}) {
  const [collapsed, setCollapsed]               = useState(false);
  const [projects, setProjects]                 = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [addingProject, setAddingProject]       = useState(false);
  const [newProject, setNewProject]             = useState("");
  const [editingKey, setEditingKey]             = useState<string | null>(null);
  const [editValue, setEditValue]               = useState("");
  const [addingConvTo, setAddingConvTo]         = useState<string | null>(null);
  const [notepadOpen, setNotepadOpen]           = useState(false);
  const [noteContent, setNoteContent]           = useState("");
  const [activeFormats, setActiveFormats]       = useState<Set<"italic" | "bullet" | "numbered">>(new Set());

  const projectInputRef   = useRef<HTMLInputElement>(null);
  const editInputRef      = useRef<HTMLInputElement>(null);
  const noteTextareaRef   = useRef<HTMLTextAreaElement>(null);
  const notepadSaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Project[];
        setProjects(parsed.map(p => ({ conversationIds: [], ...p })));
      }
    } catch { /* ignore */ }
    try {
      const note = localStorage.getItem(NOTEPAD_KEY);
      if (note) setNoteContent(note);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (notepadOpen) setTimeout(() => {
      const ta = noteTextareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 60);
  }, [notepadOpen]);

  useEffect(() => { if (addingProject) projectInputRef.current?.focus(); }, [addingProject]);
  useEffect(() => { if (editingKey) editInputRef.current?.focus(); }, [editingKey]);

  const saveProjects = (next: Project[]) => {
    setProjects(next);
    try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleNoteChange = useCallback((val: string) => {
    setNoteContent(val);
    try { localStorage.setItem(NOTEPAD_KEY, val); } catch { /* ignore */ }
    // Debounce Supabase save — fire 1.5 s after the user stops typing
    if (notepadSaveTimer.current) clearTimeout(notepadSaveTimer.current);
    notepadSaveTimer.current = setTimeout(() => saveNotepadToSupabase(val), 1500);
  }, []);

  const toggleFormat = (type: "italic" | "bullet" | "numbered") => {
    const ta = noteTextareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const val = noteContent;

    if (type === "italic") {
      const isOn = activeFormats.has("italic");
      setActiveFormats(prev => { const n = new Set(prev); isOn ? n.delete("italic") : n.add("italic"); return n; });
      // Wrap selection or insert a _ marker (opening when turning on, closing when off)
      const selected = val.slice(pos, selEnd);
      if (selected) {
        const newVal = val.slice(0, pos) + `_${selected}_` + val.slice(selEnd);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + selected.length + 2, pos + selected.length + 2); }, 0);
      } else {
        const newVal = val.slice(0, pos) + "_" + val.slice(pos);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 1, pos + 1); }, 0);
      }
      return;
    }

    // bullet / numbered — persistent list mode, mutually exclusive
    const isOn = activeFormats.has(type);
    setActiveFormats(prev => {
      const n = new Set(prev);
      if (isOn) {
        n.delete(type);
      } else {
        n.add(type);
        n.delete(type === "bullet" ? "numbered" : "bullet");
      }
      return n;
    });

    // When turning ON, prefix the current line if it's empty
    if (!isOn) {
      const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
      const lineContent = val.slice(lineStart, pos);
      if (!lineContent.trim()) {
        const prefix = type === "bullet" ? "• " : "1. ";
        const newVal = val.slice(0, lineStart) + prefix + val.slice(lineStart);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length); }, 0);
        return;
      }
    }
    setTimeout(() => ta.focus(), 0);
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    const hasBullet = activeFormats.has("bullet");
    const hasNumbered = activeFormats.has("numbered");
    if (!hasBullet && !hasNumbered) return;
    e.preventDefault();
    const ta = noteTextareaRef.current!;
    const pos = ta.selectionStart;
    const val = noteContent;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineContent = val.slice(lineStart, pos);

    if (hasBullet) {
      // Empty bullet line → exit list mode
      if (lineContent === "• ") {
        setActiveFormats(prev => { const n = new Set(prev); n.delete("bullet"); return n; });
        const newVal = val.slice(0, lineStart) + "\n" + val.slice(pos);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); }, 0);
        return;
      }
      const newVal = val.slice(0, pos) + "\n• " + val.slice(pos);
      handleNoteChange(newVal);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 3, pos + 3); }, 0);
    } else {
      // Empty numbered line → exit list mode
      if (/^\d+\. $/.test(lineContent)) {
        setActiveFormats(prev => { const n = new Set(prev); n.delete("numbered"); return n; });
        const newVal = val.slice(0, lineStart) + "\n" + val.slice(pos);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); }, 0);
        return;
      }
      // Find next number from last numbered line above cursor
      const textBefore = val.slice(0, pos);
      const lines = textBefore.split("\n");
      let nextNum = 1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].match(/^(\d+)\. /);
        if (m) { nextNum = parseInt(m[1]) + 1; break; }
      }
      const prefix = `\n${nextNum}. `;
      const newVal = val.slice(0, pos) + prefix + val.slice(pos);
      handleNoteChange(newVal);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length, pos + prefix.length); }, 0);
    }
  };

  const addProject = () => {
    const name = newProject.trim();
    if (!name) { setAddingProject(false); return; }
    const id = genId();
    saveProjects([...projects, { id, name, conversationIds: [] }]);
    setNewProject("");
    setAddingProject(false);
    setExpandedProjects(prev => new Set([...prev, id]));
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setAddingConvTo(null); }
      else next.add(id);
      return next;
    });
  };

  const addConvToProject = (projectId: string, convId: string) => {
    saveProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, conversationIds: [...(p.conversationIds ?? []), convId] }
        : p
    ));
    setAddingConvTo(null);
  };

  const removeConvFromProject = (projectId: string, convId: string) => {
    saveProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, conversationIds: (p.conversationIds ?? []).filter(id => id !== convId) }
        : p
    ));
  };

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingKey) return;
    const val = editValue.trim();
    if (val) {
      if (editingKey.startsWith("conv:")) {
        onRenameConversation(editingKey.slice(5), val);
      } else if (editingKey.startsWith("proj:")) {
        saveProjects(projects.map(p => p.id === editingKey.slice(5) ? { ...p, name: val } : p));
      }
    }
    setEditingKey(null);
    setEditValue("");
  };

  const cancelEdit = () => { setEditingKey(null); setEditValue(""); };

  const NEW_INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.45)",
    border: `1px solid rgba(100,65,15,0.22)`,
    borderRadius: 5,
    padding: "0.35rem 0.5rem",
    fontFamily: "var(--font-cormorant)",
    fontStyle: "italic",
    fontSize: "0.88rem",
    color: INK,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <>
    <aside
      style={{
        width: collapsed ? 28 : 220,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(228,220,206,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRight: `1px solid rgba(100,65,15,0.18)`,
        overflowY: collapsed ? "hidden" : "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        paddingBottom: collapsed ? 0 : "2rem",
        position: "relative",
        zIndex: 2,
        transition: "width 0.22s ease",
      }}
    >
      {/* Collapse toggle row */}
      <div style={{ display: "flex", justifyContent: collapsed ? "center" : "flex-end", flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(100,65,15,0.38)",
            padding: "0.75rem 0.75rem",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(100,65,15,0.85)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,65,15,0.38)"; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      {/* Sidebar content — hidden when collapsed */}
      <div style={{ opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? "none" : "auto", transition: "opacity 0.15s ease", minWidth: 220 }}>

        {/* New Conversation */}
        <div style={{ padding: "1.25rem 1rem 1rem" }}>
          <button
            onClick={onNewConversation}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(26,18,10,0.055)",
              border: `1px solid rgba(26,18,10,0.13)`,
              borderRadius: 8,
              padding: "0.55rem 0.75rem",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
              fontFamily: "var(--font-jost)",
              fontSize: "0.48rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INK,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,18,10,0.09)"; e.currentTarget.style.borderColor = "rgba(26,18,10,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(26,18,10,0.055)"; e.currentTarget.style.borderColor = "rgba(26,18,10,0.13)"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Conversation
          </button>
        </div>

        <div style={{ height: 1, background: LINE, margin: "0 1rem" }} />

        {/* ── Projects ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0 0.5rem 1rem" }}>
          <span style={SECTION_LABEL}>Projects</span>
          <button
            onClick={() => setAddingProject(true)}
            title="New project"
            style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, padding: "0.4rem 1rem", lineHeight: 1, fontSize: "0.75rem" }}
            onMouseEnter={e => { e.currentTarget.style.color = INK; }}
            onMouseLeave={e => { e.currentTarget.style.color = GOLD; }}
          >+</button>
        </div>

        {addingProject && (
          <div style={{ padding: "0 1rem 0.5rem" }}>
            <input
              ref={projectInputRef}
              value={newProject}
              onChange={e => setNewProject(toTitleCase(e.target.value))}
              onKeyDown={e => { if (e.key === "Enter") addProject(); if (e.key === "Escape") { setAddingProject(false); setNewProject(""); } }}
              onBlur={addProject}
              placeholder="Project name…"
              style={NEW_INPUT_STYLE}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {projects.map(p => {
            const isExpanded = expandedProjects.has(p.id);
            const projConvIds = p.conversationIds ?? [];
            const projConvs = projConvIds
              .map(id => conversations.find(c => c.id === id))
              .filter((c): c is ConversationRow => !!c);
            const availableConvs = conversations.filter(c => !projConvIds.includes(c.id));

            return (
              <div key={p.id}>
                {/* Project header row */}
                <div
                  style={{ display: "flex", alignItems: "center", transition: "background 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(26,18,10,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {editingKey === `proj:${p.id}` ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={e => setEditValue(toTitleCase(e.target.value))}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      onBlur={commitEdit}
                      style={{ ...INLINE_INPUT, padding: "0.45rem 0 0.45rem 1rem" }}
                    />
                  ) : (
                    <button
                      onClick={() => toggleProject(p.id)}
                      onDoubleClick={() => startEdit(`proj:${p.id}`, p.name)}
                      title="Click to expand · Double-click to rename"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "none",
                        border: "none",
                        padding: "0.45rem 0 0.45rem 0.75rem",
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                      }}
                    >
                      <svg
                        width="8" height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={MUTED}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          flexShrink: 0,
                          transition: "transform 0.18s ease",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.88rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => saveProjects(projects.filter(x => x.id !== p.id))}
                    title="Delete project"
                    style={{ flexShrink: 0, background: "none", border: "none", padding: "0.45rem 1rem", cursor: "pointer", color: "rgba(26,18,10,0.22)", fontSize: "0.6rem", lineHeight: 1, transition: "color 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.65)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.22)"; }}
                  >✕</button>
                </div>

                {/* Expanded — conversations in this project */}
                {isExpanded && (
                  <div style={{ borderLeft: `1px solid ${LINE}`, marginLeft: "1.25rem", marginBottom: "0.25rem" }}>
                    {projConvs.map(c => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: c.id === conversationId ? "rgba(26,18,10,0.06)" : "transparent",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => { if (c.id !== conversationId) (e.currentTarget as HTMLDivElement).style.background = "rgba(26,18,10,0.04)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = c.id === conversationId ? "rgba(26,18,10,0.06)" : "transparent"; }}
                      >
                        <button
                          onClick={() => onSelectConversation(c.id)}
                          style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            padding: "0.4rem 0 0.4rem 0.75rem",
                            textAlign: "left",
                            fontFamily: "var(--font-cormorant)",
                            fontSize: "0.82rem",
                            color: c.id === conversationId ? INK : MUTED,
                            cursor: "pointer",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >{c.title}</button>
                        <button
                          onClick={() => removeConvFromProject(p.id, c.id)}
                          title="Remove from project"
                          style={{ flexShrink: 0, background: "none", border: "none", padding: "0.4rem 1rem 0.4rem 0.35rem", cursor: "pointer", color: "rgba(26,18,10,0.2)", fontSize: "0.55rem", lineHeight: 1, transition: "color 0.12s" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.6)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.2)"; }}
                        >✕</button>
                      </div>
                    ))}

                    {/* Add conversation to project */}
                    {addingConvTo === p.id ? (
                      <div style={{ paddingBottom: "0.25rem" }}>
                        {availableConvs.length === 0 ? (
                          <p style={{ padding: "0.4rem 0.75rem", fontFamily: "var(--font-jost)", fontSize: "0.44rem", letterSpacing: "0.08em", color: "rgba(26,18,10,0.3)", margin: 0 }}>
                            No conversations to add
                          </p>
                        ) : (
                          availableConvs.map(c => (
                            <button
                              key={c.id}
                              onClick={() => addConvToProject(p.id, c.id)}
                              style={{
                                display: "block",
                                width: "100%",
                                background: "none",
                                border: "none",
                                padding: "0.38rem 0.75rem",
                                textAlign: "left",
                                fontFamily: "var(--font-cormorant)",
                                fontSize: "0.82rem",
                                color: "rgba(26,18,10,0.35)",
                                cursor: "pointer",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                transition: "color 0.12s, background 0.12s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = INK; e.currentTarget.style.background = "rgba(26,18,10,0.05)"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.35)"; e.currentTarget.style.background = "transparent"; }}
                            >
                              + {c.title}
                            </button>
                          ))
                        )}
                        <button
                          onClick={() => setAddingConvTo(null)}
                          style={{ display: "block", width: "100%", background: "none", border: "none", padding: "0.35rem 0.75rem", textAlign: "left", fontFamily: "var(--font-jost)", fontSize: "0.4rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,18,10,0.28)", cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.color = MUTED; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.28)"; }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingConvTo(p.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          background: "none",
                          border: "none",
                          padding: "0.38rem 0.75rem",
                          textAlign: "left",
                          fontFamily: "var(--font-jost)",
                          fontSize: "0.4rem",
                          fontWeight: 600,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "rgba(100,65,15,0.42)",
                          cursor: "pointer",
                          transition: "color 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = GOLD; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,65,15,0.42)"; }}
                      >
                        + Add conversation
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 1, background: LINE, margin: "0.75rem 1rem" }} />

        {/* ── ORDRE (past conversations) ── */}
        <div style={{ padding: "0 1rem 0.5rem" }}>
          <span style={SECTION_LABEL}>Ordre</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {conversations.map(c => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                background: c.id === conversationId ? "rgba(26,18,10,0.06)" : "transparent",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (c.id !== conversationId) (e.currentTarget as HTMLDivElement).style.background = "rgba(26,18,10,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = c.id === conversationId ? "rgba(26,18,10,0.06)" : "transparent"; }}
            >
              {editingKey === `conv:${c.id}` ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                  onBlur={commitEdit}
                  style={{ ...INLINE_INPUT, padding: "0.5rem 0 0.5rem 1rem" }}
                />
              ) : (
                <button
                  onClick={() => onSelectConversation(c.id)}
                  onDoubleClick={() => startEdit(`conv:${c.id}`, c.title)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    padding: "0.5rem 0 0.5rem 1rem",
                    textAlign: "left",
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "0.88rem",
                    color: c.id === conversationId ? INK : MUTED,
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={`${c.title} — double-click to rename`}
                >{c.title}</button>
              )}
              <button
                onClick={() => onDeleteConversation(c.id)}
                title="Delete"
                style={{ flexShrink: 0, background: "none", border: "none", padding: "0.5rem 1rem 0.5rem 0.35rem", cursor: "pointer", color: "rgba(26,18,10,0.22)", fontSize: "0.6rem", lineHeight: 1, transition: "color 0.12s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.65)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.22)"; }}
              >✕</button>
            </div>
          ))}
        </div>

        {/* ── Notepad widget ── */}
        <div style={{ padding: "1.25rem 1rem 0.5rem" }}>
          <div style={{ height: 1, background: LINE, marginBottom: "1.25rem" }} />
          <button
            onClick={() => setNotepadOpen(true)}
            title="Open notepad"
            style={{
              display: "block",
              width: "100%",
              background: "rgba(245,240,232,0.85)",
              border: `1px solid rgba(100,65,15,0.18)`,
              borderRadius: 7,
              padding: 0,
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(40,28,12,0.07)",
              transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(40,28,12,0.13)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.32)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(40,28,12,0.07)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.18)"; }}
          >
            {/* Notepad header strip */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.65rem 0.35rem",
              borderBottom: `1px solid rgba(100,65,15,0.1)`,
            }}>
              {/* Pencil icon with dot badge when notes exist */}
              <div style={{ position: "relative", lineHeight: 0 }}>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2.5a2.121 2.121 0 0 1 3 3L5.5 14 1 15l1-4.5L11 2.5z"/>
                </svg>
                {noteContent.trim() && (
                  <span style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(100,65,15,0.65)",
                  }} />
                )}
              </div>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Notes</span>
            </div>
            {/* Lined preview area — blank, text stays private */}
            <div style={{
              position: "relative",
              height: 64,
              overflow: "hidden",
              background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 15px, rgba(100,65,15,0.1) 15px, rgba(100,65,15,0.1) 16px)`,
            }} />
          </button>
        </div>

      </div>{/* end sidebar content */}

    </aside>
      {notepadOpen && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) setNotepadOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(26,18,10,0.35)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(1rem, 4vw, 3rem)",
          }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: 640,
            height: "80vh",
            maxHeight: "80vh",
            background: "#F8F3EA",
            borderRadius: 12,
            boxShadow: "0 24px 64px -16px rgba(26,18,10,0.45), 0 0 0 1px rgba(100,65,15,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Toolbar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.1rem",
              padding: "0.55rem 0.75rem 0.5rem 1.1rem",
              borderBottom: `2px solid rgba(180,60,40,0.22)`,
              flexShrink: 0,
            }}>
              {/* Label */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginRight: "0.6rem" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2.5a2.121 2.121 0 0 1 3 3L5.5 14 1 15l1-4.5L11 2.5z"/>
                </svg>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.43rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Notes</span>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 14, background: "rgba(100,65,15,0.18)", margin: "0 0.4rem" }} />

              {/* Format buttons */}
              {([
                {
                  id: "italic" as const,
                  title: "Italic",
                  content: <em style={{ fontFamily: "Georgia, serif", fontSize: "0.85rem", fontStyle: "italic", lineHeight: 1 }}>I</em>,
                },
                {
                  id: "bullet" as const,
                  title: "Bullet list",
                  content: (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <circle cx="2.5" cy="4.5" r="1" fill="currentColor" stroke="none"/>
                      <circle cx="2.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>
                      <circle cx="2.5" cy="12.5" r="1" fill="currentColor" stroke="none"/>
                      <line x1="6" y1="4.5" x2="14" y2="4.5"/>
                      <line x1="6" y1="8.5" x2="14" y2="8.5"/>
                      <line x1="6" y1="12.5" x2="14" y2="12.5"/>
                    </svg>
                  ),
                },
                {
                  id: "numbered" as const,
                  title: "Numbered list",
                  content: (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <text x="0" y="5.5" style={{ font: "bold 4.5px var(--font-jost)", fill: "currentColor", stroke: "none" }}>1.</text>
                      <text x="0" y="9.5" style={{ font: "bold 4.5px var(--font-jost)", fill: "currentColor", stroke: "none" }}>2.</text>
                      <text x="0" y="13.5" style={{ font: "bold 4.5px var(--font-jost)", fill: "currentColor", stroke: "none" }}>3.</text>
                      <line x1="6" y1="4.5" x2="14" y2="4.5"/>
                      <line x1="6" y1="8.5" x2="14" y2="8.5"/>
                      <line x1="6" y1="12.5" x2="14" y2="12.5"/>
                    </svg>
                  ),
                },
              ] as const).map(btn => {
                const isActive = activeFormats.has(btn.id);
                return (
                  <button
                    key={btn.id}
                    onClick={() => toggleFormat(btn.id)}
                    title={btn.title}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isActive ? "rgba(26,18,10,0.1)" : "none",
                      border: "none", cursor: "pointer",
                      padding: "0.3rem 0.4rem", borderRadius: 4,
                      color: isActive ? "rgba(26,18,10,0.85)" : "rgba(26,18,10,0.4)",
                      transition: "color 0.12s, background 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.85)"; e.currentTarget.style.background = isActive ? "rgba(26,18,10,0.14)" : "rgba(26,18,10,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive ? "rgba(26,18,10,0.85)" : "rgba(26,18,10,0.4)"; e.currentTarget.style.background = isActive ? "rgba(26,18,10,0.1)" : "none"; }}
                  >
                    {btn.content}
                  </button>
                );
              })}

              {/* Spacer + close */}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setNotepadOpen(false)}
                title="Close"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0.35rem 0.45rem", color: "rgba(26,18,10,0.28)",
                  fontSize: "0.72rem", lineHeight: 1, transition: "color 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.75)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.28)"; }}
              >✕</button>
            </div>

            {/* Lined textarea — wrapper is position:relative so textarea can fill it absolutely */}
            <div style={{
              flex: 1,
              position: "relative",
              borderLeft: `2px solid rgba(180,60,40,0.18)`,
              marginLeft: "2.8rem",
              minHeight: 0,
            }}>
              <textarea
                ref={noteTextareaRef}
                value={noteContent}
                onChange={e => handleNoteChange(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  overflowY: "auto",
                  background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(100,65,15,0.1) 27px, rgba(100,65,15,0.1) 28px)`,
                  padding: "0px 1.5rem 1.5rem 1rem",
                  fontFamily: "var(--font-cormorant)",
                  fontStyle: "italic",
                  fontSize: "0.92rem",
                  lineHeight: "28px",
                  color: "rgba(26,18,10,0.85)",
                  caretColor: "rgba(26,18,10,0.75)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
