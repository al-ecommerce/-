import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToNotifications, markNotificationRead } from "../firebase/db";
import { Spinner, PageHeader, EmptyState, Button } from "../components/UI";

const NOTIF_ICONS = {
  order: "📦",
  payment: "💰",
  offer: "💬",
  review: "⭐",
  system: "🔔",
  alert: "⚠️",
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const unsub = listenToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
  };

  const handleClick = async (notif) => {
    if (!notif.read) await markNotificationRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 680 }}>
        <PageHeader
          title="Notifications"
          action={notifications.some(n => !n.read) && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>
          )}
        />

        {loading ? <Spinner center /> : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" description="You'll see updates here" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                  background: n.read ? "var(--surface)" : "var(--accent-glow)",
                  border: "1px solid " + (n.read ? "var(--border)" : "rgba(79,124,255,0.2)"),
                  borderRadius: "var(--radius-lg)", cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0
                }}>
                  {NOTIF_ICONS[n.type] || "🔔"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : ""}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 4, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
