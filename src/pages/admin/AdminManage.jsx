import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers, updateUserDoc, getAllProducts, getAllServices,
  updateProduct, updateService, deleteProduct, deleteService,
  getAllSellerVerifications, updateSellerVerification, logAdminAction, createNotification
} from "../../firebase/db";
import { sendSellerApprovalEmail } from "../../services/emailService";
import { Spinner, Button, Badge, StatusBadge, PageHeader, Modal, Alert, ConfirmDialog, SearchBar, FormSelect, toast } from "../../components/UI";

// ─── MANAGE USERS ──────────────────────────────────────────
export function AdminUsers() {
  const { userDoc: adminDoc } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getAllUsers().then(data => { setUsers(data); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.includes(search);
    const matchFilter = filter === "all" || (filter === "sellers" && u.isSeller) || (filter === "buyers" && !u.isSeller) || (filter === "suspended" && u.isSuspended) || (filter === "banned" && u.isBanned);
    return matchSearch && matchFilter;
  });

  const handleAction = async (uid, action) => {
    const data = {
      suspend: { isSuspended: true, isBanned: false },
      unsuspend: { isSuspended: false },
      ban: { isBanned: true, isSuspended: false },
      unban: { isBanned: false },
      makeAdmin: { role: "admin" },
      removeAdmin: { role: "buyer" },
    }[action];
    if (!data) return;
    await updateUserDoc(uid, data);
    await logAdminAction(adminDoc.uid, action, { targetUid: uid });
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, ...data } : u));
    toast.success("Action completed");
  };

  return (
    <div>
      <PageHeader title="Manage Users" subtitle={`${users.length} registered users`} />
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px" }}><SearchBar value={search} onChange={setSearch} placeholder="Search users..." /></div>
        <select className="form-select" style={{ flex: "0 0 140px" }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="sellers">Sellers</option>
          <option value="buyers">Buyers</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                  </td>
                  <td>
                    <Badge type={u.role === "admin" ? "danger" : u.isSeller ? "primary" : "muted"}>
                      {u.role === "admin" ? "Admin" : u.isSeller ? "Seller" : "Buyer"}
                    </Badge>
                    {u.isSellerVerified && <Badge type="success" style={{ marginLeft: 4 }}>✓ Verified</Badge>}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {u.isBanned ? <Badge type="danger">Banned</Badge> :
                      u.isSuspended ? <Badge type="warning">Suspended</Badge> :
                        <Badge type="success">Active</Badge>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {!u.isSuspended && !u.isBanned && (
                        <Button size="sm" variant="secondary" onClick={() => handleAction(u.id, "suspend")}>Suspend</Button>
                      )}
                      {u.isSuspended && (
                        <Button size="sm" variant="success" onClick={() => handleAction(u.id, "unsuspend")}>Restore</Button>
                      )}
                      {!u.isBanned && (
                        <Button size="sm" variant="danger" onClick={() => handleAction(u.id, "ban")}>Ban</Button>
                      )}
                      {u.isBanned && (
                        <Button size="sm" variant="success" onClick={() => handleAction(u.id, "unban")}>Unban</Button>
                      )}
                      {u.role !== "admin" && (
                        <Button size="sm" variant="secondary" onClick={() => handleAction(u.id, "makeAdmin")}>Make Admin</Button>
                      )}
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

// ─── MANAGE SELLERS ────────────────────────────────────────
export function AdminSellers() {
  const { userDoc: adminDoc } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then(all => { setSellers(all.filter(u => u.isSeller)); setLoading(false); });
  }, []);

  const handleApprove = async (seller, approved) => {
    await updateUserDoc(seller.id, {
      sellerStatus: approved ? "approved" : "rejected",
      isSellerApproved: approved
    });
    await logAdminAction(adminDoc.uid, approved ? "approveSeller" : "rejectSeller", { targetUid: seller.id });
    await createNotification(seller.id, {
      title: approved ? "Seller Account Approved!" : "Seller Application Update",
      body: approved ? "Your seller account has been approved. Start listing!" : "Your seller application was not approved at this time.",
      type: "system"
    });
    try { await sendSellerApprovalEmail(seller.email, seller.displayName, approved ? "approved" : "rejected"); } catch (e) { }
    setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, sellerStatus: approved ? "approved" : "rejected" } : s));
    toast.success(approved ? "Seller approved!" : "Seller rejected");
  };

  return (
    <div>
      <PageHeader title="Manage Sellers" subtitle={`${sellers.length} sellers`} />
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Seller</th><th>Since</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {sellers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.displayName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.email}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{s.sellerSince ? new Date(s.sellerSince).toLocaleDateString() : "—"}</td>
                  <td><Badge type={s.isSellerVerified ? "success" : "muted"}>{s.isSellerVerified ? "✓ Verified" : "Not Verified"}</Badge></td>
                  <td><Badge type={s.sellerStatus === "approved" ? "success" : s.sellerStatus === "rejected" ? "danger" : "warning"}>{s.sellerStatus || "Pending"}</Badge></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {s.sellerStatus !== "approved" && <Button size="sm" variant="success" onClick={() => handleApprove(s, true)}>✓ Approve</Button>}
                      {s.sellerStatus !== "rejected" && <Button size="sm" variant="danger" onClick={() => handleApprove(s, false)}>✕ Reject</Button>}
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

// ─── MANAGE PRODUCTS ───────────────────────────────────────
export function AdminProducts() {
  const { userDoc: adminDoc } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllProducts().then(data => { setProducts(data); setLoading(false); });
  }, []);

  const handleStatusChange = async (id, status) => {
    await updateProduct(id, { status });
    await logAdminAction(adminDoc.uid, `product_${status}`, { productId: id });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success(`Product ${status}`);
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    await logAdminAction(adminDoc.uid, "deleteProduct", { productId: id });
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Product deleted");
  };

  const filtered = products.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Manage Products" subtitle={`${products.length} total listings`} />
      <div style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
      </div>
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Seller</th><th>Price</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, maxWidth: 180 }}><div className="truncate">{p.title}</div></td>
                  <td style={{ fontSize: 13 }}>{p.sellerName}</td>
                  <td style={{ fontWeight: 700 }}>GHS {p.price?.toFixed(2)}</td>
                  <td><Badge type="muted">{p.category}</Badge></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {p.status !== "approved" && <Button size="sm" variant="success" onClick={() => handleStatusChange(p.id, "approved")}>✓</Button>}
                      {p.status !== "rejected" && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(p.id, "rejected")}>✕</Button>}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(p.id)}>🗑</Button>
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

