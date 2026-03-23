import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { updateRequest, logAdminAction } from "../../firebase/db";
import { Spinner, Button, Badge, StatusBadge, PageHeader, EmptyState, toast } from "../../components/UI";

export function AdminRequests() {
  const { userDoc: adminDoc } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "requests"), orderBy("createdAt", "desc")));
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleClose = async (id) => {
    await updateRequest(id, { status: "closed" });
    await logAdminAction(adminDoc.uid, "closeRequest", { requestId: id });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "closed" } : r));
    toast.success("Request closed");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "requests", id));
    await logAdminAction(adminDoc.uid, "deleteRequest", { requestId: id });
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.success("Request deleted");
  };

  return (
    <div>
      <PageHeader title="Manage Requests" subtitle={`${requests.length} requests`} />
      {loading ? <Spinner center /> : requests.length === 0 ? (
        <EmptyState icon="📋" title="No requests" />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Buyer</th><th>Budget</th>
                <th>Category</th><th>Offers</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, maxWidth: 180 }}>
                    <div className="truncate">{r.title}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{r.buyerName}</td>
                  <td>{r.budget > 0 ? `GHS ${r.budget}` : "—"}</td>
                  <td><Badge type="muted">{r.category}</Badge></td>
                  <td>{r.offerCount || 0}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {r.status === "open" && (
                        <Button size="sm" variant="secondary" onClick={() => handleClose(r.id)}>Close</Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>🗑</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
