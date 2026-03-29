import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createOrGetChat, listenToMessages, sendMessage, getUserDoc } from "../firebase/db";
import { Spinner, Avatar, Button, toast } from "../components/UI";
import {
  collection, query, where, onSnapshot,
  doc, setDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function Chat() {
  const { currentUser, userDoc } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const params    = new URLSearchParams(location.search);
  const withUid   = params.get("with");

  const [chatList,      setChatList]      = useState([]);
  const [activeChatId,  setActiveChatId]  = useState(null);
  const [activeOther,   setActiveOther]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState("");
  const [loadingList,   setLoadingList]   = useState(true);
  const [sending,       setSending]       = useState(false);
  const [mobileSide,    setMobileSide]    = useState("list"); // "list" | "chat"
  const bottomRef   = useRef(null);
  const msgUnsub    = useRef(null);
  const textareaRef = useRef(null);

  // ── Load conversation list ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", currentUser.uid)
    );
    const unsub = onSnapshot(q, async snap => {
      const chats = await Promise.all(
        snap.docs.map(async d => {
          const data  = d.data();
          const otherId = data.participants?.find(p => p !== currentUser.uid);
          const other   = otherId ? await getUserDoc(otherId).catch(() => null) : null;
          return { id: d.id, ...data, other };
        })
      );
      setChatList(
        chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
      );
      setLoadingList(false);
    });
    return unsub;
  }, [currentUser]);

  // ── Auto-open from ?with= param ─────────────────────────
  useEffect(() => {
    if (withUid && currentUser) openChat(withUid);
  }, [withUid, currentUser]);

  // ── Open a conversation ─────────────────────────────────
  const openChat = async otherId => {
    try {
      const chatId = await createOrGetChat(currentUser.uid, otherId);
      const other  = await getUserDoc(otherId);
      setActiveChatId(chatId);
      setActiveOther(other);
      setMessages([]);
      setMobileSide("chat");

      if (msgUnsub.current) msgUnsub.current();
      msgUnsub.current = listenToMessages(chatId, msgs => {
        setMessages(msgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      });
      // Focus textarea after opening
      setTimeout(() => textareaRef.current?.focus(), 150);
    } catch (e) { toast.error("Could not open chat"); }
  };

  // ── Send ────────────────────────────────────────────────
  const handleSend = async e => {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || !activeChatId) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(activeChatId, {
        text: msg,
        senderId: currentUser.uid,
        senderName: userDoc?.displayName || "User",
      });
      await setDoc(doc(db, "messages", activeChatId), {
        lastMessage: msg,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) { toast.error("Failed to send"); setText(msg); }
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  useEffect(() => () => { if (msgUnsub.current) msgUnsub.current(); }, []);

  if (!currentUser) return null;

  const fmtTime = ts => ts?.seconds
    ? new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const fmtDate = ts => ts?.seconds
    ? new Date(ts.seconds * 1000).toLocaleDateString([], { month: "short", day: "numeric" })
    : "";

  // ── NAV_HEIGHT fallback ─────────────────────────────────
  const chatHeight = "calc(100vh - 64px)";

  return (
    <div style={{
      height: chatHeight,
      display: "flex",
      overflow: "hidden",
      background: "var(--surface)",
      fontFamily: "var(--font-body)",
    }}>

      {/* ═══════════════ SIDEBAR ════════════════════════════ */}
      <aside style={{
        width: 300,
        minWidth: 300,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        // On mobile: hidden when viewing a chat
        ...(mobileSide === "chat" ? { display: "none" } : {}),
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18,
          }}>
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
                Visit a product or service page and click "Chat with Seller" to start messaging.
              </div>
            </div>
          ) : (
            chatList.map(chat => {
              const otherId  = chat.participants?.find(p => p !== currentUser.uid);
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
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <Avatar name={chat.other?.displayName || "?"} photoURL={chat.other?.photoURL} size="md" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {chat.other?.displayName || "User"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
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
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        // On mobile: hidden when showing list
        ...(mobileSide === "list" && !activeChatId ? { display: "none" } : {}),
      }}>
        {activeChatId && activeOther ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--surface)",
              flexShrink: 0,
            }}>
              {/* Mobile back */}
              <button
                onClick={() => setMobileSide("list")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 20, padding: "2px 6px",
                  display: "none",
                }}
                className="chat-back-btn"
              >←</button>

              <Avatar name={activeOther.displayName} photoURL={activeOther.photoURL} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>
                  {activeOther.displayName}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {activeOther.location || "ASVAN Member"}
                </div>
              </div>
              {activeOther.isSeller && (
                <button
                  onClick={() => navigate(`/store/${activeOther.uid}`)}
                  style={{
                    padding: "6px 14px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                    whiteSpace: "nowrap",
                  }}
                >
                  🏪 Store
                </button>
              )}
            </div>

            {/* Messages list */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "var(--surface-2)",
            }}>
              {messages.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "48px 20px",
                  color: "var(--text-muted)", fontSize: 14,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
                  Say hello to {activeOther.displayName}!
                </div>
              )}

              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.uid;
                const showDate = i === 0 || (
                  messages[i - 1]?.createdAt?.seconds &&
                  new Date(msg.createdAt?.seconds * 1000).toDateString() !==
                  new Date(messages[i - 1].createdAt?.seconds * 1000).toDateString()
                );
                return (
                  <div key={msg.id || i}>
                    {showDate && (
                      <div style={{ textAlign: "center", margin: "8px 0" }}>
                        <span style={{
                          fontSize: 11, color: "var(--text-muted)",
                          background: "var(--surface-3)",
                          padding: "2px 12px", borderRadius: 10, fontWeight: 500,
                        }}>
                          {fmtDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}>
                      <div style={{
                        maxWidth: "70%",
                        padding: "10px 14px",
                        background: isMe ? "var(--accent)" : "var(--surface)",
                        color: isMe ? "#fff" : "var(--text)",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 14, lineHeight: 1.55,
                        boxShadow: "var(--shadow-sm)",
                        border: isMe ? "none" : "1px solid var(--border)",
                        wordBreak: "break-word",
                      }}>
                        {msg.text}
                        <div style={{
                          fontSize: 10, marginTop: 4, textAlign: "right",
                          opacity: 0.6,
                        }}>
                          {fmtTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* ── MESSAGE INPUT ──────────────────────────────── */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
              flexShrink: 0,
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
            }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  resize: "none",
                  outline: "none",
                  background: "var(--surface-2)",
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflowY: "auto",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                  width: 44, height: 44,
                  background: text.trim() ? "var(--accent)" : "var(--surface-3)",
                  color: text.trim() ? "#fff" : "var(--text-muted)",
                  border: "none",
                  borderRadius: "50%",
                  cursor: text.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {sending ? "⏳" : "➤"}
              </button>
            </div>
          </>
        ) : (
          /* Empty state — no chat selected */
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "var(--text-muted)",
            textAlign: "center",
            padding: 32,
          }}>
            <div style={{ fontSize: 56 }}>💬</div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 20, fontWeight: 700,
              color: "var(--text)",
            }}>
              Your Messages
            </div>
            <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.65 }}>
              Select a conversation from the left panel, or start a new one from any product or service page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
