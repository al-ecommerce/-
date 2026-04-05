import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment, writeBatch, arrayUnion
} from "firebase/firestore";
import { db } from "./config";

// â”€â”€â”€ USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createUserDoc = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    role: "buyer",
    isVerified: false,
    isSeller: false,
    isSellerVerified: false,
    isSuspended: false,
    isBanned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getUserDoc = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * getPublicSellerProfile
 * Safe to call for guests and logged-in users alike.
 * Returns only the public-facing seller fields â€” never throws.
 * Use this anywhere a seller profile is loaded for display purposes
 * (product pages, service pages, store pages) instead of getUserDoc.
 */
export const getPublicSellerProfile = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    // Return ONLY fields safe to expose publicly.
    // Private fields (role, isSuspended, isBanned, email, etc.) are stripped.
    return {
      id:               snap.id,
      displayName:      d.displayName      || "",
      location:         d.location         || "",
      city:             d.city             || "",
      region:           d.region           || "",
      address:          d.address          || "",   // public landmark / area
      town:             d.town             || "",
      isSellerVerified: d.isSellerVerified || false,
      isSeller:         d.isSeller         || false,
      // Phone & WhatsApp: included so the SellerCard reveal-button works for
      // logged-in users. The component is responsible for masking these for guests.
      phone:            d.phone            || "",
      whatsapp:         d.whatsapp         || "",
    };
  } catch (e) {
    // Firestore permission denied (guest reading a non-seller doc, network error, etc.)
    // Return null gracefully so the page never crashes.
    console.warn("getPublicSellerProfile:", e.code || e.message);
    return null;
  }
};

export const updateUserDoc = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const listenToUser = (uid, cb) =>
  onSnapshot(doc(db, "users", uid), snap => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));

// â”€â”€â”€ PRODUCTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createProduct = async (data) => {
  return await addDoc(collection(db, "products"), {
    ...data,
    status: "pending",
    featured: false,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getProducts = async (filters = {}) => {
  try {
    const constraints = [where("status", "==", "approved")];
    if (filters.sellerId) constraints.push(where("sellerId", "==", filters.sellerId));
    constraints.push(orderBy("createdAt", "desc"));
    if (filters.limit) constraints.push(limit(filters.limit));
    const snap = await getDocs(query(collection(db, "products"), ...constraints));
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (filters.category) results = results.filter(p => p.category === filters.category);
    return results;
  } catch (e) {
    console.error("getProducts error:", e.message);
    if (e.code === "failed-precondition" || e.message?.includes("index")) {
      const snap = await getDocs(query(collection(db, "products"), where("status", "==", "approved")));
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filters.sellerId) results = results.filter(p => p.sellerId === filters.sellerId);
      if (filters.category) results = results.filter(p => p.category === filters.category);
      results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (filters.limit) results = results.slice(0, filters.limit);
      return results;
    }
    return [];
  }
};

export const getProductById = async (id) => {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateProduct = async (id, data) =>
  updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });

export const deleteProduct = async (id) => deleteDoc(doc(db, "products", id));

export const getAllProducts = async () => {
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// â”€â”€â”€ SERVICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createService = async (data) =>
  addDoc(collection(db, "services"), {
    ...data, status: "pending", views: 0,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });

export const getServices = async (filters = {}) => {
  try {
    const constraints = [where("status", "==", "approved")];
    if (filters.sellerId) constraints.push(where("sellerId", "==", filters.sellerId));
    constraints.push(orderBy("createdAt", "desc"));
    if (filters.limit) constraints.push(limit(filters.limit));
    const snap = await getDocs(query(collection(db, "services"), ...constraints));
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (filters.category) results = results.filter(s => s.category === filters.category);
    return results;
  } catch (e) {
    console.error("getServices error:", e.message);
    if (e.code === "failed-precondition" || e.message?.includes("index")) {
      const snap = await getDocs(query(collection(db, "services"), where("status", "==", "approved")));
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filters.sellerId) results = results.filter(s => s.sellerId === filters.sellerId);
      if (filters.category) results = results.filter(s => s.category === filters.category);
      results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (filters.limit) results = results.slice(0, filters.limit);
      return results;
    }
    return [];
  }
};

