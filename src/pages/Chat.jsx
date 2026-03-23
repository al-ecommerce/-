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

  const [chatList, setChatList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load chat list
  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const q = query(collection(db, "messages"), where("participants", "array-contains", currentUser.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const chats = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const otherId = data.participants.find(p => p !== currentUser.uid);
          const other = otherId ? await getUserDoc(otherId) : null;
          return { id: d.id, ...data, other };
        })
      );
      setChatList(chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // Auto-open chat if ?with= param provided
  useEffect(() => {
    if (withUid && currentUser) {
      openChat(withUid);
    }
  }, [withUid, currentUser]);

  const openChat = async (otherId) => {
    try {
      const chatId = await createOrGetChat(currentUser.uid, otherId);
      setActiveChatId(chatId);
      const other = await getUserDoc(otherId);
      setActiveParticipant(other);
      const unsub = listenToMessages(chatId, setMessages);
      return unsub;
    } catch (e) { toast.error("Failed to open chat"); }
  };

  useEffect(() => {
    if (!activeChatId) return;
    const unsub = listenToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsub;
  }, [activeChatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    setSending(true);
    try {
      await sendMessage(activeChatId, {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: userDoc?.displayName || "User"
      });
      // Update last message
      await setDoc(doc(db, "messages", activeChatId), { lastMessage: text.trim(), updatedAt: serverTimestamp() }, { merge: true });
      setText("");
    } catch (e) { toast.error("Failed to send"); }
    setSending(false);
  };

  if (!currentUser) return null;

  return (
    <div className="page-wrapper" style={{ paddingBottom: 0 }}>
      <div style={{
        height: "calc(100vh - var(--nav-height))",
        display: "flex",
        background: "var(--surface)"
      }}>
        {/* Sidebar */}
        <div style={{
          width: 300, borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          flexShrink: 0
        }} className="hide-mobile">
          <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>Messages</h2>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? <Spinner center /> :
              chatList.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                  No conversations yet
                </div>
              ) : chatList.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => { setActiveChatId(chat.id); setActiveParticipant(chat.other); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", cursor: "pointer",
                    background: activeChatId === chat.id ? "var(--accent-glow)" : "transparent",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={e => activeChatId !== chat.id && (e.currentTarget.style.background = "var(--surface-3)")}
                  onMouseLeave={e => activeChatId !== chat.id && (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar name={chat.other?.displayName || "?"} photoURL={chat.other?.photoURL} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{chat.other?.displayName || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.lastMessage || "Start a conversation"}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {activeChatId && activeParticipant ? (
            <>
              {/* Header */}
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 12
              }}>
                <Avatar name={activeParticipant.displayName} photoURL={activeParticipant.photoURL} size="md" />
                <div>
                  <div style={{ fontWeight: 700 }}>{activeParticipant.displayName}</div>
                  <div style={{ fontSize: 12, color: "var(--success)" }}>● Online</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser.uid;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "72%", padding: "10px 14px",
                        background: isMe ? "var(--accent)" : "var(--surface-3)",
                        color: isMe ? "#fff" : "var(--text)",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 14, lineHeight: 1.6
                      }}>
                        {msg.text}
                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, textAlign: "right" }}>
                          {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{
                padding: "12px 16px", borderTop: "1px solid var(--border)",
                display: "flex", gap: 10, alignItems: "center",
                paddingBottom: "calc(var(--bottom-nav-height) + 12px)"
              }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit" variant="primary" loading={sending} disabled={!text.trim()}>Send</Button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-muted)" }}>
              <span style={{ fontSize: 48 }}>💬</span>
              <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>Your Messages</h3>
              <p style={{ fontSize: 14 }}>Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
