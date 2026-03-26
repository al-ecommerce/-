import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToNotifications, markNotificationRead, markAllNotificationsRead } from "../firebase/db";
import { Spinner, PageHeader, EmptyState, Button } from "../components/UI";

const NOTIF_ICONS = {
  order:   "📦",
  payment: "💰",
  offer:   "💬",
  review:  "⭐",
  system:  "🔔",
  alert:   "⚠️",
};

const NOTIF_COLORS = {
  order:   "#1A56DB",
  payment: "#059669",
  offer:   "#7C3AED",
  review:  "#D97706",
  system:  "#6B7280",
  alert:   "#DC2626",
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

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(currentUser.uid);
    } catch (e) {
      // Fallback: mark one by one
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => markNotificationRead(n.id)));
    }
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      try { await markNotificationRead(notif.id); } catch (e) { }
    }
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 680 }}>
        <PageHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          action={unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              ✓ Mark all read
            </Button>
          )}
        />

        {loading ? (
          <Spinner center />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications yet"
            description="You will receive notifications here for orders, payments, offers, and announcements."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map(n => {
              const color = NOTIF_COLORS[n.type] || "#6B7280";
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "16px 18px",
                    background: n.read ? "var(--surface)" : "#EEF3FF",
                    border: "1px solid " + (n.read ? "var(--border)" : "#C7D7FD"),
                    borderLeft: `4px solid ${n.read ? "var(--border)" : color}`,
                    borderRadius: "var(--radius-lg)",
                    cursor: n.link ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (n.link) e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: color + "18",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 19,
                  }}>
                    {NOTIF_ICONS[n.type] || "🔔"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: n.read ? 500 : 700,
                      fontSize: 14,
                      fontFamily: "var(--font-body)",
                      marginBottom: 3,
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {n.body}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                      {n.createdAt?.seconds
                        ? new Date(n.createdAt.seconds * 1000).toLocaleString("en-GH", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "Just now"
                      }
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: color, marginTop: 5, flexShrink: 0,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