// ─── MANAGE SERVICES ───────────────────────────────────────
export function AdminServices() {
  const { userDoc: adminDoc } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllServices().then(data => { setServices(data); setLoading(false); });
  }, []);

  const handleStatusChange = async (id, status) => {
    await updateService(id, { status });
    await logAdminAction(adminDoc.uid, `service_${status}`, { serviceId: id });
    setServices(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.success(`Service ${status}`);
  };

  const handleDelete = async (id) => {
    await deleteService(id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success("Service deleted");
  };

  return (
    <div>
      <PageHeader title="Manage Services" subtitle={`${services.length} services`} />
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Seller</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}><div className="truncate" style={{ maxWidth: 180 }}>{s.title}</div></td>
                  <td style={{ fontSize: 13 }}>{s.sellerName}</td>
                  <td style={{ fontWeight: 700 }}>GHS {s.price?.toFixed(2)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {s.status !== "approved" && <Button size="sm" variant="success" onClick={() => handleStatusChange(s.id, "approved")}>✓</Button>}
                      {s.status !== "rejected" && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(s.id, "rejected")}>✕</Button>}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>🗑</Button>
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

// ─── SELLER VERIFICATION ───────────────────────────────────
export function AdminVerification() {
  const { userDoc: adminDoc } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSellerVerifications().then(data => { setVerifications(data); setLoading(false); });
  }, []);

  const handleDecision = async (uid, approved) => {
    await updateSellerVerification(uid, { status: approved ? "approved" : "rejected" });
    if (approved) await updateUserDoc(uid, { isSellerVerified: true });
    await logAdminAction(adminDoc.uid, approved ? "verifyApproved" : "verifyRejected", { uid });
    await createNotification(uid, {
      title: approved ? "✓ Seller Verified!" : "Verification Rejected",
      body: approved ? "Congratulations! You're now a verified seller on ASVAN." : "Your verification was not approved. Contact support for details.",
      type: "system"
    });
    setVerifications(prev => prev.map(v => v.id === uid ? { ...v, status: approved ? "approved" : "rejected" } : v));
    toast.success(approved ? "Seller verified!" : "Verification rejected");
  };

  return (
    <div>
      <PageHeader title="Seller Verification" subtitle="Review and approve seller verification requests" />
      {loading ? <Spinner center /> : verifications.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">✓</div><h3>No pending verifications</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Seller</th><th>Business</th><th>Fee Paid</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {verifications.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.businessName}</td>
                  <td style={{ fontSize: 13 }}>{v.email}</td>
                  <td>GHS {v.feePaid}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {v.createdAt?.seconds ? new Date(v.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {v.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" variant="success" onClick={() => handleDecision(v.id, true)}>✓ Verify</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDecision(v.id, false)}>✕ Reject</Button>
                      </div>
                    )}
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