export const getServiceById = async (id) => {
  const snap = await getDoc(doc(db, "services", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateService = async (id, data) =>
  updateDoc(doc(db, "services", id), { ...data, updatedAt: serverTimestamp() });

export const deleteService = async (id) => deleteDoc(doc(db, "services", id));

export const getAllServices = async () => {
  const snap = await getDocs(query(collection(db, "services"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// â”€â”€â”€ REQUESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createRequest = async (data) =>
  addDoc(collection(db, "requests"), {
    ...data, status: "open",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });

export const getRequests = async () => {
  try {
    const snap = await getDocs(query(collection(db, "requests"), where("status", "==", "open")));
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) {
    console.error("getRequests error:", e.message);
    try {
      const snap = await getDocs(collection(db, "requests"));
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.status === "open")
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (e2) { return []; }
  }
};

export const getAllRequestsAdmin = async () => {
  const snap = await getDocs(collection(db, "requests"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getRequestById = async (id) => {
  const snap = await getDoc(doc(db, "requests", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateRequest = async (id, data) =>
  updateDoc(doc(db, "requests", id), { ...data, updatedAt: serverTimestamp() });

export const listenToRequests = (cb) =>
  onSnapshot(
    query(collection(db, "requests"), where("status", "==", "open")),
    snap => {
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      cb(results);
    }
  );

// â”€â”€â”€ OFFERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createOffer = async (data) =>
  addDoc(collection(db, "offers"), {
    ...data, status: "pending",
    createdAt: serverTimestamp()
  });

export const getOffersForRequest = async (requestId) => {
  const snap = await getDocs(query(collection(db, "offers"), where("requestId", "==", requestId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const listenToOffersForRequest = (requestId, cb) =>
  onSnapshot(query(collection(db, "offers"), where("requestId", "==", requestId)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

export const updateOffer = async (id, data) =>
  updateDoc(doc(db, "offers", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createOrder = async (data) =>
  addDoc(collection(db, "orders"), {
    ...data, status: "pending",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });

export const getOrderById = async (id) => {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getUserOrders = async (uid) => {
  const snap = await getDocs(query(collection(db, "orders"), where("buyerId", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getSellerOrders = async (uid) => {
  const snap = await getDocs(query(collection(db, "orders"), where("sellerId", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getAllOrders = async () => {
  const snap = await getDocs(collection(db, "orders"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const updateOrder = async (id, data) =>
  updateDoc(doc(db, "orders", id), { ...data, updatedAt: serverTimestamp() });

export const listenToOrder = (id, cb) =>
  onSnapshot(
    doc(db, "orders", id),
    snap => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    err => {
      console.error("listenToOrder error:", err.code, err.message);
      cb(null);
    }
  );

// â”€â”€â”€ MESSAGES / CHAT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getChatId = (uid1, uid2) => [uid1, uid2].sort().join("_");

export const sendMessage = async (chatId, data) =>
  addDoc(collection(db, "messages", chatId, "chats"), {
    ...data, createdAt: serverTimestamp(), read: false
  });

export const listenToMessages = (chatId, cb) =>
  onSnapshot(query(collection(db, "messages", chatId, "chats"), orderBy("createdAt", "asc")),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

export const getUserChats = async (uid) => {
  const snap = await getDocs(query(collection(db, "messages"), where("participants", "array-contains", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createOrGetChat = async (uid1, uid2) => {
  const chatId = getChatId(uid1, uid2);
  await setDoc(doc(db, "messages", chatId), {
    participants: [uid1, uid2],
    lastMessage: "",
    updatedAt: serverTimestamp()
  }, { merge: true });
  return chatId;
};

// â”€â”€â”€ REVIEWS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createReview = async (data) =>
  addDoc(collection(db, "reviews"), { ...data, createdAt: serverTimestamp() });

export const getReviewsForTarget = async (targetId) => {
  const snap = await getDocs(query(collection(db, "reviews"), where("targetId", "==", targetId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// â”€â”€â”€ BUYER REVIEWS (Seller rates Buyer) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createBuyerReview = async (data) => {
  try {
    const docRef = await addDoc(collection(db, "buyerReviews"), {
      buyerId:    data.buyerId,
      buyerName:  data.buyerName  || "",
      sellerId:   data.sellerId,
      sellerName: data.sellerName || "",
      orderId:    data.orderId,
      rating:     data.rating,
      comment:    data.comment    || "",
      createdAt:  serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating buyer review:", error);
    throw error;
  }
};

// â”€â”€â”€ NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createNotification = async (uid, data) =>
  addDoc(collection(db, "notifications"), {
    ...data, uid, read: false, createdAt: serverTimestamp()
  });

export const listenToNotifications = (uid, cb) => {
  return onSnapshot(
    query(collection(db, "notifications"), where("uid", "==", uid), limit(50)),
    snap => {
      const notifs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 30);
      cb(notifs);
    },
    err => {
      console.error("listenToNotifications error:", err.message);
      cb([]);
    }
  );
};

export const markNotificationRead = async (id) =>
  updateDoc(doc(db, "notifications", id), { read: true });

export const markAllNotificationsRead = async (uid) => {
  const snap = await getDocs(query(
    collection(db, "notifications"),
    where("uid", "==", uid),
    where("read", "==", false)
  ));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};

// â”€â”€â”€ REPORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createReport = async (data) =>
  addDoc(collection(db, "reports"), { ...data, status: "pending", createdAt: serverTimestamp() });

export const getAllReports = async () => {
  const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateReport = async (id, data) =>
  updateDoc(doc(db, "reports", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ ADMIN LOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const logAdminAction = async (adminId, action, details = {}) =>
  addDoc(collection(db, "adminLogs"), {
    adminId, action, details, createdAt: serverTimestamp()
  });

export const getAdminLogs = async () => {
  const snap = await getDocs(query(collection(db, "adminLogs"), orderBy("createdAt", "desc"), limit(100)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// â”€â”€â”€ SELLER VERIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const applyForSellerVerification = async (uid, data) =>
  setDoc(doc(db, "sellerVerification", uid), {
    ...data, uid, status: "pending", createdAt: serverTimestamp()
  });

export const getSellerVerification = async (uid) => {
  const snap = await getDoc(doc(db, "sellerVerification", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllSellerVerifications = async () => {
  const snap = await getDocs(query(collection(db, "sellerVerification"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateSellerVerification = async (uid, data) =>
  updateDoc(doc(db, "sellerVerification", uid), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ WALLET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getWallet = async (uid) => {
  const snap = await getDoc(doc(db, "wallets", uid));
  if (!snap.exists()) {
    await setDoc(doc(db, "wallets", uid), { uid, balance: 0, currency: "USD", createdAt: serverTimestamp() });
    return { id: uid, uid, balance: 0, currency: "USD" };
  }
  return { id: snap.id, ...snap.data() };
};

export const listenToWallet = (uid, cb) =>
  onSnapshot(doc(db, "wallets", uid), snap => {
    if (!snap.exists()) cb({ uid, balance: 0 });
    else cb({ id: snap.id, ...snap.data() });
  });

export const creditWallet = async (uid, amount, note = "") => {
  const batch = writeBatch(db);
  batch.update(doc(db, "wallets", uid), { balance: increment(amount), updatedAt: serverTimestamp() });
  const txRef = doc(collection(db, "transactions"));
  batch.set(txRef, { uid, type: "credit", amount, note, createdAt: serverTimestamp() });
  await batch.commit();
};

export const debitWallet = async (uid, amount, note = "") => {
  const wallet = await getWallet(uid);
  if (wallet.balance < amount) throw new Error("Insufficient balance");
  const batch = writeBatch(db);
  batch.update(doc(db, "wallets", uid), { balance: increment(-amount), updatedAt: serverTimestamp() });
  const txRef = doc(collection(db, "transactions"));
  batch.set(txRef, { uid, type: "debit", amount, note, createdAt: serverTimestamp() });
  await batch.commit();
};

export const getTransactions = async (uid) => {
  const snap = await getDocs(query(collection(db, "transactions"), where("uid", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getAllTransactions = async () => {
  const snap = await getDocs(collection(db, "transactions"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

// â”€â”€â”€ ESCROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createEscrow = async (data) =>
  addDoc(collection(db, "escrow"), {
    ...data, status: "held", createdAt: serverTimestamp()
  });

export const getEscrowByOrder = async (orderId) => {
  const snap = await getDocs(query(collection(db, "escrow"), where("orderId", "==", orderId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))[0] || null;
};

export const getAllEscrow = async () => {
  const snap = await getDocs(query(collection(db, "escrow"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateEscrow = async (id, data) =>
  updateDoc(doc(db, "escrow", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ DISPUTE EVIDENCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const submitDisputeEvidence = async (orderId, userId, data) => {
  try {
    const docRef = await addDoc(collection(db, "disputes"), {
      orderId,
      submittedBy:  userId,
      description:  data.description  || "",
      photoURL:     data.photoURL      || "",
      videoURL:     data.videoURL      || "",
      chatSummary:  data.chatSummary   || "",
      buyerId:      data.buyerId,
      sellerId:     data.sellerId,
      itemTitle:    data.itemTitle,
      orderRef:     data.orderRef,
      status:       "pending",
      createdAt:    serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error submitting dispute evidence:", error);
    throw error;
  }
};

// â”€â”€â”€ SUBSCRIPTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createSubscription = async (data) =>
  addDoc(collection(db, "subscriptions"), { ...data, createdAt: serverTimestamp() });

export const getUserSubscription = async (uid) => {
  const snap = await getDocs(query(
    collection(db, "subscriptions"),
    where("uid", "==", uid),
    where("status", "==", "active")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))[0] || null;
};

// â”€â”€â”€ FEATURED LISTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createFeaturedListing = async (data) =>
  addDoc(collection(db, "featuredListings"), { ...data, status: "pending", createdAt: serverTimestamp() });

export const getFeaturedListings = async () => {
  const snap = await getDocs(query(collection(db, "featuredListings"), where("status", "==", "approved")));
  const now  = Date.now();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(f => {
      if (!f.expiresAt) return true;
      const exp = f.expiresAt?.seconds ? f.expiresAt.seconds * 1000 : new Date(f.expiresAt).getTime();
      return exp > now;
    });
};

export const getAllFeaturedListings = async () => {
  const snap = await getDocs(collection(db, "featuredListings"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const updateFeaturedListing = async (id, data) =>
  updateDoc(doc(db, "featuredListings", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ ADS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createAd = async (data) =>
  addDoc(collection(db, "ads"), {
    ...data, status: "pending", clicks: 0, impressions: 0, createdAt: serverTimestamp()
  });

export const getApprovedAds = async () => {
  const snap = await getDocs(query(collection(db, "ads"), where("status", "==", "approved")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllAds = async () => {
  const snap = await getDocs(collection(db, "ads"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const updateAd = async (id, data) =>
  updateDoc(doc(db, "ads", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ WITHDRAWALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createWithdrawal = async (data) =>
  addDoc(collection(db, "withdrawals"), { ...data, status: "pending", createdAt: serverTimestamp() });

export const getUserWithdrawals = async (uid) => {
  const snap = await getDocs(query(collection(db, "withdrawals"), where("uid", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getAllWithdrawals = async () => {
  const snap = await getDocs(collection(db, "withdrawals"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const updateWithdrawal = async (id, data) =>
  updateDoc(doc(db, "withdrawals", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ PLATFORM FEES / SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getPlatformSettings = async () => {
  const snap = await getDoc(doc(db, "platformFees", "settings"));
  if (!snap.exists()) return {
    commissionRate: 10, escrowFee: 2, withdrawalFee: 1.5,
    sellerVerificationFee: 50, featuredListingFee: 20,
    basicSubscriptionPrice: 10, premiumSubscriptionPrice: 30
  };
  return { id: snap.id, ...snap.data() };
};

export const updatePlatformSettings = async (data) =>
  setDoc(doc(db, "platformFees", "settings"), { ...data, updatedAt: serverTimestamp() }, { merge: true });

export const listenToPlatformSettings = (cb) =>
  onSnapshot(doc(db, "platformFees", "settings"), snap =>
    cb(snap.exists() ? snap.data() : {
      commissionRate: 10, escrowFee: 2, withdrawalFee: 1.5,
      sellerVerificationFee: 50, featuredListingFee: 20,
      basicSubscriptionPrice: 10, premiumSubscriptionPrice: 30
    }));

// â”€â”€â”€ MOMO PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const submitMomoPayment = async (data) =>
  addDoc(collection(db, "momoPayments"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp()
  });

export const getUserMomoPayments = async (uid) => {
  const snap = await getDocs(query(collection(db, "momoPayments"), where("uid", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getAllMomoPayments = async () => {
  const snap = await getDocs(collection(db, "momoPayments"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const updateMomoPayment = async (id, data) =>
  updateDoc(doc(db, "momoPayments", id), { ...data, updatedAt: serverTimestamp() });

// â”€â”€â”€ ACCOUNT DELETION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const deleteUserData = async (uid) => {
  const ownedCollections = [
    ["notifications",      "uid"],
    ["wallets",            "uid"],
    ["withdrawals",        "uid"],
    ["subscriptions",      "uid"],
    ["momoPayments",       "uid"],
    ["sellerVerification", "uid"],
    ["transactions",       "uid"],
  ];
  const roleCollections = [
    ["products",         "sellerId"],
    ["services",         "sellerId"],
    ["requests",         "buyerId"],
    ["featuredListings", "sellerId"],
    ["ads",              "advertiserId"],
  ];

  const allCollections = [...ownedCollections, ...roleCollections];
  const deletePromises = [];

  for (const [colName, field] of allCollections) {
    try {
      const snap = await getDocs(query(collection(db, colName), where(field, "==", uid)));
      snap.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    } catch (e) { console.warn(`Skip delete ${colName}:`, e.message); }
  }

  deletePromises.push(deleteDoc(doc(db, "users", uid)));
  await Promise.allSettled(deletePromises);
};

// â”€â”€â”€ AUTO-RELEASE DELIVERY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const setDeliveryDeadline = async (orderId, days = 7) => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return updateDoc(doc(db, "orders", orderId), {
    deliveredAt:     new Date(),
    releaseDeadline: deadline,
    status:          "shipped",
    updatedAt:       serverTimestamp(),
  });
};

export const processAutoReleases = async () => {
  const now  = new Date();
  const snap = await getDocs(query(
    collection(db, "orders"),
    where("status", "==", "shipped")
  ));
  const overdue = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => {
      if (!o.releaseDeadline) return false;
      const dl = o.releaseDeadline?.seconds
        ? new Date(o.releaseDeadline.seconds * 1000)
        : new Date(o.releaseDeadline);
      return dl < now;
    });
  return overdue;
};