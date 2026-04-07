import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createOrGetChat, listenToMessages, sendMessage, getUserDoc } from "../firebase/db";
import { Spinner, Avatar, Button, toast } from "../components/UI";
import {
  collection, query, where, onSnapshot,
  doc, setDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function Chat() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params   = new URLSearchParams(location.search);
  const withUid  = params.get("with");

  const [chatList,     setChatList]     = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeOther,  setActiveOther]  = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState("");
  const [loadingList,  setLoadingList]  = useState(true);
  const [loadingChat,  setLoadingChat]  = useState(false);
  const [sending,      setSending]      = useState(false);
  const [mobileSide,   setMobileSide]   = useState("list"); // "list" | "chat"

  const bottomRef   = useRef(null);
  const msgUnsub    = useRef(null);
  const listUnsub   = useRef(null);
  const textareaRef = useRef(null);

  // ── Scroll to bottom helper ─────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  // ── Load conversation list ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      try {
        // Fetch all other-user docs in parallel
        const chats = await Promise.all(
          snap.docs.map(async (d) => {
            const data    = d.data();
            const otherId = data.participants?.find((p) => p !== currentUser.uid);
            let other     = null;
            if (otherId) {
              try { other = await getUserDoc(otherId); } catch (_) {}
            }
            return { id: d.id, ...data, other };
          })
        );
        setChatList(
          chats
            .filter(Boolean)
            .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
        );
      } catch (e) {
        console.error("Chat list error:", e);
      } finally {
        setLoadingList(false);
      }
    }, (err) => {
      console.error("Chat list snapshot error:", err);
      setLoadingList(false);
    });

    listUnsub.current = unsub;
    return () => unsub();
  }, [currentUser]);

  // ── Auto-open from ?with= param ─────────────────────────
  // Only fires once currentUser is ready and withUid is present
  useEffect(() => {
    if (withUid && currentUser?.uid) {
      openChat(withUid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUid, currentUser?.uid]);

  // ── Cleanup message listener on unmount ─────────────────
  useEffect(() => {
    return () => {
      if (msgUnsub.current) msgUnsub.current();
    };
  }, []);

  // ── Open / switch conversation ──────────────────────────
  const openChat = useCallback(async (otherId) => {
    if (!otherId || !currentUser?.uid) return;
    if (loadingChat) return; // prevent double-open

    // Unsubscribe from previous message listener
    if (msgUnsub.current) {
      msgUnsub.current();
      msgUnsub.current = null;
    }

    setLoadingChat(true);
    setMessages([]);
    setActiveOther(null);

    try {
      // Create or retrieve the chat document
      const chatId = await createOrGetChat(currentUser.uid, otherId);
      if (!chatId) throw new Error("Could not create chat");

      // Fetch the other user's profile
      const other = await getUserDoc(otherId);
      if (!other) throw new Error("Could not load user");

      setActiveChatId(chatId);
      setActiveOther(other);
      setMobileSide("chat");

      // Subscribe to messages
      msgUnsub.current = listenToMessages(chatId, (msgs) => {
        setMessages(msgs || []);
        scrollToBottom();
      });

      // Focus input
      setTimeout(() => textareaRef.current?.focus(), 150);
    } catch (e) {
      console.error("openChat error:", e);
      toast.error("Could not open chat. Please try again.");
      setActiveChatId(null);
      setActiveOther(null);
    } finally {
      setLoadingChat(false);
    }
  }, [currentUser?.uid, loadingChat, scrollToBottom]);

  // ── Send message ────────────────────────────────────────
  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || !activeChatId || sending) return;

    setSending(true);
    setText(""); // optimistic clear

    try {
      // Write the message sub-document
      await sendMessage(activeChatId, {
        text: msg,
        senderId:   currentUser.uid,
        senderName: userDoc?.displayName || currentUser?.displayName || "User",
      });

      // Update the parent chat doc's preview — merge so we never overwrite participants
      await setDoc(
        doc(db, "messages", activeChatId),
        { lastMessage: msg, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.error("Send error:", e);
      toast.error("Failed to send message. Please try again.");
      setText(msg); // restore text so user doesn't lose it
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [text, activeChatId, sending, currentUser, userDoc]);

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Auto-resize textarea ────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-grow up to ~5 lines
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  // ── Redirect guests ─────────────────────────────────────
  if (!currentUser) {
    navigate("/login", { replace: true });
    return null;
  }

  // ── Format helpers ──────────────────────────────────────
  const fmtTime = (ts) =>
    ts?.seconds
      ? new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const fmtDate = (ts) => {
    if (!ts?.seconds) return "";
    const d   = new Date(ts.seconds * 1000);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const chatHeight = "calc(100vh - 64px)";

  return (
    <div style={{
      height: chatHeight, display: "flex", overflow: "hidden",
      background: "var(--surface)", fontFamily: "var(--font-body)",
    }}>

      {/* ═══════════════ SIDEBAR ════════════════════════════ */}
      <aside style={{
        width: 300, minWidth: 300, flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: mobileSide === "chat" ? "none" : "flex",
        flexDirection: "column",
        background: "var(--surface)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
            Messages
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {chatList.length} conversation{chatList.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingList ? (
            <Spinner center />
          ) : chatList.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>No conversations yet</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Visit a product or service page and tap "Chat" to start messaging.
              </div>
            </div>
          ) : (
            chatList.map((chat) => {
              const otherId  = chat.participants?.find((p) => p !== currentUser.uid);
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => openChat(otherId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 18px", cursor: "pointer",
                    background: isActive ? "var(--accent-glow)" : "transparent",
                    borderLeft: `3px solid ${isActive ? "var(--accent)" : "transparent"}`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ flexShrink: 0, position: "relative" }}>
                    <Avatar name={chat.other?.displayName || "?"} photoURL={chat.other?.photoURL} size="md" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                        {chat.other?.displayName || "User"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                        {fmtDate(chat.updatedAt)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-muted)", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {chat.lastMessage || "No messages yet"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ═══════════════ CHAT AREA ══════════════════════════ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        // On mobile: show only when a chat is active
        ...(mobileSide === "list" && !activeChatId ? { display: "none" } : {}),
      }}>
        {loadingChat ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner center />
          </div>
        ) : activeChatId && activeOther ? (
          <>
            {/* ── Chat header ── */}
            <div style={{
              padding: "12px 18px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--surface)", flexShrink: 0,
            }}>
              {/* Mobile back button */}
              <button
                onClick={() => { setMobileSide("list"); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 20, padding: "2px 6px",
                }}
              >←</button>

              <Avatar name={activeOther.displayName} photoURL={activeOther.photoURL} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeOther.displayName}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {[activeOther.city, activeOther.region].filter(Boolean).join(", ") || "AlEcom Member"}
                </div>
              </div>
              {activeOther.isSeller && (
                <button
                  onClick={() => navigate(`/store/${activeOther.uid || activeOther.id}`)}
                  style={{
                    padding: "6px 14px", border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)", background: "none",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: "var(--text-secondary)", fontFamily: "var(--font-body)",
                    whiteSpace: "nowrap",
                  }}
                >
                  🏪 Store
                </button>
              )}
            </div>

            {/* ── Messages list ── */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: 6,
              background: "var(--surface-2)",
            }}>
              {messages.length === 0 ? (
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  textAlign: "center", padding: "48px 20px",
                  color: "var(--text-muted)", fontSize: 14,
                }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>👋</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Start the conversation</div>
                  <div style={{ fontSize: 13 }}>Say hello to {activeOther.displayName}!</div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe     = msg.senderId === currentUser.uid;
                  const prevMsg  = messages[i - 1];
                  const showDate = i === 0 || (
                    prevMsg?.createdAt?.seconds &&
                    msg.createdAt?.seconds &&
                    new Date(msg.createdAt.seconds * 1000).toDateString() !==
                    new Date(prevMsg.createdAt.seconds * 1000).toDateString()
                  );
                  // Group consecutive messages from same sender (skip avatar gap)
                  const nextMsg      = messages[i + 1];
                  const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

                  return (
                    <div key={msg.id || i}>
                      {showDate && (
                        <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                          <span style={{
                            fontSize: 11, color: "var(--text-muted)",
                            background: "var(--surface-3)",
                            padding: "3px 14px", borderRadius: 10, fontWeight: 500,
                          }}>
                            {fmtDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginBottom: isLastInGroup ? 6 : 2,
                      }}>
                        {/* Other user's avatar — only on last bubble in group */}
                        {!isMe && (
                          <div style={{ width: 28, flexShrink: 0, display: "flex", alignItems: "flex-end", marginRight: 6 }}>
                            {isLastInGroup && (
                              <Avatar name={activeOther.displayName} photoURL={activeOther.photoURL} size="xs" />
                            )}
                          </div>
                        )}
                        <div style={{
                          maxWidth: "68%",
                          padding: "9px 13px",
                          background: isMe ? "var(--accent)" : "var(--surface)",
                          color: isMe ? "#fff" : "var(--text)",
                          borderRadius: isMe
                            ? (isLastInGroup ? "18px 18px 4px 18px" : "18px 18px 18px 18px")
                            : (isLastInGroup ? "18px 18px 18px 4px" : "18px 18px 18px 18px"),
                          fontSize: 14, lineHeight: 1.55,
                          boxShadow: "var(--shadow-sm)",
                          border: isMe ? "none" : "1px solid var(--border)",
                          wordBreak: "break-word",
                        }}>
                          {msg.text}
                          {isLastInGroup && (
                            <div style={{ fontSize: 10, marginTop: 3, textAlign: "right", opacity: 0.55 }}>
                              {fmtTime(msg.createdAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Message input ── */}
            <div style={{
              padding: "12px 16px", borderTop: "1px solid var(--border)",
              background: "var(--surface)", flexShrink: 0,
              display: "flex", gap: 10, alignItems: "flex-end",
            }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 14, fontFamily: "var(--font-body)",
                  resize: "none", outline: "none",
                  background: "var(--surface-2)",
                  lineHeight: 1.5, maxHeight: 120,
                  overflowY: "auto", transition: "border-color 0.15s",
                }}
                onFocus={(e)  => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e)   => { e.target.style.borderColor = "var(--border)"; }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                  width: 44, height: 44,
                  background: text.trim() && !sending ? "var(--accent)" : "var(--surface-3)",
                  color: text.trim() && !sending ? "#fff" : "var(--text-muted)",
                  border: "none", borderRadius: "50%",
                  cursor: text.trim() && !sending ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0, transition: "all 0.2s",
                }}
              >
                {sending ? "⏳" : "➤"}
              </button>
            </div>
<br/>
<br/>
          </>
        ) : (
          /* ── Empty state — no chat selected ── */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, color: "var(--text-muted)",
            textAlign: "center", padding: 32,
          }}>
            <div style={{ fontSize: 56 }}>💬</div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 20,
              fontWeight: 700, color: "var(--text)",
            }}>
              Your Messages
            </div>
            <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.65 }}>
              Select a conversation on the left, or start a new one from any product or service page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
