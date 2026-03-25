import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createOrGetChat, listenToMessages, sendMessage, getUserDoc } from "../firebase/db";
import { Spinner, Avatar, Button, toast } from "../components/UI";
import { collection, query, where, onSnapshot, orderBy, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Chat() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const withUid = params.get("with");

  const [chatList, setChatList]         = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeOther, setActiveOther]   = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [loadingList, setLoadingList]   = useState(true);
  const [sending, setSending]           = useState(false);
  const [showSidebar, setShowSidebar]   = useState(true);
  const bottomRef = useRef(null);
  const msgUnsubRef = useRef(null);

  // ── Load chat list ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const q = query(collection(db, "messages"), where("participants", "array-contains", currentUser.uid));
    const unsub = onSnapshot(q, async snap => {
      const chats = await Promise.all(
        snap.docs.map(async d => {
          const data = d.data();
          const otherId = data.participants?.find(p => p !== currentUser.uid);
          const other = otherId ? await getUserDoc(otherId) : null;
          return { id: d.id, ...data, other };
        })
      );
      setChatList(chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
      setLoadingList(false);
    });
    return unsub;
  }, [currentUser]);

  // ── Auto-open chat from ?with= param ───────────────────
  useEffect(() => {
    if (withUid && currentUser) openChat(withUid);
  }, [withUid, currentUser]);

  // ── Open a chat ────────────────────────────────────────
  const openChat = async otherId => {
    try {
      const chatId = await createOrGetChat(currentUser.uid, otherId);
      const other  = await getUserDoc(otherId);
      setActiveChatId(chatId);
      setActiveOther(other);
      setMessages([]);
      setShowSidebar(false); // on mobile, hide sidebar when chat opens

      // Unsubscribe previous listener
      if (msgUnsubRef.current) msgUnsubRef.current();
      msgUnsubRef.current = listenToMessages(chatId, msgs => {
        setMessages(msgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      });
    } catch (e) { toast.error("Could not open chat"); }
  };

  // ── Send message ───────────────────────────────────────
  const handleSend = async e => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    setSending(true);
    try {
      await sendMessage(activeChatId, {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: userDoc?.displayName || "User",
      });
      await setDoc(doc(db, "messages", activeChatId), {
        lastMessage: text.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setText("");
    } catch (e) { toast.error("Failed to send"); }
    setSending(false);
  };

  useEffect(() => () => { if (msgUnsubRef.current) msgUnsubRef.current(); }, []);

  if (!currentUser) return null;

  const formatTime = ts =>
    ts?.seconds ? new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const formatDate = ts =>
    ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString([], { month: "short", day: "numeric" }) : "";

  return (
    <div style={{ height: "calc(100vh - var(--nav-height))", display: "flex", overflow: "hidden", background: "var(--surface)" }}>

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{
        width: 300, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", flexShrink: 0,
        // On mobile: show sidebar OR chat, not both
        ...(showSidebar ? {} : { display: "none" }),
      }} className="chat-sidebar-desktop">
        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.2px" }}>
            Messages
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {chatList.length} conversation{chatList.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingList ? (
            <Spinner center />
          ) : chatList.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>No conversations yet</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Message a seller from any product or service page.
              </div>
            </div>
          ) : (
            chatList.map(chat => {
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat.other?.uid || chat.participants?.find(p => p !== currentUser.uid))}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 20px", cursor: "pointer",
                    background: isActive ? "var(--accent-glow)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar name={chat.other?.displayName || "?"} photoURL={chat.other?.photoURL} size="md" />
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "var(--success)", border: "2px solid var(--surface)",
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {chat.other?.displayName || "Unknown User"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-muted)", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {chat.lastMessage || "Start a conversation"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── CHAT AREA ───────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        ...((!showSidebar || activeChatId) ? {} : {}),
      }}>
        {activeChatId && activeOther ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--surface)",
            }}>
              {/* Back button on mobile */}
              <button
                onClick={() => { setShowSidebar(true); setActiveChatId(null); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 20, padding: "4px 8px",
                  display: "none", // shown via CSS on mobile
                }}
                className="chat-back-btn"
              >←</button>
              <Avatar name={activeOther.displayName} photoURL={activeOther.photoURL} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>
                  {activeOther.displayName}
                </div>
                <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>● Online</div>
              </div>
              {activeOther.isSeller && (
                <button
                  onClick={() => navigate(`/store/${activeOther.uid}`)}
                  style={{
                    padding: "6px 14px", border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)", background: "none",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: "var(--text-secondary)", fontFamily: "var(--font-body)",
                  }}
                >
                  View Store
                </button>
              )}
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "20px 20px",
              display: "flex", flexDirection: "column", gap: 10,
              background: "var(--surface-2)",
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.uid;
                const showDate = i === 0 || (
                  messages[i - 1].createdAt?.seconds &&
                  new Date(msg.createdAt?.seconds * 1000).toDateString() !==
                  new Date(messages[i - 1].createdAt?.seconds * 1000).toDateString()
                );
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{ textAlign: "center", margin: "8px 0" }}>
                        <span style={{
                          fontSize: 11, color: "var(--text-muted)", background: "var(--surface-3)",
                          padding: "3px 12px", borderRadius: 10, fontWeight: 500,
                        }}>
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "68%",
                        padding: "10px 14px",
                        background: isMe ? "var(--accent)" : "var(--surface)",
                        color: isMe ? "#fff" : "var(--text)",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 14, lineHeight: 1.55,
                        boxShadow: "var(--shadow-sm)",
                        border: isMe ? "none" : "1px solid var(--border)",
                      }}>
                        {msg.text}
                        <div style={{
                          fontSize: 10, marginTop: 4, textAlign: "right",
                          opacity: isMe ? 0.65 : 0.5,
                        }}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                display: "flex", gap: 10, alignItems: "flex-end",
                background: "var(--surface)",
                paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              }}
            >
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder="Type a message…"
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 14, fontFamily: "var(--font-body)",
                  resize: "none", outline: "none",
                  background: "var(--surface-2)",
                  lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                }}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                style={{
                  padding: "10px 20px", background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
                  cursor: "pointer", opacity: !text.trim() ? 0.5 : 1,
                  transition: "opacity 0.2s", flexShrink: 0,
                }}
              >
                {sending ? "…" : "Send"}
              </button>
            </form>
          </>
        ) : (
          /* Empty state when no chat selected */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, color: "var(--text-muted)", textAlign: "center", padding: 24,
          }}>
            <div style={{ fontSize: 52 }}>💬</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
              Your Messages
            </div>
            <p style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>
              Select a conversation from the left, or message a seller directly from any product page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
