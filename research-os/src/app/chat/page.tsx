"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useResearch } from "@/components/Shell";
import { supabase } from "@/lib/supabase";
import type { ChatSession, ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const { tags } = useResearch();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions
  useEffect(() => {
    supabase
      .from("research_chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setSessions((data || []) as ChatSession[]));
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }
    supabase
      .from("research_chat_messages")
      .select("*")
      .eq("session_id", activeSession)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data || []) as ChatMessage[]));
  }, [activeSession]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createSession = async () => {
    const { data } = await supabase
      .from("research_chat_sessions")
      .insert({ title: "New Chat", tag_id: selectedTag })
      .select()
      .single();
    if (data) {
      setSessions((prev) => [data as ChatSession, ...prev]);
      setActiveSession(data.id);
      setMessages([]);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    setError(null);

    // Create session if needed
    let sessionId = activeSession;
    if (!sessionId) {
      const { data } = await supabase
        .from("research_chat_sessions")
        .insert({ title: "New Chat", tag_id: selectedTag })
        .select()
        .single();
      if (data) {
        sessionId = data.id;
        setSessions((prev) => [data as ChatSession, ...prev]);
        setActiveSession(data.id);
      }
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId!,
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const chatMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          sessionId,
          tagId: selectedTag,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId!,
        role: "assistant",
        content: data.content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Update session title from first message
      if (messages.length === 0) {
        const title = input.slice(0, 60) + (input.length > 60 ? "..." : "");
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
        );
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }, [input, sending, activeSession, messages, selectedTag]);

  const deleteSession = async (id: string) => {
    await supabase.from("research_chat_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession === id) {
      setActiveSession(null);
      setMessages([]);
    }
  };

  return (
    <div className="chat-page">
      {/* Sidebar with sessions */}
      <div className="chat-page__sidebar">
        <button className="chat-page__new-btn" onClick={createSession}>
          + New Chat
        </button>

        {/* Capsule selector */}
        <div className="chat-page__capsule-select">
          <label>Context capsule:</label>
          <select
            value={selectedTag || ""}
            onChange={(e) => setSelectedTag(e.target.value || null)}
          >
            <option value="">None (general)</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="chat-page__sessions">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`chat-page__session ${activeSession === s.id ? "chat-page__session--active" : ""}`}
              onClick={() => setActiveSession(s.id)}
            >
              <span className="chat-page__session-title">{s.title}</span>
              <button
                className="chat-page__session-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(s.id);
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-page__main">
        <div className="chat-page__messages">
          {messages.length === 0 && (
            <div className="chat-page__empty">
              <h2>Research Chat</h2>
              <p>
                Ask questions about your paper collection. Select a capsule for
                focused context.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-page__message chat-page__message--${msg.role}`}
            >
              <div className="chat-page__message-role">
                {msg.role === "user" ? "You" : "Claude"}
              </div>
              <div className="chat-page__message-content">
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="chat-page__message chat-page__message--assistant">
              <div className="chat-page__message-role">Claude</div>
              <div className="chat-page__message-content chat-page__typing">
                Thinking...
              </div>
            </div>
          )}
          {error && (
            <div className="chat-page__error">{error}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-page__input-area">
          <textarea
            className="chat-page__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about your research..."
            rows={2}
            disabled={sending}
          />
          <button
            className="chat-page__send"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
