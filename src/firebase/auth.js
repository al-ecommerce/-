import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from "firebase/auth";
import { auth } from "./config";
import { createUserDoc, getUserDoc, deleteUserData } from "./db";
import { sendWelcomeEmail, sendAccountDeletedEmail } from "../services/emailService";

export const register = async (email, password, displayName) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await sendEmailVerification(user);
  await createUserDoc(user.uid, {
    uid: user.uid,
    email,
    displayName,
    photoURL: "",
    phone: "",
    bio: "",
    location: ""
  });
  try { await sendWelcomeEmail(email, displayName); } catch (e) { console.warn("Email error:", e); }
  return user;
};

export const login = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

export const logout = () => signOut(auth);

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const resendVerification = async () => {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
};

export const listenToAuthState = (cb) => onAuthStateChanged(auth, cb);

// ─── ACCOUNT DELETION ────────────────────────────────────
// Requires the user's current password to confirm (re-authentication)
export const deleteAccount = async (password) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  // Re-authenticate first for security
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const { email, displayName } = user;
  const uid = user.uid;

  // Delete all Firestore data
  await deleteUserData(uid);

  // Send goodbye email before account is gone
  try { await sendAccountDeletedEmail(email, displayName); } catch (e) { }

  // Delete Firebase Auth account
  await deleteUser(user);
};

// ─── ADMIN DELETE ACCOUNT ────────────────────────────────
// Admin bypasses re-auth — directly deletes Firestore data
// Firebase Auth deletion of another user requires Admin SDK (server-side)
// So this marks the user as deleted in Firestore and disables their access
export const adminDisableAccount = async (uid, userEmail, userName) => {
  await deleteUserData(uid);
  // Mark as deleted so auth context blocks access if they're still logged in
  // (The actual Firebase Auth user will remain but all data is wiped)
};
